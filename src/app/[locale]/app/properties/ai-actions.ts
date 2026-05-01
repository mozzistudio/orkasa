'use server'

import {
  getAnthropicClient,
  LISTING_STUDIO_MODEL,
  LISTING_STUDIO_SYSTEM_PROMPT,
} from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type Anthropic from '@anthropic-ai/sdk'

type Property = Database['public']['Tables']['properties']['Row']

// =============================================================================
// Listing review — analyzes photos + text and returns suggestions to validate
// =============================================================================

export type ReviewListingInput = {
  title: string
  description?: string | null
  property_type: string
  listing_type: string
  bedrooms?: number | null
  bathrooms?: number | null
  area_m2?: number | null
  price?: number | null
  currency?: string | null
  neighborhood?: string | null
  city?: string | null
  /** Public URLs of the property images (max 8 reviewed) */
  imageUrls: string[]
}

export type TextVariant = {
  tone: 'formal' | 'social' | 'concise'
  description: string
}

export type PhotoReview = {
  /** Index in the original imageUrls array */
  index: number
  /** Score 0-100 — marketing quality */
  score: number
  /** One-line critique in Spanish */
  critique: string
  /** Suggested accessibility alt text in Spanish */
  altText: string
  /** Suggested final position (0 = hero, 1 = second, ...) */
  suggestedOrder: number
}

export type ReviewListingResult =
  | {
      textVariants: TextVariant[]
      photoReview: PhotoReview[]
    }
  | { error: string }

const REVIEW_SYSTEM_PROMPT = `${LISTING_STUDIO_SYSTEM_PROMPT}

# Review mode

You are now reviewing a draft listing. Output STRICT JSON in this shape:

{
  "textVariants": [
    { "tone": "formal", "description": "..." },
    { "tone": "social", "description": "..." },
    { "tone": "concise", "description": "..." }
  ],
  "photoReview": [
    { "index": 0, "score": 87, "critique": "...", "altText": "...", "suggestedOrder": 0 }
  ]
}

# Text variants — exactly 3
- tone "formal": portal-style, factual, 110-160 words. Like the brand voice rules above.
- tone "social": Facebook/Instagram-friendly, hook-first, 80-120 words, line breaks between sentences. Casual but professional Spanish.
- tone "concise": mobile-first, 50-80 words, 1-2 short paragraphs, the absolute essentials.

All three respect the brand voice (no "perfect/luxury/dream", sentence case, no emojis, never start with "Discover").

# Photo review — one entry per input image
- index: matches the input image index (0-based)
- score: 0-100. Anchor: 90+ professional/wide-angle/well-lit. 70-89 good amateur. 50-69 acceptable but flawed. <50 reshoot recommended.
- critique: one short Spanish sentence about lighting, angle, framing, clutter, or missing elements. Be specific ("Sombra dura en pared izquierda, considerar reshoot en hora dorada"). Don't praise — only flag what to improve, OR confirm "Bien iluminada, encuadre amplio."
- altText: descriptive Spanish sentence for screen readers (15-25 words). E.g. "Sala de estar con sofá gris, ventanal al fondo y piso de madera clara."
- suggestedOrder: 0 = hero (use the most photogenic, wide-angle, well-lit photo). Then 1, 2, 3... ordered by marketing impact.

# Hard rules
- Output ONLY the JSON object. No preamble, no markdown fences, no explanation.
- Be honest about photo quality — these are real listings, brokers need actionable feedback, not flattery.
- The 3 text variants must be meaningfully different (not just length differences).`

function buildBrief(input: ReviewListingInput): string {
  const facts = [
    `Título: ${input.title}`,
    `Tipo: ${input.property_type}`,
    `Operación: ${input.listing_type}`,
    input.bedrooms != null ? `Dormitorios: ${input.bedrooms}` : null,
    input.bathrooms != null ? `Baños: ${input.bathrooms}` : null,
    input.area_m2 != null ? `Área: ${input.area_m2} m²` : null,
    input.price != null
      ? `Precio: ${input.currency ?? 'USD'} ${input.price.toLocaleString('en-US')}`
      : null,
    input.neighborhood ? `Barrio: ${input.neighborhood}` : null,
    input.city ? `Ciudad: ${input.city}` : null,
    input.description ? `Descripción actual del agente: ${input.description}` : null,
  ].filter(Boolean)
  return [
    'Revisá esta propiedad inmobiliaria. Generá 3 variantes de descripción Y revisá cada foto.',
    '',
    facts.join('\n'),
    '',
    `Total de fotos a revisar: ${input.imageUrls.length}.`,
    '',
    'Devolvé únicamente el JSON especificado, sin texto adicional.',
  ].join('\n')
}

export async function reviewListing(
  input: ReviewListingInput,
): Promise<ReviewListingResult> {
  const client = getAnthropicClient()
  if (!client) {
    return {
      error:
        'ANTHROPIC_API_KEY no configurada. Agregala en .env.local para usar AI Listing Studio.',
    }
  }

  if (!input.title || !input.property_type || !input.listing_type) {
    return { error: 'Faltan título, tipo o operación.' }
  }
  if (input.imageUrls.length === 0) {
    return { error: 'Subí al menos una foto antes de revisar con IA.' }
  }

  // Cap at 8 photos for the request — vision tokens add up fast
  const reviewedImages = input.imageUrls.slice(0, 8)

  // Build multimodal user message: text brief + each image
  const content: Anthropic.ContentBlockParam[] = [
    { type: 'text', text: buildBrief({ ...input, imageUrls: reviewedImages }) },
  ]
  for (let i = 0; i < reviewedImages.length; i++) {
    const url = reviewedImages[i]
    if (!url) continue
    content.push(
      {
        type: 'text',
        text: `Foto índice ${i}:`,
      },
      {
        type: 'image',
        source: { type: 'url', url },
      },
    )
  }

  try {
    const response = await client.messages.create({
      model: LISTING_STUDIO_MODEL,
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: REVIEW_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { error: 'La IA no devolvió texto. Intentá de nuevo.' }
    }

    // Extract JSON — sometimes Claude wraps it in markdown despite instructions
    let raw = textBlock.text.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return {
        error:
          'La IA devolvió un formato inválido. Intentá de nuevo (a veces ayuda).',
      }
    }

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('textVariants' in parsed) ||
      !('photoReview' in parsed)
    ) {
      return { error: 'Formato de respuesta inválido.' }
    }

    const obj = parsed as {
      textVariants: TextVariant[]
      photoReview: PhotoReview[]
    }

    return {
      textVariants: obj.textVariants.slice(0, 3),
      photoReview: obj.photoReview.slice(0, reviewedImages.length),
    }
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message }
    }
    return { error: 'Error desconocido al revisar el listing.' }
  }
}

// =============================================================================
// generateTitleAndDescription — wizard step 3
// =============================================================================

const GENERATE_SYSTEM_PROMPT = `${LISTING_STUDIO_SYSTEM_PROMPT}

# Generation mode

You are generating a title and description for a new real estate listing draft.
Output STRICT JSON only:

{ "title": "...", "description": "..." }

# Title
- Max 120 characters
- Include neighborhood, property type, and standout feature (if visible in photos)
- Sentence case, no ALL CAPS
- No quotes, no emojis

# Description
- Sale: 110-160 words. Rent: 60-100 words.
- Start with the strongest selling point (view, location, size, condition)
- Mention specs naturally (don't just list them)
- End with location context (barrio character, nearby landmarks)
- Follow all brand voice rules from above

# Output discipline
- Output ONLY the JSON object, no markdown fences, no explanation.
- Spanish appropriate to the property's country/region.`

export async function generateTitleAndDescription(
  propertyId: string,
): Promise<{ title: string; description: string } | { error: string }> {
  const client = getAnthropicClient()
  if (!client) {
    return {
      error:
        'ANTHROPIC_API_KEY no configurada. Agregala en .env.local para usar IA.',
    }
  }

  const supabase = await createClient()
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle<Property>()
  if (!property) return { error: 'Propiedad no encontrada.' }

  const facts = [
    `Tipo: ${property.property_type}`,
    `Operación: ${property.listing_type}`,
    property.bedrooms != null ? `Dormitorios: ${property.bedrooms}` : null,
    property.bathrooms != null ? `Baños: ${Number(property.bathrooms)}` : null,
    property.area_m2 != null ? `Área: ${Number(property.area_m2)} m²` : null,
    property.price != null
      ? `Precio: ${property.currency ?? 'USD'} ${Number(property.price).toLocaleString('en-US')}`
      : null,
    property.neighborhood ? `Barrio: ${property.neighborhood}` : null,
    property.city ? `Ciudad: ${property.city}` : null,
    property.address ? `Dirección: ${property.address}` : null,
  ].filter(Boolean)

  const content: Anthropic.ContentBlockParam[] = [
    {
      type: 'text',
      text: [
        'Generá un título y descripción para esta propiedad inmobiliaria.',
        '',
        facts.join('\n'),
        '',
        'Devolvé únicamente el JSON {"title": "...", "description": "..."} sin texto adicional.',
      ].join('\n'),
    },
  ]

  const images = (property.images as { path: string; url: string }[]) ?? []
  const heroImages = images.slice(0, 4)
  for (let i = 0; i < heroImages.length; i++) {
    const img = heroImages[i]
    if (!img) continue
    content.push(
      { type: 'text', text: `Foto ${i + 1}:` },
      { type: 'image', source: { type: 'url', url: img.url } },
    )
  }

  try {
    const response = await client.messages.create({
      model: LISTING_STUDIO_MODEL,
      max_tokens: 2000,
      system: [
        {
          type: 'text',
          text: GENERATE_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { error: 'La IA no devolvió texto.' }
    }

    let raw = textBlock.text.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsed: { title?: string; description?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { error: 'Formato de respuesta inválido.' }
    }

    const title = (parsed.title ?? '').trim()
    const description = (parsed.description ?? '').trim()
    if (!title || !description) {
      return { error: 'La IA no generó título o descripción.' }
    }

    return { title, description }
  } catch (err) {
    if (err instanceof Error) return { error: err.message }
    return { error: 'Error desconocido al generar contenido.' }
  }
}

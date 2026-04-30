'use server'

import { revalidatePath } from 'next/cache'
import {
  getAnthropicClient,
  LISTING_STUDIO_MODEL,
  LISTING_STUDIO_SYSTEM_PROMPT,
} from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import {
  getProviderMeta,
  type IntegrationProvider,
} from '@/lib/integrations'
import type { Database } from '@/lib/database.types'

type Property = Database['public']['Tables']['properties']['Row']
type Publication = Database['public']['Tables']['property_publications']['Row']

// =============================================================================
// adaptPropertyForPortal — generate per-platform title + description via Claude
// =============================================================================

export type AdaptResult =
  | {
      ok: true
      title: string
      description: string
      titleChars: number
      descriptionChars: number
      titleMax: number
      descriptionMax: number
    }
  | { ok: false; error: string }

function buildAdapterSystemPrompt(provider: IntegrationProvider): string {
  const meta = getProviderMeta(provider)
  if (!meta?.adapter) return LISTING_STUDIO_SYSTEM_PROMPT

  const { titleMax, descriptionMax, tone, allowsHashtags, appendsCta, styleNotes } =
    meta.adapter

  return `${LISTING_STUDIO_SYSTEM_PROMPT}

# Per-platform adaptation: ${meta.label}

You are adapting a master property listing for **${meta.label}**. Output STRICT JSON only:

{ "title": "...", "description": "..." }

# Hard constraints
- Title: ${titleMax > 0 ? `max ${titleMax} characters (count strictly)` : 'no title field for this platform — return empty string'}
- Description: max ${descriptionMax} characters (count strictly)
- Tone: ${tone}
  ${tone === 'factual' ? '- Spec-first, neutral, broker-to-buyer voice. Skip lifestyle copy.' : ''}
  ${tone === 'social' ? '- Hook-first opening line, line breaks every 2-3 sentences, conversational but professional.' : ''}
  ${tone === 'concise' ? '- Mobile-first, ultra-short, only essentials. Strip filler words aggressively.' : ''}
- Hashtags: ${allowsHashtags ? 'allowed at end (5-10 LATAM real-estate tags)' : 'NOT allowed — do not include any'}
- CTA: ${appendsCta ? 'append a clear contact CTA at the end ("Escribime", "Llamá al ___")' : 'do NOT append a CTA — platform injects its own contact form'}

# Platform-specific style notes
${styleNotes}

# Output discipline
- Output ONLY the JSON object, no markdown fences, no explanation.
- Both fields in the same Spanish dialect appropriate to the platform.
- Stay under the character limits — count yourself, do not exceed.`
}

function buildBrief(property: Property): string {
  const facts = [
    `Título maestro: ${property.title}`,
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
    property.country_code ? `País: ${property.country_code}` : null,
    property.description
      ? `Descripción maestro:\n${property.description}`
      : null,
  ].filter(Boolean)

  return [
    'Adaptá esta propiedad inmobiliaria para la plataforma especificada en el system prompt.',
    '',
    facts.join('\n'),
    '',
    'Devolvé únicamente el JSON {"title": "...", "description": "..."} sin texto adicional.',
  ].join('\n')
}

export async function adaptPropertyForPortal(
  propertyId: string,
  provider: IntegrationProvider,
): Promise<AdaptResult> {
  const client = getAnthropicClient()
  if (!client) {
    return {
      ok: false,
      error: 'ANTHROPIC_API_KEY no configurada.',
    }
  }
  const meta = getProviderMeta(provider)
  if (!meta) return { ok: false, error: 'Provider desconocido' }
  if (!meta.adapter) {
    return {
      ok: false,
      error: 'Esta plataforma no tiene reglas de adaptación configuradas.',
    }
  }

  const supabase = await createClient()
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle<Property>()
  if (!property) return { ok: false, error: 'Propiedad no encontrada' }

  try {
    const response = await client.messages.create({
      model: LISTING_STUDIO_MODEL,
      max_tokens: 2000,
      system: [
        {
          type: 'text',
          text: buildAdapterSystemPrompt(provider),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: buildBrief(property) }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { ok: false, error: 'La IA no devolvió texto.' }
    }
    let raw = textBlock.text.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsed: { title?: string; description?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'Formato de respuesta inválido.' }
    }

    const title = (parsed.title ?? '').trim()
    const description = (parsed.description ?? '').trim()

    if (!description) {
      return { ok: false, error: 'La IA no generó descripción.' }
    }

    return {
      ok: true,
      title,
      description,
      titleChars: title.length,
      descriptionChars: description.length,
      titleMax: meta.adapter.titleMax,
      descriptionMax: meta.adapter.descriptionMax,
    }
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message }
    return { ok: false, error: 'Error desconocido al adaptar.' }
  }
}

// =============================================================================
// savePublicationDraft — upsert a draft with the user-edited adapted copy
// =============================================================================

export async function savePublicationDraft(
  propertyId: string,
  provider: IntegrationProvider,
  data: {
    title: string
    description: string
    imagePaths: string[]
  },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) return { ok: false, error: 'No brokerage' }

  const { error } = await supabase.from('property_publications').upsert(
    {
      brokerage_id: agent.brokerage_id,
      property_id: propertyId,
      provider,
      status: 'validated',
      adapted_title: data.title,
      adapted_description: data.description,
      adapted_image_paths: data.imagePaths,
      validated_at: new Date().toISOString(),
    },
    { onConflict: 'property_id,provider' },
  )

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/app/properties/${propertyId}`)
  revalidatePath(`/app/properties/${propertyId}/publish`)
  return { ok: true }
}

// =============================================================================
// publishToPortals — mock publish (no real OAuth yet, records intent in DB)
// =============================================================================

export async function publishToPortals(
  propertyId: string,
): Promise<{ ok: boolean; published: number; error?: string }> {
  const supabase = await createClient()

  // Read all validated publications for this property
  const { data: validated, error: readErr } = await supabase
    .from('property_publications')
    .select('id, provider, status')
    .eq('property_id', propertyId)
    .eq('status', 'validated')
    .returns<Pick<Publication, 'id' | 'provider' | 'status'>[]>()

  if (readErr) return { ok: false, published: 0, error: readErr.message }
  if (!validated || validated.length === 0) {
    return {
      ok: false,
      published: 0,
      error: 'No hay publicaciones validadas para publicar.',
    }
  }

  // Mock publish: mark as published with a fake external_url. Real OAuth flows
  // will replace this per-provider — see lib/integrations.ts adapter stubs.
  const now = new Date().toISOString()
  const updates = await Promise.all(
    validated.map((pub) =>
      supabase
        .from('property_publications')
        .update({
          status: 'published',
          published_at: now,
          external_url: `https://orkasa.app/preview/${propertyId}/${pub.provider}`,
          external_id: `mock-${Date.now()}-${pub.provider}`,
        })
        .eq('id', pub.id),
    ),
  )

  const failed = updates.filter((u) => u.error).length
  const published = validated.length - failed

  revalidatePath(`/app/properties/${propertyId}`)
  revalidatePath(`/app/properties/${propertyId}/publish`)
  return { ok: failed === 0, published }
}

// =============================================================================
// removePublication — delete a draft (let user re-add later)
// =============================================================================

export async function removePublication(
  publicationId: string,
  propertyId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('property_publications')
    .delete()
    .eq('id', publicationId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/app/properties/${propertyId}/publish`)
  return { ok: true }
}

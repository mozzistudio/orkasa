'use server'

import {
  getAnthropicClient,
  LISTING_STUDIO_MODEL,
  LISTING_STUDIO_SYSTEM_PROMPT,
} from '@/lib/anthropic'

export type GenerateDescriptionInput = {
  title: string
  property_type: string
  listing_type: string
  bedrooms?: number | null
  bathrooms?: number | null
  area_m2?: number | null
  price?: number | null
  currency?: string | null
  neighborhood?: string | null
  city?: string | null
  hint?: string | null
}

export type GenerateDescriptionResult =
  | { description: string }
  | { error: string }

function formatBrief(input: GenerateDescriptionInput): string {
  const facts = [
    `Título: ${input.title}`,
    `Tipo: ${input.property_type}`,
    `Operación: ${input.listing_type}`,
    input.bedrooms !== null && input.bedrooms !== undefined ? `Dormitorios: ${input.bedrooms}` : null,
    input.bathrooms !== null && input.bathrooms !== undefined ? `Baños: ${input.bathrooms}` : null,
    input.area_m2 !== null && input.area_m2 !== undefined ? `Área: ${input.area_m2} m²` : null,
    input.price !== null && input.price !== undefined ? `Precio: ${input.currency ?? 'USD'} ${input.price.toLocaleString('en-US')}` : null,
    input.neighborhood ? `Barrio: ${input.neighborhood}` : null,
    input.city ? `Ciudad: ${input.city}` : null,
  ].filter(Boolean) as string[]

  let prompt = `Generá una descripción para esta propiedad inmobiliaria:\n\n${facts.join('\n')}`
  if (input.hint && input.hint.trim().length > 0) {
    prompt += `\n\nNotas adicionales del agente: ${input.hint.trim()}`
  }
  prompt += `\n\nDevolvé únicamente el texto de la descripción, sin encabezado ni comillas.`
  return prompt
}

export async function generateDescription(
  input: GenerateDescriptionInput,
): Promise<GenerateDescriptionResult> {
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

  try {
    const response = await client.messages.create({
      model: LISTING_STUDIO_MODEL,
      max_tokens: 800,
      // Cache the system prompt (stable across all property generations)
      system: [
        {
          type: 'text',
          text: LISTING_STUDIO_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: formatBrief(input) }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { error: 'La IA no devolvió texto. Intentá de nuevo.' }
    }

    return { description: textBlock.text.trim() }
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message }
    }
    return { error: 'Error desconocido al generar descripción.' }
  }
}

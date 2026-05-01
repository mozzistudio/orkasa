'use server'

import {
  getGeminiClient,
  GEMINI_IMAGE_MODEL,
  getEnhancementMeta,
  type EnhancementType,
} from '@/lib/gemini'
import {
  PHOTOROOM_PRESETS,
  buildPhotoroomEditUrl,
  getPhotoroomKey,
  type PhotoroomEnhancementMeta,
} from '@/lib/photoroom'
import { createClient } from '@/lib/supabase/server'

export type EnhanceResult =
  | { ok: true; path: string; url: string; applied?: string[] }
  | { ok: false; error: string }

/**
 * Enhance a property image via Gemini 2.5 Flash Image, then upload the result
 * to Supabase storage. Used for the manual "Revisar con IA" review on the
 * property edit page where the user picks a specific enhancement type
 * (sky_replace, lighting, clutter_remove, virtual_stage).
 */
export async function enhanceImage(
  sourceUrl: string,
  enhancementType: EnhancementType,
): Promise<EnhanceResult> {
  const client = getGeminiClient()
  if (!client) {
    return {
      ok: false,
      error:
        'GEMINI_API_KEY no configurada. Agregala en .env.local para usar mejoras de fotos.',
    }
  }

  const meta = getEnhancementMeta(enhancementType)
  if (!meta) {
    return { ok: false, error: 'Tipo de mejora desconocido.' }
  }

  // Auth check + brokerage scope
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
  if (!agent?.brokerage_id) {
    return { ok: false, error: 'No brokerage' }
  }

  try {
    const sourceResp = await fetch(sourceUrl)
    if (!sourceResp.ok) {
      return {
        ok: false,
        error: `No pude descargar la imagen original (${sourceResp.status})`,
      }
    }
    const sourceMime = sourceResp.headers.get('content-type') ?? 'image/jpeg'
    const sourceBuffer = Buffer.from(await sourceResp.arrayBuffer())
    const sourceB64 = sourceBuffer.toString('base64')

    const response = await client.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: sourceB64, mimeType: sourceMime } },
            { text: meta.prompt },
          ],
        },
      ],
    })

    const imagePart = response.candidates
      ?.flatMap((c) => c.content?.parts ?? [])
      .find((p) => p.inlineData?.data)

    if (!imagePart?.inlineData?.data) {
      return {
        ok: false,
        error:
          'Gemini no devolvió una imagen. Intentá con otro tipo de mejora o reintentá.',
      }
    }

    const enhancedB64 = imagePart.inlineData.data
    const enhancedMime = imagePart.inlineData.mimeType ?? 'image/jpeg'
    const enhancedBuffer = Buffer.from(enhancedB64, 'base64')

    const uploaded = await uploadToPropertyImages({
      buffer: enhancedBuffer,
      mime: enhancedMime,
      sourceUrl,
      brokerageId: agent.brokerage_id,
      tag: `enhanced-${enhancementType}`,
    })
    if (!uploaded.ok) return uploaded

    return { ok: true, path: uploaded.path, url: uploaded.url }
  } catch (err) {
    if (err instanceof Error) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Error desconocido al mejorar la imagen.' }
  }
}

/**
 * Auto-enhance via Photoroom v2/edit (AI relight + white balance / color
 * correction). Used by the wizard's step 4 — the broker confirms photos in
 * step 2, this step kicks off Photoroom in parallel for every photo. Fast,
 * deterministic, and preserves the room's content (no hallucinated furniture).
 *
 * Falls back to Gemini's `lighting` enhancement if PHOTOROOM_API_KEY is not
 * configured — that path is generative, slower, but takes a free-text prompt.
 */
export async function autoEnhanceImage(
  sourceUrl: string,
): Promise<EnhanceResult> {
  const apiKey = getPhotoroomKey()
  if (!apiKey) {
    // Photoroom not configured → fall back to Gemini
    return enhanceImage(sourceUrl, 'lighting')
  }

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
  if (!agent?.brokerage_id) {
    return { ok: false, error: 'No brokerage' }
  }

  const preset: PhotoroomEnhancementMeta = PHOTOROOM_PRESETS[0]!
  const editUrl = buildPhotoroomEditUrl(sourceUrl, preset)

  try {
    const resp = await fetch(editUrl, {
      headers: { 'x-api-key': apiKey },
    })
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '')
      return {
        ok: false,
        error: `Photoroom error ${resp.status}: ${detail.slice(0, 200) || resp.statusText}`,
      }
    }

    const mime = resp.headers.get('content-type') ?? 'image/jpeg'
    const buffer = Buffer.from(await resp.arrayBuffer())
    if (buffer.byteLength < 1000) {
      return {
        ok: false,
        error: 'Photoroom devolvió una imagen vacía. Reintentá en un momento.',
      }
    }

    const uploaded = await uploadToPropertyImages({
      buffer,
      mime,
      sourceUrl,
      brokerageId: agent.brokerage_id,
      tag: `pr-${preset.id}`,
    })
    if (!uploaded.ok) return uploaded

    return {
      ok: true,
      path: uploaded.path,
      url: uploaded.url,
      applied: preset.applied,
    }
  } catch (err) {
    if (err instanceof Error) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Error desconocido al mejorar la imagen.' }
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function uploadToPropertyImages({
  buffer,
  mime,
  sourceUrl,
  brokerageId,
  tag,
}: {
  buffer: Buffer
  mime: string
  sourceUrl: string
  brokerageId: string
  tag: string
}): Promise<
  { ok: true; path: string; url: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const ext = mime.split('/')[1]?.split('+')[0] ?? 'jpeg'

  // Path follows the existing convention:
  //   <brokerage_id>/<property_id>/<tag>-<timestamp>.<ext>
  const propertyIdMatch = sourceUrl.match(
    /\/property-images\/[^/]+\/([^/]+)\//,
  )
  const propertyFolder = propertyIdMatch?.[1] ?? 'shared'
  const path = `${brokerageId}/${propertyFolder}/${tag}-${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('property-images')
    .upload(path, buffer, { contentType: mime, upsert: false })

  if (uploadErr) {
    return { ok: false, error: `Upload error: ${uploadErr.message}` }
  }

  const { data: pub } = supabase.storage
    .from('property-images')
    .getPublicUrl(path)

  return { ok: true, path, url: pub.publicUrl }
}

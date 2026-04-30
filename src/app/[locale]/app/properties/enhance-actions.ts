'use server'

import {
  getGeminiClient,
  GEMINI_IMAGE_MODEL,
  getEnhancementMeta,
  type EnhancementType,
} from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

export type EnhanceResult =
  | { ok: true; path: string; url: string }
  | { ok: false; error: string }

/**
 * Enhance a property image via Gemini 2.5 Flash Image, then upload the result
 * to Supabase storage. Returns the new path + public URL so the client can
 * swap the image in the form state.
 *
 * Manual mode: this doesn't replace the original — both originals and
 * enhanced versions live side by side in storage. The form decides which
 * URL to keep.
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
    // 1. Fetch the source image as bytes
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

    // 2. Call Gemini with image + edit prompt
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

    // 3. Extract the generated image from the response
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

    // 4. Upload to Supabase storage. Path follows the existing convention:
    //    <brokerage_id>/<property_id>/enhanced-<type>-<timestamp>.<ext>
    //    We extract property_id from the source URL when possible (the upload
    //    component generates paths under the property_id). Falls back to a
    //    "shared" folder if the URL doesn't fit the pattern.
    const ext = enhancedMime.split('/')[1]?.split('+')[0] ?? 'jpeg'
    const propertyIdMatch = sourceUrl.match(
      /\/property-images\/[^/]+\/([^/]+)\//,
    )
    const propertyFolder = propertyIdMatch?.[1] ?? 'shared'
    const path = `${agent.brokerage_id}/${propertyFolder}/enhanced-${enhancementType}-${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('property-images')
      .upload(path, enhancedBuffer, {
        contentType: enhancedMime,
        upsert: false,
      })

    if (uploadErr) {
      return { ok: false, error: `Upload error: ${uploadErr.message}` }
    }

    const { data: pub } = supabase.storage
      .from('property-images')
      .getPublicUrl(path)

    return { ok: true, path, url: pub.publicUrl }
  } catch (err) {
    if (err instanceof Error) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Error desconocido al mejorar la imagen.' }
  }
}

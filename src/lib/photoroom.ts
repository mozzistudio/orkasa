// Photoroom AI image-edit client.
//
// We use the v2/edit endpoint with lighting.mode=ai.auto, which performs an
// AI-powered relight + white-balance / color correction in one pass.
// Photoroom doesn't accept free-text prompts — only structured parameters.
// For prompt-driven edits (declutter, virtual staging, sky replace) we still
// fall back to Gemini.

export const PHOTOROOM_EDIT_ENDPOINT =
  'https://image-api.photoroom.com/v2/edit'

export type PhotoroomEnhancementType =
  | 'real-estate-relight'
  | 'preserve-color'

export type PhotoroomEnhancementMeta = {
  id: PhotoroomEnhancementType
  /** Short label shown in the "applied changes" list */
  label: string
  /** Photoroom v2/edit parameters serialized into the URL */
  params: Record<string, string>
  /** What this enhancement actually does, for the changes summary */
  applied: string[]
}

// IMPORTANT: removeBackground=false is required for real estate photos —
// otherwise Photoroom defaults to cutting out the "subject", which doesn't
// make sense for an interior. We also force JPEG output for smaller files.
export const PHOTOROOM_PRESETS: PhotoroomEnhancementMeta[] = [
  {
    id: 'real-estate-relight',
    label: 'Relight inmobiliario',
    params: {
      'lighting.mode': 'ai.auto',
      removeBackground: 'false',
      'export.format': 'jpeg',
    },
    applied: [
      'Iluminación equilibrada',
      'Balance de blancos',
      'Exposición y contraste',
      'Color natural realzado',
    ],
  },
  {
    id: 'preserve-color',
    label: 'Relight con color original',
    params: {
      'lighting.mode': 'ai.preserve-hue-and-saturation',
      removeBackground: 'false',
      'export.format': 'jpeg',
    },
    applied: [
      'Iluminación equilibrada',
      'Tonos originales preservados',
      'Exposición y contraste',
    ],
  },
]

export function isPhotoroomConfigured(): boolean {
  return Boolean(process.env.PHOTOROOM_API_KEY)
}

export function getPhotoroomKey(): string | null {
  return process.env.PHOTOROOM_API_KEY ?? null
}

export function buildPhotoroomEditUrl(
  imageUrl: string,
  preset: PhotoroomEnhancementMeta = PHOTOROOM_PRESETS[0]!,
): string {
  const url = new URL(PHOTOROOM_EDIT_ENDPOINT)
  url.searchParams.set('imageUrl', imageUrl)
  for (const [k, v] of Object.entries(preset.params)) {
    url.searchParams.set(k, v)
  }
  return url.toString()
}

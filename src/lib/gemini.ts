import { GoogleGenAI } from '@google/genai'

let _client: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null
  if (_client) return _client
  _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  return _client
}

// Image generation/editing model (formerly "Nano Banana")
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'

// =============================================================================
// Enhancement types — used by the AI Review UI to give the broker concrete options
// =============================================================================

export type EnhancementType =
  | 'sky_replace'
  | 'lighting'
  | 'clutter_remove'
  | 'virtual_stage'

export type EnhancementMeta = {
  id: EnhancementType
  label: string
  description: string
  prompt: string
}

export const ENHANCEMENTS: EnhancementMeta[] = [
  {
    id: 'sky_replace',
    label: 'Reemplazar cielo',
    description: 'Cambia un cielo gris/nublado por un cielo despejado de hora dorada',
    prompt: `Replace the sky in this real estate photo with a clear blue sky transitioning to soft golden hour light at the horizon. Keep buildings, vegetation, foreground, and lighting on objects unchanged — only the sky region should change. Match the original lighting direction and color temperature. Maintain photographic realism — no oversaturation, no fake-looking gradients, no halos around edges. The image must remain credible as an unedited real estate photograph.`,
  },
  {
    id: 'lighting',
    label: 'Mejorar iluminación',
    description: 'Aclara naturalmente las zonas oscuras manteniendo los colores reales',
    prompt: `Improve the lighting in this real estate photo. Brighten shadowed areas naturally — recover detail in dark zones without crushing highlights or producing HDR artifacts. Balance interior versus exterior exposure if there is a window. Keep the original colors true to life — no warm/cold cast shifts. Maintain natural shadow direction. The result should look like a well-exposed photograph, never an HDR composite or an over-processed image.`,
  },
  {
    id: 'clutter_remove',
    label: 'Quitar desorden',
    description:
      'Elimina objetos que distraen: juguetes, ropa, platos, papeles. Mantiene los muebles fijos.',
    prompt: `Remove distracting clutter from this real estate photo: personal items (toys, magazines, mail, dishes, towels, clothing, cables, remotes, photo frames, cosmetics, food on counters). Keep all furniture, art on walls, plants, and architectural elements exactly as they are. Restore surfaces (counters, floors, beds, sofas) so they look clean and professionally staged. Maintain natural shadows and lighting. The result should look like the same room photographed at a tidier moment, not a digitally altered image.`,
  },
  {
    id: 'virtual_stage',
    label: 'Staging virtual',
    description:
      'Amueblá una habitación vacía con muebles modernos neutros (light wood + tonos neutros)',
    prompt: `This is an empty room in a real estate listing. Add tasteful, modern furniture appropriate to the room type (living room → sofa + coffee table + rug + side lamp; bedroom → bed + nightstand + small bench; dining room → table + chairs; office → desk + chair + bookshelf). Use a neutral contemporary style: light oak wood, warm beige and off-white textiles, matte black metal accents, simple ceramic decor, one or two leafy plants. Do not change architecture, walls, floors, ceiling, windows, or doors. Keep natural lighting from the original photo. The furniture should look real, well-proportioned, and photographed in the room — not pasted on. The result should look like a genuine before/after staging.`,
  },
]

export function getEnhancementMeta(id: EnhancementType): EnhancementMeta | undefined {
  return ENHANCEMENTS.find((e) => e.id === id)
}

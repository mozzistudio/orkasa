import type { Database } from '@/lib/database.types'

export type IntegrationProvider =
  Database['public']['Enums']['integration_provider']
export type IntegrationStatus = Database['public']['Enums']['integration_status']

type AuthMethod = 'api_key' | 'oauth' | 'webhook' | 'manual'
type IntegrationCategory = 'portal' | 'social' | 'messaging' | 'custom'
type Region = 'PA' | 'DO' | 'CR' | 'CO' | 'MX' | 'EC' | 'AR' | 'CL' | 'PE' | 'ES'

export type IntegrationProviderMeta = {
  id: IntegrationProvider
  label: string
  description: string
  category: IntegrationCategory
  regions: Region[]
  authMethod: AuthMethod
  // What we'd ask the user to provide when connecting
  credentialFields?: Array<{ key: string; label: string; type: 'text' | 'password' | 'url' }>
  // True when we have actual sync logic wired up; false = placeholder UI
  available: boolean
  // Brand color for the icon background (signal palette only — no rainbow)
  accentClass?: string
  // Single-letter logo placeholder (until we get real SVGs)
  shortLabel: string
  website?: string
  // AI rewrite constraints — used by the listing adapter
  adapter?: AdapterSpec
}

export type AdapterSpec = {
  // Hard limits — Claude is prompted to respect these
  titleMax: number
  descriptionMax: number
  // 'factual' = portal style (no marketing fluff, specs-first)
  // 'social' = engagement-driven (hooks, lifestyle, hashtags-allowed)
  // 'concise' = short-form (mobile-first, cut filler)
  tone: 'factual' | 'social' | 'concise'
  // Hashtags allowed in output? Some portals strip them, social loves them
  allowsHashtags: boolean
  // Force CTA at the end ("Contactanos al...") or not
  appendsCta: boolean
  // Free-form notes that go straight into the system prompt
  styleNotes: string
}

export const INTEGRATION_PROVIDERS: IntegrationProviderMeta[] = [
  // === LATAM REAL ESTATE PORTALS ===
  {
    id: 'encuentra24',
    label: 'Encuentra24',
    description:
      'El portal #1 de Centroamérica. Cobertura: Panamá, Costa Rica, Nicaragua, El Salvador, Guatemala.',
    category: 'portal',
    regions: ['PA', 'CR', 'DO'],
    authMethod: 'api_key',
    credentialFields: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'account_id', label: 'Account ID (opcional)', type: 'text' },
    ],
    available: false,
    shortLabel: 'E24',
    website: 'https://www.encuentra24.com',
    adapter: {
      titleMax: 80,
      descriptionMax: 1500,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: true,
      styleNotes:
        'E24 audience is broad — both end-buyers and brokers browse. Lead with the most differentiating spec (m², bedrooms, location), then amenities, then closing/contact line. Spanish only. No emojis. No "perfect/dream/luxury".',
    },
  },
  {
    id: 'compreoalquile',
    label: 'CompreOAlquile',
    description: 'Portal panameño especializado en venta y alquiler residencial.',
    category: 'portal',
    regions: ['PA'],
    authMethod: 'api_key',
    credentialFields: [{ key: 'api_key', label: 'API Key', type: 'password' }],
    available: false,
    shortLabel: 'CA',
    website: 'https://www.compreoalquile.com',
    adapter: {
      titleMax: 70,
      descriptionMax: 1200,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: true,
      styleNotes:
        'CompreOAlquile is panameño-only — heavy mobile traffic. Keep paragraphs short (2-3 lines). Spanish, casual but professional. Mention barrio prominently. No emojis.',
    },
  },
  {
    id: 'inmuebles24',
    label: 'Inmuebles24',
    description: 'Portal mexicano líder con 12M visitas/mes. Parte de OLX Group.',
    category: 'portal',
    regions: ['MX'],
    authMethod: 'oauth',
    available: false,
    shortLabel: 'I24',
    website: 'https://www.inmuebles24.com',
    adapter: {
      titleMax: 60,
      descriptionMax: 2000,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: false,
      styleNotes:
        'Inmuebles24 (México) — title cap is hard at 60 chars. Use Mexican Spanish (recámaras NOT dormitorios, alberca for piscina, cochera for garaje, MN for currency). No CTA: portal injects its own contact form. Spec-first, then differentiators.',
    },
  },
  {
    id: 'mercadolibre_inmuebles',
    label: 'MercadoLibre Inmuebles',
    description:
      'Portal de inmuebles del mayor marketplace LATAM. Cobertura: AR, MX, CO, CL, EC, PE.',
    category: 'portal',
    regions: ['AR', 'MX', 'CO', 'CL', 'EC', 'PE'],
    authMethod: 'oauth',
    available: false,
    shortLabel: 'ML',
    website: 'https://inmuebles.mercadolibre.com',
    adapter: {
      titleMax: 60,
      descriptionMax: 5000,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: false,
      styleNotes:
        'MercadoLibre Inmuebles — multi-country. Use country-neutral Spanish ("habitaciones" not regional variants). MUST include neighborhood + city + country in first paragraph for SEO. No CTA: ML uses its own messaging system. Long descriptions reward — go deeper on amenities.',
    },
  },
  {
    id: 'properati',
    label: 'Properati',
    description: 'Portal regional con presencia en AR, MX, CO, EC, PE.',
    category: 'portal',
    regions: ['AR', 'MX', 'CO', 'EC', 'PE'],
    authMethod: 'api_key',
    credentialFields: [{ key: 'api_key', label: 'API Key', type: 'password' }],
    available: false,
    shortLabel: 'PR',
    website: 'https://www.properati.com',
    adapter: {
      titleMax: 80,
      descriptionMax: 2000,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: false,
      styleNotes:
        'Properati — data-driven portal, audience is investors and serious buyers. Lead with quantitative facts (m², price/m² if relevant, year built). Avoid lifestyle copy. Bilingual ES/EN may be acceptable for high-end. No CTA.',
    },
  },
  {
    id: 'idealista',
    label: 'Idealista',
    description: 'Portal líder en España. Útil si tu brokerage opera con clientes españoles.',
    category: 'portal',
    regions: ['ES'],
    authMethod: 'oauth',
    available: false,
    shortLabel: 'ID',
    website: 'https://www.idealista.com',
    adapter: {
      titleMax: 100,
      descriptionMax: 3000,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: false,
      styleNotes:
        'Idealista (España) — use Iberian Spanish ("piso" for apartamento, "vosotros" not ustedes). Mention metro/transport access if applicable. SEO-conscious: first 200 chars matter for search snippets.',
    },
  },
  {
    id: 'zonaprop',
    label: 'ZonaProp',
    description: 'Portal argentino líder, parte de QuintoAndar.',
    category: 'portal',
    regions: ['AR'],
    authMethod: 'oauth',
    available: false,
    shortLabel: 'ZP',
    website: 'https://www.zonaprop.com.ar',
    adapter: {
      titleMax: 80,
      descriptionMax: 2500,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: false,
      styleNotes:
        'ZonaProp (Argentina) — use Argentinian Spanish ("departamento" not apartamento, "ambientes" for room count, voseo: "tenés/podés"). Highlight USD pricing if applicable. Mention barrio + neighborhood character.',
    },
  },
  {
    id: 'casas',
    label: 'Casas.com',
    description: 'Red regional con presencia en CR, NI, GT, HN, SV.',
    category: 'portal',
    regions: ['CR'],
    authMethod: 'api_key',
    credentialFields: [{ key: 'api_key', label: 'API Key', type: 'password' }],
    available: false,
    shortLabel: 'CS',
    website: 'https://www.casas.com',
    adapter: {
      titleMax: 80,
      descriptionMax: 1500,
      tone: 'factual',
      allowsHashtags: false,
      appendsCta: true,
      styleNotes:
        'Casas.com — Centroamerican audience (CR, NI, GT, HN, SV). Spanish, professional. CTA at end with phone or WhatsApp. Mention barrio + city.',
    },
  },

  // === SOCIAL ===
  {
    id: 'facebook_marketplace',
    label: 'Facebook Marketplace',
    description:
      'Publica tus propiedades en Facebook Marketplace y páginas de tu agencia.',
    category: 'social',
    regions: ['PA', 'DO', 'CR', 'CO', 'MX'],
    authMethod: 'oauth',
    available: false,
    shortLabel: 'FB',
    website: 'https://www.facebook.com/marketplace',
    adapter: {
      titleMax: 100,
      descriptionMax: 9000,
      tone: 'social',
      allowsHashtags: false,
      appendsCta: true,
      styleNotes:
        'Facebook Marketplace — buyer is scrolling on mobile, decision time = 3 seconds. Open with the hook (price + ONE differentiator). Use line breaks every 2-3 sentences. Mid-formal Spanish, ok to use "vos/tú" depending on country. End with explicit CTA: "Escribime" or "Llamá al ___". No hashtags (Marketplace strips them).',
    },
  },
  {
    id: 'instagram_business',
    label: 'Instagram Business',
    description:
      'Auto-publica posts y stories desde tu inventario activo. Requiere Business Account.',
    category: 'social',
    regions: ['PA', 'DO', 'CR', 'CO', 'MX'],
    authMethod: 'oauth',
    available: false,
    shortLabel: 'IG',
    website: 'https://business.instagram.com',
    adapter: {
      titleMax: 0,
      descriptionMax: 2200,
      tone: 'social',
      allowsHashtags: true,
      appendsCta: true,
      styleNotes:
        'Instagram caption — feed scrollers, 1.5 sec attention. First line is THE hook (under 125 chars, no caps cut-off). Then aerated body with line breaks. End with 5-10 hashtags relevant to LATAM real estate (#bienesraices, #inmuebles, #city_name, etc.). CTA: "Link en bio" or "Escribime al DM". No title (Instagram has no title field).',
    },
  },

  // === MESSAGING ===
  {
    id: 'whatsapp_business',
    label: 'WhatsApp Business',
    description:
      'Recibí leads, automatizá respuestas y seguimiento via la API oficial.',
    category: 'messaging',
    regions: ['PA', 'DO', 'CR', 'CO', 'MX'],
    authMethod: 'api_key',
    credentialFields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text' },
      { key: 'access_token', label: 'Access Token', type: 'password' },
    ],
    available: false,
    shortLabel: 'WA',
    website: 'https://business.whatsapp.com',
  },

  // === CUSTOM ===
  {
    id: 'webhook_custom',
    label: 'Webhook personalizado',
    description:
      'Conectá Orkasa a cualquier sistema vía webhook HTTPS. POST cuando se crea/actualiza una propiedad o lead.',
    category: 'custom',
    regions: [],
    authMethod: 'webhook',
    credentialFields: [
      { key: 'webhook_url', label: 'URL del webhook (HTTPS)', type: 'url' },
      { key: 'secret', label: 'Secret HMAC (opcional)', type: 'password' },
    ],
    available: true,
    shortLabel: 'WH',
  },
]

export const PROVIDERS_BY_CATEGORY: Record<
  IntegrationCategory,
  IntegrationProviderMeta[]
> = {
  portal: INTEGRATION_PROVIDERS.filter((p) => p.category === 'portal'),
  social: INTEGRATION_PROVIDERS.filter((p) => p.category === 'social'),
  messaging: INTEGRATION_PROVIDERS.filter((p) => p.category === 'messaging'),
  custom: INTEGRATION_PROVIDERS.filter((p) => p.category === 'custom'),
}

export function getProviderMeta(
  id: IntegrationProvider,
): IntegrationProviderMeta | undefined {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id)
}

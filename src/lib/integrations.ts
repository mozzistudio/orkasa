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

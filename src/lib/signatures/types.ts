import type { Database } from '@/lib/database.types'

export type SignatureDocument =
  Database['public']['Tables']['signature_documents']['Row']
export type SignatureDocumentInsert =
  Database['public']['Tables']['signature_documents']['Insert']
export type SignatureTemplate =
  Database['public']['Enums']['signature_document_template']
export type SignatureStatus =
  Database['public']['Enums']['signature_document_status']

export type TemplateMeta = {
  type: SignatureTemplate
  label: string
  description: string
  defaultTitle: (propertyTitle: string) => string
}

export const TEMPLATES: Record<SignatureTemplate, TemplateMeta> = {
  autorizacion_venta: {
    type: 'autorizacion_venta',
    label: 'Autorización de venta',
    description:
      'El propietario autoriza al corredor a publicar y promocionar la propiedad por un período determinado.',
    defaultTitle: (t) => `Autorización de venta · ${t}`,
  },
  promesa_compraventa: {
    type: 'promesa_compraventa',
    label: 'Promesa de compraventa',
    description:
      'Acuerdo de compromiso entre comprador y vendedor antes de la escritura pública.',
    defaultTitle: (t) => `Promesa de compraventa · ${t}`,
  },
  addendum: {
    type: 'addendum',
    label: 'Addendum',
    description:
      'Modificación o anexo a un acuerdo previo (extensión, ajuste de precio, condiciones).',
    defaultTitle: (t) => `Addendum · ${t}`,
  },
}

export type TemplateData = {
  property: {
    title: string
    address: string | null
    neighborhood: string | null
    city: string | null
    price: number | null
    currency: string | null
    property_type: string
    bedrooms: number | null
    bathrooms: number | null
    area_m2: number | null
  }
  owner: {
    name: string
    phone: string | null
    email: string | null
  }
  brokerage: {
    name: string
  }
  agent: {
    name: string | null
  }
  // Template-specific
  commission_pct?: number
  duration_months?: number
  earnest_money?: number
  closing_date?: string
  amendment_text?: string
}

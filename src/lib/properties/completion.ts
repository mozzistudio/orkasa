import type { ComputedCompletion, PropertyRow, StoredImage } from './types'

const REQUIRED_FIELDS = [
  'title',
  'description',
  'price',
  'address',
  'photos>=3',
  'property_type',
  'listing_type',
  'bedrooms',
  'bathrooms',
  'area_m2',
] as const

type RequiredField = (typeof REQUIRED_FIELDS)[number]

const PLACEHOLDER_TITLES = new Set([
  '',
  'borrador',
  '(sin título)',
  'sin título',
  'sin titulo',
  'untitled',
])

function hasUsableTitle(title: string | null | undefined): boolean {
  if (!title) return false
  const normalized = title.trim().toLowerCase()
  if (normalized.length < 3) return false
  return !PLACEHOLDER_TITLES.has(normalized)
}

function photoCount(images: PropertyRow['images']): number {
  if (!Array.isArray(images)) return 0
  return (images as StoredImage[]).filter((i) => i?.url).length
}

function isFieldFilled(p: PropertyRow, field: RequiredField): boolean {
  switch (field) {
    case 'title':
      return hasUsableTitle(p.title)
    case 'description':
      return Boolean(p.description && p.description.trim().length >= 30)
    case 'price':
      return p.price !== null && p.price > 0
    case 'address':
      return Boolean(p.address && p.address.trim().length > 0)
    case 'photos>=3':
      return photoCount(p.images) >= 3
    case 'property_type':
      return Boolean(p.property_type)
    case 'listing_type':
      return Boolean(p.listing_type)
    case 'bedrooms':
      return p.bedrooms !== null
    case 'bathrooms':
      return p.bathrooms !== null
    case 'area_m2':
      return p.area_m2 !== null && p.area_m2 > 0
  }
}

const FIELD_LABELS: Record<RequiredField, string> = {
  title: 'título',
  description: 'descripción',
  price: 'precio',
  address: 'dirección',
  'photos>=3': 'mínimo 3 fotos',
  property_type: 'tipo de propiedad',
  listing_type: 'venta o alquiler',
  bedrooms: 'cantidad de habitaciones',
  bathrooms: 'cantidad de baños',
  area_m2: 'metros cuadrados',
}

export function computeCompletion(p: PropertyRow): ComputedCompletion {
  const filled = REQUIRED_FIELDS.filter((f) => isFieldFilled(p, f))
  const missing = REQUIRED_FIELDS.filter((f) => !isFieldFilled(p, f))
  const percentage = Math.round((filled.length / REQUIRED_FIELDS.length) * 100)
  const tone =
    percentage >= 75 ? ('high' as const) : percentage >= 50 ? ('mid' as const) : ('low' as const)
  return {
    percentage,
    missing: missing.map((f) => FIELD_LABELS[f]),
    tone,
    isPublishable: missing.length === 0,
  }
}

export function summarizeMissing(c: ComputedCompletion): string {
  if (c.missing.length === 0) return 'Casi listo · solo falta título'
  if (c.percentage >= 90) {
    return `Casi listo · falta ${c.missing[0]}`
  }
  if (c.missing.length === 1) return `Falta ${c.missing[0]}`
  if (c.missing.length === 2) return `Falta ${c.missing[0]} + ${c.missing[1]}`
  if (c.percentage <= 25) return 'Falta casi todo'
  return `Faltan ${c.missing.slice(0, 2).join(' + ')}`
}

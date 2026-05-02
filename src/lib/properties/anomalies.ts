import type { Anomaly, PropertyRow, StoredImage } from './types'

const PLACEHOLDER_TITLES = new Set([
  'borrador',
  '(sin título)',
  'sin título',
  'sin titulo',
  'untitled',
  'casa',
  'apartamento',
])

const HIGH_VALUE_THRESHOLD = 200_000

const SUSPICIOUS_LOW_PRICE_USD = 1_000

function photoCount(images: PropertyRow['images']): number {
  if (!Array.isArray(images)) return 0
  return (images as StoredImage[]).filter((i) => i?.url).length
}

/**
 * Heuristics that catch obvious mistakes a broker would want to fix before publishing.
 * - Suspicious price: $3 instead of $300K (typo / missing zeros)
 * - Missing photos for high-value listings (poor traction signal)
 * - Placeholder title that hasn't been replaced
 */
export function detectAnomalies(p: PropertyRow): Anomaly[] {
  const anomalies: Anomaly[] = []

  if (p.price !== null && p.price > 0 && p.price < SUSPICIOUS_LOW_PRICE_USD) {
    // Brokers usually mistype by leaving off "K" or several zeros.
    // For prices < $1K, the most common typo is missing the "thousand" suffix
    // (e.g. $3 meant $300K). Multiply by 100,000 to suggest a realistic price band.
    const inflated = p.price * 100_000
    const inflatedShort =
      inflated >= 1_000_000
        ? `${(inflated / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
        : `${Math.round(inflated / 1_000)}K`
    anomalies.push({
      level: 'error',
      field: 'price',
      message: 'Precio sospechoso · revisar antes de publicar',
      suggestion: `¿Querías $${inflatedShort}?`,
    })
  }

  if (
    p.price !== null &&
    p.price >= HIGH_VALUE_THRESHOLD &&
    photoCount(p.images) === 0
  ) {
    anomalies.push({
      level: 'warn',
      field: 'photos',
      message: 'Sin fotos para una propiedad de valor alto',
      suggestion: 'Agregá al menos 5 fotos para mejor tracción',
    })
  }

  const titleNormalized = (p.title ?? '').trim().toLowerCase()
  if (
    !p.title ||
    titleNormalized.length < 5 ||
    PLACEHOLDER_TITLES.has(titleNormalized) ||
    titleNormalized.startsWith('borrador') ||
    titleNormalized.includes('(sin título)')
  ) {
    anomalies.push({
      level: 'warn',
      field: 'title',
      message: 'Sin título descriptivo',
      suggestion: 'Un buen título atrae 3x más leads',
    })
  }

  return anomalies
}

export function hasBlockingError(anomalies: Anomaly[]): boolean {
  return anomalies.some((a) => a.level === 'error')
}

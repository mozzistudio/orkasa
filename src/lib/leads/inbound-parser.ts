/**
 * Tools to extract a portal listing reference from an inbound WhatsApp
 * message and resolve it to one of our catalog properties.
 *
 * Real-world inbound flow: a buyer sees our listing on Encuentra24 (or
 * similar), taps "Contact agent" which opens WhatsApp with a pre-filled
 * "Hola, estoy interesado en [URL]". We need to parse that URL, identify
 * the portal + listing ID, and find the matching property in our DB via
 * `property_publications.external_id`.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type PortalRef = {
  provider:
    | 'encuentra24'
    | 'mercadolibre_inmuebles'
    | 'compreoalquile'
    | 'web'
  externalId: string
  url: string
}

const URL_RE = /https?:\/\/[^\s]+/gi

/**
 * Pull every URL out of free-form WhatsApp text and try to identify portal
 * listing references. Returns one entry per match (deduped by URL).
 */
export function extractPortalRefs(body: string | null | undefined): PortalRef[] {
  if (!body) return []
  const seen = new Set<string>()
  const refs: PortalRef[] = []
  for (const url of body.match(URL_RE) ?? []) {
    if (seen.has(url)) continue
    seen.add(url)
    const ref = parsePortalUrl(url)
    if (ref) refs.push(ref)
  }
  return refs
}

/**
 * Best-effort parser for common LATAM portal URLs. Returns null when we
 * can't recognize the portal or extract an ID.
 */
export function parsePortalUrl(url: string): PortalRef | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.host.replace(/^www\./, '')
  const path = parsed.pathname

  // Encuentra24: trailing numeric segment is the listing ID
  // e.g. /panama-es/.../slug/32138864
  if (host.endsWith('encuentra24.com')) {
    const id = path.match(/\/(\d{5,})\/?$/)?.[1]
    if (id) return { provider: 'encuentra24', externalId: id, url }
  }

  // MercadoLibre: path contains MLP-XXXXXXXXX
  if (host.includes('mercadolibre.com') || host.includes('inmuebles.mercadolibre')) {
    const id = path.match(/MLP-?(\d+)/i)?.[1]
    if (id) return { provider: 'mercadolibre_inmuebles', externalId: id, url }
  }

  // Compreoalquile: numeric ID at end of path
  if (host.endsWith('compreoalquile.com')) {
    const id = path.match(/\/(\d{4,})\/?$/)?.[1]
    if (id) return { provider: 'compreoalquile', externalId: id, url }
  }

  // Our own listing pages: /p/[uuid] or /properties/[uuid]
  if (host.endsWith('orkasa.vercel.app') || host.endsWith('orkasa.com')) {
    const id = path.match(/\/(?:p|properties)\/([0-9a-f-]{36})\/?/i)?.[1]
    if (id) return { provider: 'web', externalId: id, url }
  }

  return null
}

/**
 * Given parsed portal references, look up our matching property.
 * Returns the first hit by `property_publications` (provider+external_id).
 * Falls back to direct `properties.id` for our own URLs.
 */
export async function resolvePortalRefs(
  supabase: SupabaseClient<Database>,
  brokerageId: string,
  refs: PortalRef[],
): Promise<{ propertyId: string | null; matchedRef: PortalRef | null }> {
  for (const ref of refs) {
    if (ref.provider === 'web') {
      const { data } = await supabase
        .from('properties')
        .select('id')
        .eq('id', ref.externalId)
        .eq('brokerage_id', brokerageId)
        .maybeSingle<{ id: string }>()
      if (data?.id) return { propertyId: data.id, matchedRef: ref }
      continue
    }
    const { data } = await supabase
      .from('property_publications')
      .select('property_id')
      .eq('brokerage_id', brokerageId)
      .eq(
        'provider',
        ref.provider as Database['public']['Enums']['integration_provider'],
      )
      .eq('external_id', ref.externalId)
      .maybeSingle<{ property_id: string }>()
    if (data?.property_id) {
      return { propertyId: data.property_id, matchedRef: ref }
    }
  }
  return { propertyId: null, matchedRef: null }
}

/**
 * Best-effort name extraction from "Hola, soy Juan ..." style messages.
 * Falls back to a phone-number-derived placeholder so the lead row is
 * never nameless.
 */
export function deriveLeadName(
  body: string | null | undefined,
  fallbackPhone: string,
): string {
  if (body) {
    const match =
      body.match(/(?:soy|me llamo|aqu[ií]\s+es)\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ' -]{1,40})/i) ??
      body.match(/^Hola[,!.\s]+(?:soy\s+)?([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ' -]{1,40})/)
    if (match?.[1]) return match[1].trim()
  }
  // Fallback: last 4 digits so the agent recognizes the number quickly
  const digits = fallbackPhone.replace(/\D/g, '')
  return `WhatsApp ${digits.slice(-4)}`
}

/**
 * Scraped attributes from a portal listing page. All fields optional —
 * portals format wildly differently, we take what we can get.
 */
export type ScrapedListing = {
  title: string | null
  description: string | null
  price: number | null
  currency: string | null
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  address: string | null
  city: string | null
  imageUrl: string | null
}

/**
 * Pull common metadata tags out of HTML. Most LATAM portals expose
 * Open Graph + Twitter card + JSON-LD `RealEstateListing` — we sniff all
 * three and take the first non-empty value for each field.
 */
function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
      'i',
    )
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
      'i',
    )
    const m = html.match(re) ?? html.match(alt)
    if (m?.[1]) return decodeHtml(m[1])
  }
  return null
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function findJsonLd(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    try {
      const parsed: unknown = JSON.parse(m[1].trim())
      if (Array.isArray(parsed)) {
        for (const p of parsed)
          if (p && typeof p === 'object')
            blocks.push(p as Record<string, unknown>)
      } else if (parsed && typeof parsed === 'object') {
        blocks.push(parsed as Record<string, unknown>)
      }
    } catch {
      // some sites emit invalid JSON-LD — skip silently
    }
  }
  return blocks
}

function pickString(o: unknown): string | null {
  if (typeof o === 'string') return o.trim() || null
  if (typeof o === 'number') return String(o)
  return null
}

function pickNumber(o: unknown): number | null {
  if (typeof o === 'number' && Number.isFinite(o)) return o
  if (typeof o === 'string') {
    const cleaned = o.replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    if (Number.isFinite(n)) return n
  }
  return null
}

/**
 * Fetch a portal listing URL and extract structured data. Returns null
 * if the fetch fails. Best-effort — never throws.
 */
export async function scrapeListing(url: string): Promise<ScrapedListing | null> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        // Most portals block default fetch UA; mimic a real browser
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-PA,es;q=0.9,en;q=0.5',
      },
      // Don't hang the webhook if the portal is slow
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return null
  }
  if (!res.ok) return null

  let html: string
  try {
    html = await res.text()
  } catch {
    return null
  }

  // Open Graph first
  let title = metaContent(html, ['og:title', 'twitter:title'])
  let description = metaContent(html, ['og:description', 'twitter:description', 'description'])
  let imageUrl = metaContent(html, ['og:image', 'twitter:image'])
  let price: number | null = pickNumber(
    metaContent(html, [
      'product:price:amount',
      'og:price:amount',
      'twitter:data1',
    ]),
  )
  let currency: string | null = metaContent(html, [
    'product:price:currency',
    'og:price:currency',
  ])
  let address: string | null = null
  let bedrooms: number | null = null
  let bathrooms: number | null = null
  let area_m2: number | null = null

  // JSON-LD overrides when present
  for (const block of findJsonLd(html)) {
    const t = block['@type']
    const isOffer =
      typeof t === 'string' &&
      /^(RealEstateListing|Product|Apartment|House|Place|SingleFamilyResidence)$/i.test(t)
    if (!isOffer) continue
    title ??= pickString(block.name)
    description ??= pickString(block.description)
    if (!imageUrl) {
      const img = block.image
      if (typeof img === 'string') imageUrl = img
      else if (Array.isArray(img) && typeof img[0] === 'string') imageUrl = img[0]
    }
    const offers = block.offers as Record<string, unknown> | undefined
    if (offers) {
      price ??= pickNumber(offers.price)
      currency ??= pickString(offers.priceCurrency)
    }
    const addr = block.address as Record<string, unknown> | string | undefined
    if (typeof addr === 'string') address ??= addr
    else if (addr && typeof addr === 'object') {
      address ??=
        pickString(addr.streetAddress) ??
        pickString(addr.addressLocality) ??
        null
    }
    bedrooms ??= pickNumber(block.numberOfRooms)
    bathrooms ??= pickNumber(block.numberOfBathroomsTotal)
    const fs = block.floorSize as Record<string, unknown> | undefined
    if (fs) area_m2 ??= pickNumber(fs.value)
  }

  // Encuentra24-specific text fallbacks (their JSON-LD is sparse)
  if (!bedrooms) {
    const m =
      title?.match(/(\d+)\s*(?:rec[aá]maras?|hab|dormitorios?)/i) ??
      description?.match(/(\d+)\s*(?:rec[aá]maras?|hab|dormitorios?)/i)
    bedrooms = m ? parseInt(m[1], 10) : null
  }
  if (!bathrooms) {
    const m =
      title?.match(/(\d+(?:\.\d+)?)\s*ba(ñ|n)os?/i) ??
      description?.match(/(\d+(?:\.\d+)?)\s*ba(ñ|n)os?/i)
    bathrooms = m ? parseFloat(m[1]) : null
  }
  if (!area_m2) {
    const m =
      title?.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i) ??
      description?.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i)
    area_m2 = m ? parseFloat(m[1].replace(',', '.')) : null
  }

  return {
    title,
    description,
    price,
    currency: currency?.toUpperCase() ?? null,
    bedrooms: bedrooms != null ? Math.round(bedrooms) : null,
    bathrooms,
    area_m2,
    address,
    city: null,
    imageUrl,
  }
}

/**
 * Fuzzy-match a scraped listing to one of our properties when no portal
 * publication record links them directly. Heuristic: same listing_type
 * (inferred from price scale isn't reliable so we ignore it), price
 * within ±10%, bedrooms exact match, area_m2 within ±15%.
 *
 * Returns the best match (lowest score) or null if no good candidate.
 */
export async function fuzzyMatchProperty(
  supabase: SupabaseClient<Database>,
  brokerageId: string,
  scraped: ScrapedListing,
): Promise<string | null> {
  if (!scraped.price) return null

  const minPrice = scraped.price * 0.9
  const maxPrice = scraped.price * 1.1

  const query = supabase
    .from('properties')
    .select('id, price, bedrooms, area_m2')
    .eq('brokerage_id', brokerageId)
    .gte('price', minPrice)
    .lte('price', maxPrice)
    .limit(20)

  if (scraped.bedrooms != null) {
    query.eq('bedrooms', scraped.bedrooms)
  }

  const { data: candidates } = await query.returns<
    Array<{ id: string; price: number | null; bedrooms: number | null; area_m2: number | null }>
  >()

  if (!candidates || candidates.length === 0) return null

  let best: { id: string; score: number } | null = null
  for (const c of candidates) {
    let score = 0
    if (c.price && scraped.price) {
      score += Math.abs(c.price - scraped.price) / scraped.price
    }
    if (scraped.area_m2 && c.area_m2) {
      const areaDiff = Math.abs(Number(c.area_m2) - scraped.area_m2) / scraped.area_m2
      if (areaDiff > 0.15) continue // hard reject if area is too different
      score += areaDiff
    }
    if (!best || score < best.score) best = { id: c.id, score }
  }

  return best?.id ?? null
}

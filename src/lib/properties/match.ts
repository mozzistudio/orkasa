import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type SimilarRow = {
  id: string
  title: string
  property_type: string
  listing_type: string
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  city: string | null
  neighborhood: string | null
}

export type SimilarProperty = {
  id: string
  title: string
  price: number | null
}

/**
 * Given a reference property, return up to `limit` similar properties
 * from the same brokerage to suggest to a lead. Heuristic:
 *  - Same listing_type (sale vs rent) — strict
 *  - Same property_type — strict
 *  - Price within ±25% of reference
 *  - Same city when known
 *  - Bedrooms ±1
 *  - Status active or pending (not sold/rented/draft/archived)
 *  - Excludes the reference itself
 */
export async function matchSimilarProperties(
  supabase: SupabaseClient<Database>,
  referencePropertyId: string,
  brokerageId: string,
  limit = 3,
): Promise<SimilarProperty[]> {
  const { data: ref } = await supabase
    .from('properties')
    .select(
      'id, title, property_type, listing_type, price, bedrooms, bathrooms, area_m2, city, neighborhood',
    )
    .eq('id', referencePropertyId)
    .maybeSingle<SimilarRow>()

  if (!ref) return []

  const minPrice = ref.price ? ref.price * 0.75 : null
  const maxPrice = ref.price ? ref.price * 1.25 : null

  let query = supabase
    .from('properties')
    .select('id, title, price, bedrooms, area_m2, city, neighborhood')
    .eq('brokerage_id', brokerageId)
    .eq('listing_type', ref.listing_type as Database['public']['Enums']['listing_type'])
    .eq('property_type', ref.property_type as Database['public']['Enums']['property_type'])
    .neq('id', ref.id)
    .in('status', ['active', 'pending'])
    .limit(limit * 4) // over-fetch then re-rank locally

  if (minPrice && maxPrice) {
    query = query.gte('price', minPrice).lte('price', maxPrice)
  }
  if (ref.city) {
    query = query.eq('city', ref.city)
  }
  if (ref.bedrooms != null) {
    query = query
      .gte('bedrooms', Math.max(0, ref.bedrooms - 1))
      .lte('bedrooms', ref.bedrooms + 1)
  }

  const { data: candidates } = await query.returns<
    Array<{
      id: string
      title: string
      price: number | null
      bedrooms: number | null
      area_m2: number | null
      city: string | null
      neighborhood: string | null
    }>
  >()

  if (!candidates || candidates.length === 0) return []

  // Local scoring: lower is better. Distance from reference on multiple
  // axes; same neighborhood is a strong bonus.
  type Scored = { id: string; title: string; price: number | null; score: number }
  const scored: Scored[] = candidates.map((c) => {
    let score = 0
    if (c.price && ref.price) {
      score += Math.abs(c.price - ref.price) / ref.price
    }
    if (c.bedrooms != null && ref.bedrooms != null) {
      score += Math.abs(c.bedrooms - ref.bedrooms) * 0.1
    }
    if (c.area_m2 != null && ref.area_m2 != null) {
      score +=
        Math.abs(Number(c.area_m2) - Number(ref.area_m2)) /
        Math.max(Number(ref.area_m2), 1)
    }
    if (
      ref.neighborhood &&
      c.neighborhood &&
      ref.neighborhood.toLowerCase() === c.neighborhood.toLowerCase()
    ) {
      score -= 0.3 // bonus for same neighborhood
    }
    return { id: c.id, title: c.title, price: c.price, score }
  })

  scored.sort((a, b) => a.score - b.score)
  return scored.slice(0, limit).map(({ id, title, price }) => ({
    id,
    title,
    price,
  }))
}

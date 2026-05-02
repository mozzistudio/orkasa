import { createClient } from '@/lib/supabase/server'
import { computeCompletion } from '@/lib/properties/completion'
import { detectAnomalies } from '@/lib/properties/anomalies'
import type {
  Anomaly,
  ComputedCompletion,
  PriceHistoryEntry,
  PropertyMetrics,
  PropertyRow,
  PropertyWithMetrics,
} from '@/lib/properties/types'

const DAY_MS = 24 * 60 * 60 * 1000

export type OwnerFilter = 'all' | 'mine' | 'team'
export type ListingFilter = 'all' | 'sale' | 'rent'

export type PortfolioSnapshot = {
  totalValue: number
  activeCount: number
  totalLeads: number
  recentLeadsDelta: number
  upcomingViewings: number
  needsAttentionCount: number
}

export type DraftProperty = PropertyRow & {
  completion: ComputedCompletion
  anomalies: Anomaly[]
}

export type ArchivedProperty = PropertyRow & {
  closedAt: string | null
  closedByName: string | null
}

export type PropertyFilters = {
  owner: OwnerFilter
  listing: ListingFilter
  q: string
}

type LeadRow = {
  id: string
  property_id: string | null
  created_at: string | null
}

type ViewingRow = {
  id: string
  property_id: string
  scheduled_at: string
  status: string | null
}

function parsePriceHistory(value: unknown): PriceHistoryEntry[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (e): e is PriceHistoryEntry =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as PriceHistoryEntry).at === 'string' &&
      typeof (e as PriceHistoryEntry).to === 'number',
  )
}

function buildMetrics(
  property: PropertyRow,
  leads: LeadRow[],
  viewings: ViewingRow[],
  agentName: string | null,
): PropertyMetrics {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * DAY_MS

  const propertyLeads = leads.filter((l) => l.property_id === property.id)
  const propertyViewings = viewings.filter(
    (v) => v.property_id === property.id,
  )

  const recentLeads7d = propertyLeads.filter((l) => {
    if (!l.created_at) return false
    return new Date(l.created_at).getTime() >= sevenDaysAgo
  }).length

  const upcomingViewings = propertyViewings
    .filter((v) => {
      if (v.status !== 'scheduled') return false
      return new Date(v.scheduled_at).getTime() >= now
    })
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    )

  const history = parsePriceHistory(property.price_history)
  const lastDrop = [...history]
    .reverse()
    .find((e) => e.from !== null && e.to < (e.from ?? Infinity))
  const recentPriceDrop =
    !!lastDrop && new Date(lastDrop.at).getTime() >= sevenDaysAgo

  return {
    totalLeads: propertyLeads.length,
    recentLeads7d,
    visitsCount: propertyViewings.length,
    nextViewingAt: upcomingViewings[0]?.scheduled_at ?? null,
    hasOfferPending: false,
    pendingOfferAmount: null,
    pendingOfferLeadName: null,
    recentPriceDrop,
    priceDropAt: recentPriceDrop ? lastDrop?.at ?? null : null,
    previousPrice: recentPriceDrop ? lastDrop?.from ?? null : null,
    ownerName: agentName,
  }
}

function activityScore(p: PropertyWithMetrics): number {
  const m = p.metrics
  // Weight: recent leads heaviest, then visits, then total leads, then offers.
  return (
    m.recentLeads7d * 10 +
    m.visitsCount * 5 +
    m.totalLeads +
    (m.hasOfferPending ? 50 : 0)
  )
}

async function getCurrentAgentContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: agent } = await supabase
    .from('agents')
    .select('id, full_name, brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{
      id: string
      full_name: string
      brokerage_id: string | null
    }>()
  if (!agent || !agent.brokerage_id) return null
  return agent as {
    id: string
    full_name: string
    brokerage_id: string
  }
}

export async function getPortfolioSnapshot(): Promise<PortfolioSnapshot | null> {
  const ctx = await getCurrentAgentContext()
  if (!ctx) return null
  const supabase = await createClient()
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS).toISOString()
  const sevenDaysAhead = new Date(now.getTime() + 7 * DAY_MS).toISOString()

  const [activePropsRes, leadsAllRes, leadsRecentRes, leadsPriorRes, viewingsRes] =
    await Promise.all([
      supabase
        .from('properties')
        .select('id, price, listing_expires_at, created_at')
        .eq('brokerage_id', ctx.brokerage_id)
        .eq('status', 'active')
        .returns<
          Array<{
            id: string
            price: number | null
            listing_expires_at: string | null
            created_at: string | null
          }>
        >(),
      supabase
        .from('leads')
        .select('id, property_id, status, created_at')
        .eq('brokerage_id', ctx.brokerage_id)
        .not('status', 'in', '("closed_won","closed_lost")')
        .returns<
          Array<{
            id: string
            property_id: string | null
            status: string | null
            created_at: string | null
          }>
        >(),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('brokerage_id', ctx.brokerage_id)
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('brokerage_id', ctx.brokerage_id)
        .gte('created_at', fourteenDaysAgo)
        .lt('created_at', sevenDaysAgo),
      supabase
        .from('viewings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', sevenDaysAhead),
    ])

  const activeProps = activePropsRes.data ?? []
  const allActiveLeads = leadsAllRes.data ?? []
  const activePropIds = new Set(activeProps.map((p) => p.id))
  const leadsOnActive = allActiveLeads.filter(
    (l) => l.property_id && activePropIds.has(l.property_id),
  )

  const totalValue = activeProps.reduce((sum, p) => sum + (p.price ?? 0), 0)
  const recentLeadsDelta =
    (leadsRecentRes.count ?? 0) - (leadsPriorRes.count ?? 0)

  // Properties needing attention: stale (no leads, listed >14d) or expiring soon
  const fourteenDaysAgoMs = now.getTime() - 14 * DAY_MS
  const sevenDaysAheadMs = now.getTime() + 7 * DAY_MS
  const leadsByProp = new Map<string, number>()
  for (const l of leadsOnActive) {
    if (!l.property_id) continue
    leadsByProp.set(l.property_id, (leadsByProp.get(l.property_id) ?? 0) + 1)
  }
  const needsAttentionCount = activeProps.filter((p) => {
    const propLeads = leadsByProp.get(p.id) ?? 0
    const stale =
      propLeads === 0 &&
      p.created_at !== null &&
      new Date(p.created_at).getTime() < fourteenDaysAgoMs
    const expiring =
      p.listing_expires_at !== null &&
      new Date(p.listing_expires_at).getTime() <= sevenDaysAheadMs
    return stale || expiring
  }).length

  return {
    totalValue,
    activeCount: activeProps.length,
    totalLeads: leadsOnActive.length,
    recentLeadsDelta,
    upcomingViewings: viewingsRes.count ?? 0,
    needsAttentionCount,
  }
}

export async function getActiveProperties(
  filters: PropertyFilters,
): Promise<PropertyWithMetrics[]> {
  const ctx = await getCurrentAgentContext()
  if (!ctx) return []
  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select('*')
    .eq('brokerage_id', ctx.brokerage_id)
    .eq('status', 'active')

  if (filters.listing !== 'all') {
    query = query.eq('listing_type', filters.listing)
  }
  if (filters.owner === 'mine') {
    query = query.eq('agent_id', ctx.id)
  } else if (filters.owner === 'team') {
    query = query.neq('agent_id', ctx.id)
  }
  if (filters.q.trim().length > 0) {
    const escaped = filters.q.replace(/[%_]/g, '\\$&')
    query = query.or(
      [
        `title.ilike.%${escaped}%`,
        `neighborhood.ilike.%${escaped}%`,
        `city.ilike.%${escaped}%`,
        `external_id.ilike.%${escaped}%`,
      ].join(','),
    )
  }

  const { data: properties } = await query.returns<PropertyRow[]>()
  const props = properties ?? []
  if (props.length === 0) return []

  const propIds = props.map((p) => p.id)
  const agentIds = Array.from(
    new Set(props.map((p) => p.agent_id).filter((id): id is string => !!id)),
  )

  const [leadsRes, viewingsRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, property_id, created_at')
      .in('property_id', propIds)
      .not('status', 'in', '("closed_won","closed_lost")')
      .returns<LeadRow[]>(),
    supabase
      .from('viewings')
      .select('id, property_id, scheduled_at, status')
      .in('property_id', propIds)
      .returns<ViewingRow[]>(),
    agentIds.length > 0
      ? supabase
          .from('agents')
          .select('id, full_name')
          .in('id', agentIds)
          .returns<Array<{ id: string; full_name: string }>>()
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
  ])

  const leads = leadsRes.data ?? []
  const viewings = viewingsRes.data ?? []
  const agentNames = new Map(
    (agentsRes.data ?? []).map((a) => [a.id, a.full_name]),
  )

  const enriched: PropertyWithMetrics[] = props.map((p) => ({
    ...p,
    metrics: buildMetrics(
      p,
      leads,
      viewings,
      p.agent_id ? agentNames.get(p.agent_id) ?? null : null,
    ),
  }))

  return enriched.sort((a, b) => activityScore(b) - activityScore(a))
}

export async function getDraftProperties(): Promise<DraftProperty[]> {
  const ctx = await getCurrentAgentContext()
  if (!ctx) return []
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('brokerage_id', ctx.brokerage_id)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .returns<PropertyRow[]>()

  if (!properties?.length) return []

  return properties
    .map((p) => ({
      ...p,
      completion: computeCompletion(p),
      anomalies: detectAnomalies(p),
    }))
    .sort((a, b) => {
      // Errors first (so the broker fixes them), then by completion DESC.
      const aErr = a.anomalies.some((x) => x.level === 'error')
      const bErr = b.anomalies.some((x) => x.level === 'error')
      if (aErr !== bErr) return aErr ? -1 : 1
      return b.completion.percentage - a.completion.percentage
    })
}

export async function getArchivedProperties(
  limit = 25,
): Promise<ArchivedProperty[]> {
  const ctx = await getCurrentAgentContext()
  if (!ctx) return []
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('brokerage_id', ctx.brokerage_id)
    .in('status', ['sold', 'rented', 'archived'])
    .order('updated_at', { ascending: false })
    .limit(limit)
    .returns<PropertyRow[]>()

  if (!properties?.length) return []

  const agentIds = Array.from(
    new Set(properties.map((p) => p.agent_id).filter((id): id is string => !!id)),
  )
  const agentsRes =
    agentIds.length > 0
      ? await supabase
          .from('agents')
          .select('id, full_name')
          .in('id', agentIds)
          .returns<Array<{ id: string; full_name: string }>>()
      : { data: [] as Array<{ id: string; full_name: string }> }

  const agentNames = new Map(
    (agentsRes.data ?? []).map((a) => [a.id, a.full_name]),
  )

  return properties.map((p) => ({
    ...p,
    closedAt: p.updated_at,
    closedByName: p.agent_id ? agentNames.get(p.agent_id) ?? null : null,
  }))
}

export type CountsByListing = { all: number; sale: number; rent: number }
export type CountsByOwner = { mine: number; team: number }

export async function getPropertyCounts(): Promise<{
  byListing: CountsByListing
  byOwner: CountsByOwner
}> {
  const ctx = await getCurrentAgentContext()
  if (!ctx) {
    return {
      byListing: { all: 0, sale: 0, rent: 0 },
      byOwner: { mine: 0, team: 0 },
    }
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('properties')
    .select('id, listing_type, agent_id, status')
    .eq('brokerage_id', ctx.brokerage_id)
    .in('status', ['active', 'pending'])
    .returns<
      Array<{
        id: string
        listing_type: string
        agent_id: string | null
        status: string
      }>
    >()

  const all = data ?? []
  return {
    byListing: {
      all: all.length,
      sale: all.filter((p) => p.listing_type === 'sale').length,
      rent: all.filter((p) => p.listing_type === 'rent').length,
    },
    byOwner: {
      mine: all.filter((p) => p.agent_id === ctx.id).length,
      team: all.filter((p) => p.agent_id !== ctx.id).length,
    },
  }
}

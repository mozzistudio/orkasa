import { DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OffersBoard } from './offers-board'

export type OfferRow = {
  id: string
  deal_id: string | null
  lead_id: string
  property_id: string
  brokerage_id: string
  agent_id: string | null
  amount: number
  currency: string
  status: string
  conditions: string | null
  notes: string | null
  created_at: string
  updated_at: string
  lead_name: string
  property_title: string
  agent_name: string | null
}

export default async function OffersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()

  if (!agent?.brokerage_id) return null

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('brokerage_id', agent.brokerage_id)
    .order('created_at', { ascending: false })
    .returns<OfferRow[]>()

  const allOffers = offers ?? []

  const leadIds = [...new Set(allOffers.map((o) => o.lead_id))]
  const propertyIds = [...new Set(allOffers.map((o) => o.property_id))]
  const agentIds = [...new Set(allOffers.map((o) => o.agent_id).filter(Boolean))] as string[]

  const [leadsRes, propertiesRes, agentsRes] = await Promise.all([
    leadIds.length > 0
      ? supabase.from('leads').select('id, full_name').in('id', leadIds).returns<Array<{ id: string; full_name: string }>>()
      : { data: [] },
    propertyIds.length > 0
      ? supabase.from('properties').select('id, title').in('id', propertyIds).returns<Array<{ id: string; title: string }>>()
      : { data: [] },
    agentIds.length > 0
      ? supabase.from('agents').select('id, full_name').in('id', agentIds).returns<Array<{ id: string; full_name: string }>>()
      : { data: [] },
  ])

  const leadsById = new Map((leadsRes.data ?? []).map((l) => [l.id, l.full_name]))
  const propsById = new Map((propertiesRes.data ?? []).map((p) => [p.id, p.title]))
  const agentsById = new Map((agentsRes.data ?? []).map((a) => [a.id, a.full_name]))

  const enriched: OfferRow[] = allOffers.map((o) => ({
    ...o,
    lead_name: leadsById.get(o.lead_id) ?? 'Lead',
    property_title: propsById.get(o.property_id) ?? 'Propiedad',
    agent_name: o.agent_id ? (agentsById.get(o.agent_id) ?? null) : null,
  }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          Ofertas
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {enriched.length}
          </span>
        </h1>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-8 text-center md:p-12">
          <DollarSign
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-steel">
            Sin ofertas registradas aún.
          </p>
        </div>
      ) : (
        <OffersBoard offers={enriched} />
      )}
    </div>
  )
}

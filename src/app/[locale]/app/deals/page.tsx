import { GitBranch } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DealsPipelineBoard, type DealRow } from './deals-pipeline-board'

export default async function DealsPage() {
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

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('brokerage_id', agent.brokerage_id)
    .order('created_at', { ascending: false })
    .returns<DealRow[]>()

  const allDeals = deals ?? []

  const leadIds = [...new Set(allDeals.map((d) => d.lead_id))]
  const propertyIds = [...new Set(allDeals.map((d) => d.property_id).filter(Boolean))] as string[]
  const agentIds = [...new Set(allDeals.map((d) => d.agent_id).filter(Boolean))] as string[]

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

  const enriched: DealRow[] = allDeals.map((d) => ({
    ...d,
    lead_name: leadsById.get(d.lead_id) ?? 'Lead',
    property_title: d.property_id ? (propsById.get(d.property_id) ?? null) : null,
    agent_name: d.agent_id ? (agentsById.get(d.agent_id) ?? null) : null,
  }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          Pipeline
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {enriched.length}
          </span>
        </h1>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-8 text-center md:p-12">
          <GitBranch
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-steel">
            Sin deals activos. Las ofertas aceptadas crean deals automáticamente.
          </p>
        </div>
      ) : (
        <DealsPipelineBoard deals={enriched} />
      )}
    </div>
  )
}

import Link from 'next/link'
import { GitBranch, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OperacionesTable, type OperacionRow } from './operaciones-table'
import { CreateOperacionButton } from './create-operacion-button'
import type { Database } from '@/lib/database.types'

type Deal = Database['public']['Tables']['deals']['Row']
type LeadProperty = Database['public']['Tables']['lead_properties']['Row']

const STAGE_ORDER: Database['public']['Enums']['deal_stage'][] = [
  'contacto_inicial',
  'visitas',
  'negociacion',
  'promesa_firmada',
  'tramite_bancario',
  'escritura_publica',
  'entrega_llaves',
  'post_cierre',
  'closed_won',
  'closed_lost',
]

export default async function OperacionesPage() {
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
    .order('updated_at', { ascending: false })
    .returns<Deal[]>()

  const allDeals = deals ?? []

  // Sort by stage progression then by recency
  allDeals.sort((a, b) => {
    const sa = STAGE_ORDER.indexOf(a.stage)
    const sb = STAGE_ORDER.indexOf(b.stage)
    if (sa !== sb) return sa - sb
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  const leadIds = [...new Set(allDeals.map((d) => d.lead_id))]
  const dealIds = allDeals.map((d) => d.id)

  const [leadsRes, propsRes, agentsRes, leadPropsRes] = await Promise.all([
    leadIds.length > 0
      ? supabase
          .from('leads')
          .select('id, full_name')
          .in('id', leadIds)
          .returns<Array<{ id: string; full_name: string }>>()
      : { data: [] },
    supabase
      .from('properties')
      .select('id, title')
      .eq('brokerage_id', agent.brokerage_id)
      .returns<Array<{ id: string; title: string }>>(),
    supabase
      .from('agents')
      .select('id, full_name')
      .eq('brokerage_id', agent.brokerage_id)
      .returns<Array<{ id: string; full_name: string }>>(),
    dealIds.length > 0
      ? supabase
          .from('lead_properties')
          .select('deal_id, property_id, status')
          .in('deal_id', dealIds)
          .returns<Array<Pick<LeadProperty, 'deal_id' | 'property_id' | 'status'>>>()
      : { data: [] },
  ])

  // Search-friendly lead list for the create modal
  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, full_name, phone, email, property_id')
    .eq('brokerage_id', agent.brokerage_id)
    .order('updated_at', { ascending: false })
    .limit(500)
    .returns<
      Array<{
        id: string
        full_name: string
        phone: string | null
        email: string | null
        property_id: string | null
      }>
    >()

  const leadsById = new Map((leadsRes.data ?? []).map((l) => [l.id, l.full_name]))
  const propsById = new Map((propsRes.data ?? []).map((p) => [p.id, p.title]))
  const agentsById = new Map((agentsRes.data ?? []).map((a) => [a.id, a.full_name]))

  // Group lead_properties by deal to count considered properties
  const propsByDeal = new Map<string, Array<{ property_id: string; status: string }>>()
  for (const lp of leadPropsRes.data ?? []) {
    if (!lp.deal_id) continue
    const arr = propsByDeal.get(lp.deal_id) ?? []
    arr.push({ property_id: lp.property_id, status: lp.status })
    propsByDeal.set(lp.deal_id, arr)
  }

  const enriched: OperacionRow[] = allDeals.map((d) => {
    const considered = propsByDeal.get(d.id) ?? []
    return {
      id: d.id,
      lead_id: d.lead_id,
      lead_name: leadsById.get(d.lead_id) ?? 'Cliente',
      title: d.title,
      stage: d.stage,
      amount: d.amount ? Number(d.amount) : null,
      currency: d.currency,
      property_count: considered.length,
      property_titles: considered
        .map((p) => propsById.get(p.property_id))
        .filter((t): t is string => Boolean(t)),
      winning_property_title: d.winning_property_id
        ? propsById.get(d.winning_property_id) ?? null
        : null,
      agent_name: d.agent_id ? agentsById.get(d.agent_id) ?? null : null,
      created_at: d.created_at,
      updated_at: d.updated_at,
      closed_at: d.closed_at,
    }
  })

  const propertiesForSelect =
    (propsRes.data ?? []).map((p) => ({ id: p.id, title: p.title }))
  const leadsForSelect = (allLeads ?? []).map((l) => ({
    id: l.id,
    full_name: l.full_name,
    phone: l.phone,
    email: l.email,
    property_id: l.property_id,
  }))

  const activeCount = enriched.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost',
  ).length
  const wonCount = enriched.filter((d) => d.stage === 'closed_won').length

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-4 flex items-start justify-between gap-4 md:mb-6">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            Operaciones
          </h1>
          <p className="mt-1 text-[12px] text-steel">
            <span className="font-mono tabular-nums">{activeCount}</span> activas
            {wonCount > 0 && (
              <>
                {' · '}
                <span className="font-mono tabular-nums text-green-text">
                  {wonCount}
                </span>{' '}
                cerradas con éxito
              </>
            )}
          </p>
        </div>
        <CreateOperacionButton
          leads={leadsForSelect}
          properties={propertiesForSelect}
        />
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-[12px] border border-bone bg-paper p-8 text-center md:p-12">
          <GitBranch
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-steel max-w-md mx-auto">
            Sin operaciones aún. Una operación representa el proyecto de
            compra de un cliente: las propiedades que está considerando, las
            visitas, ofertas y el cierre.
          </p>
          <div className="mt-4">
            <CreateOperacionButton
              leads={leadsForSelect}
              properties={propertiesForSelect}
              variant="primary"
              label="Crear primera operación"
            />
          </div>
        </div>
      ) : (
        <OperacionesTable rows={enriched} />
      )}
    </div>
  )
}

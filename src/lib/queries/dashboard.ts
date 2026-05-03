import { createClient } from '@/lib/supabase/server'

export type DashboardTodo = {
  id: string
  lead_id: string
  step_number: number
  phase: string
  title: string
  cta_action: string
  cta_metadata: Record<string, unknown>
  due_at: string | null
  status: 'open' | 'escalated'
  property_id: string | null
  deal_id: string | null
  lead_name: string
  lead_phone: string | null
  property_title: string | null
  property_price: number | null
}

export async function getMyOpenTasks(limit = 6): Promise<DashboardTodo[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) return []

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      'id, lead_id, step_number, phase, title, cta_action, cta_metadata, due_at, status, property_id, deal_id',
    )
    .eq('brokerage_id', agent.brokerage_id)
    .in('status', ['open', 'escalated'])
    .order('status', { ascending: false }) // escalated first
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(limit)
    .returns<
      Array<{
        id: string
        lead_id: string
        step_number: number
        phase: string
        title: string
        cta_action: string
        cta_metadata: Record<string, unknown> | null
        due_at: string | null
        status: 'open' | 'escalated'
        property_id: string | null
        deal_id: string | null
      }>
    >()

  if (!tasks?.length) return []

  const leadIds = [...new Set(tasks.map((t) => t.lead_id))]
  const propertyIds = [
    ...new Set(tasks.map((t) => t.property_id).filter(Boolean)),
  ] as string[]

  const [leadsRes, propsRes] = await Promise.all([
    leadIds.length > 0
      ? supabase
          .from('leads')
          .select('id, full_name, phone')
          .in('id', leadIds)
          .returns<Array<{ id: string; full_name: string; phone: string | null }>>()
      : { data: [] },
    propertyIds.length > 0
      ? supabase
          .from('properties')
          .select('id, title, price')
          .in('id', propertyIds)
          .returns<Array<{ id: string; title: string; price: number | null }>>()
      : { data: [] },
  ])

  const leadsById = new Map((leadsRes.data ?? []).map((l) => [l.id, l]))
  const propsById = new Map((propsRes.data ?? []).map((p) => [p.id, p]))

  return tasks.map((t) => {
    const lead = leadsById.get(t.lead_id)
    const prop = t.property_id ? propsById.get(t.property_id) : null
    return {
      id: t.id,
      lead_id: t.lead_id,
      step_number: t.step_number,
      phase: t.phase,
      title: t.title,
      cta_action: t.cta_action,
      cta_metadata: t.cta_metadata ?? {},
      due_at: t.due_at,
      status: t.status,
      property_id: t.property_id,
      deal_id: t.deal_id,
      lead_name: lead?.full_name ?? 'Lead',
      lead_phone: lead?.phone ?? null,
      property_title: prop?.title ?? null,
      property_price: prop?.price ?? null,
    }
  })
}

export type PipelineStage = {
  id: string
  name: string
  value: number
  count: number
}

export type ClosableDeal = {
  leadId: string
  leadName: string
  propertyTitle: string | null
  price: number
  commission: number
  daysInStage: number
}

export type PipelineSnapshot = {
  totalValue: number
  readyToSign: number
  closedThisMonth: number
  estimatedCommission: number
  commissionEarned: number
  commissionClosable: number
  closableDeals: ClosableDeal[]
  closeRate: number
  stages: PipelineStage[]
  trends: {
    closedDelta: number
    closeRateDelta: number
    visitsDelta: number
    visitsThisWeek: number
  }
}

export type TodayAction = {
  id: string
  variant: 'neutral' | 'opportunity' | 'urgent'
  tag: string
  title: string
  context: string
  amount: string
  leadId: string | null
  phone: string | null
  clientName: string | null
  propertyTitle: string | null
}

export type CoolingLead = {
  id: string
  name: string
  channel: string
  propertyTitle: string | null
  amount: number | null
  daysSilent: number
  phone: string | null
}

export type PropertyAlert = {
  id: string
  title: string
  imageUrl: string | null
  severity: 'warn' | 'danger' | 'opportunity'
  issue: string
  issueStrong: string
  actionType: 'boost' | 'view-leads' | 'notify' | 'renew'
}

export type AgentPerformance = {
  id: string
  name: string
  initials: string
  role: string
  pipeline: number
  avgResponseMinutes: number
  dealsOpen: number
  leadsUncontacted: number
  tier: 'top' | 'warn' | 'default'
}

export type UpcomingViewing = {
  id: string
  scheduledAt: string
  leadName: string
  propertyTitle: string
  leadId: string | null
}

export type PendingReminder = {
  id: string
  leadId: string | null
  leadName: string
  leadPhone: string | null
  propertyTitle: string | null
  checkId: string | null
  docCount: number
  docNames: string[]
  oldestDays: number
}

const LEAD_STAGES: Array<{ id: string; name: string; statuses: string[] }> = [
  { id: 'new', name: 'Nuevos', statuses: ['new'] },
  { id: 'contacted', name: 'Contactados', statuses: ['contacted'] },
  { id: 'qualified', name: 'Calificados', statuses: ['qualified'] },
  { id: 'viewing_scheduled', name: 'Visita agendada', statuses: ['viewing_scheduled'] },
  { id: 'negotiating', name: 'Negociando', statuses: ['negotiating'] },
  { id: 'closed_won', name: 'Cerrados', statuses: ['closed_won'] },
]

const COMMISSION_RATE = 0.025

function startOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function startOfLastMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString()
}

function endOfLastMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59).toISOString()
}

function startOfWeek(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString()
}

function startOfLastWeek(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString()
}

function endOfLastWeek(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 1
  return new Date(d.getFullYear(), d.getMonth(), diff, 23, 59, 59).toISOString()
}

type LeadWithProperty = {
  id: string
  full_name: string | null
  status: string | null
  property_id: string | null
  properties: { price: number | null; title: string | null } | null
  created_at: string | null
  updated_at: string | null
}

export async function getPipelineSnapshot(): Promise<PipelineSnapshot> {
  const supabase = await createClient()
  const now = new Date()

  const [leadsRes, closedLastMonthRes, leadsLastMonthRes, visitsWeekRes, visitsLastWeekRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, full_name, status, property_id, properties(price, title), created_at, updated_at')
      .not('status', 'eq', 'closed_lost')
      .returns<LeadWithProperty[]>(),
    supabase
      .from('leads')
      .select('id, properties(price)')
      .eq('status', 'closed_won')
      .gte('updated_at', startOfLastMonth(now))
      .lte('updated_at', endOfLastMonth(now))
      .returns<Array<{ id: string; properties: { price: number | null } | null }>>(),
    supabase
      .from('leads')
      .select('id, status', { count: 'exact' })
      .gte('created_at', startOfLastMonth(now))
      .lte('created_at', endOfLastMonth(now)),
    supabase
      .from('viewings')
      .select('id', { count: 'exact' })
      .gte('scheduled_at', startOfWeek(now)),
    supabase
      .from('viewings')
      .select('id', { count: 'exact' })
      .gte('scheduled_at', startOfLastWeek(now))
      .lte('scheduled_at', endOfLastWeek(now)),
  ])

  const leads = leadsRes.data ?? []
  const monthStart = startOfMonth(now)

  const stages: PipelineStage[] = LEAD_STAGES.map((stage) => {
    let stageLeads: LeadWithProperty[]
    if (stage.id === 'closed_won') {
      stageLeads = leads.filter(
        (l) => l.status === 'closed_won' && l.created_at && l.created_at >= monthStart,
      )
    } else {
      stageLeads = leads.filter((l) => stage.statuses.includes(l.status ?? ''))
    }
    const value = stageLeads.reduce((sum, l) => sum + (l.properties?.price ?? 0), 0)
    return { id: stage.id, name: stage.name, value, count: stageLeads.length }
  })

  const totalValue = stages.reduce((s, st) => s + st.value, 0)
  const readyToSign = stages.find((s) => s.id === 'negotiating')?.value ?? 0
  const closedThisMonth = stages.find((s) => s.id === 'closed_won')?.value ?? 0
  const estimatedCommission = totalValue * COMMISSION_RATE
  const commissionEarned = closedThisMonth * COMMISSION_RATE
  const commissionClosable = readyToSign * COMMISSION_RATE

  const closableDeals: ClosableDeal[] = leads
    .filter((l) => l.status === 'negotiating')
    .map((l) => {
      const updated = l.updated_at ? new Date(l.updated_at).getTime() : Date.now()
      const daysInStage = Math.max(0, Math.floor((Date.now() - updated) / 86_400_000))
      const price = l.properties?.price ?? 0
      return {
        leadId: l.id,
        leadName: l.full_name ?? 'Cliente',
        propertyTitle: l.properties?.title ?? null,
        price,
        commission: price * COMMISSION_RATE,
        daysInStage,
      }
    })
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 3)

  const closedLastMonthValue = (closedLastMonthRes.data ?? []).reduce(
    (s, l) => s + (l.properties?.price ?? 0),
    0,
  )
  const closedDelta = closedLastMonthValue > 0
    ? Math.round(((closedThisMonth - closedLastMonthValue) / closedLastMonthValue) * 100)
    : closedThisMonth > 0 ? 100 : 0

  const closedThisMonthCount = stages.find((s) => s.id === 'closed_won')?.count ?? 0
  const activeThisMonth = leads.filter(
    (l) => l.status !== 'closed_won' || (l.created_at && l.created_at >= monthStart),
  ).length
  const closeRateThisMonth = activeThisMonth > 0
    ? Math.round((closedThisMonthCount / activeThisMonth) * 100)
    : 0

  const closedLastMonthCount = (closedLastMonthRes.data ?? []).length
  const totalLastMonth = leadsLastMonthRes.count ?? 0
  const closeRateLastMonth = totalLastMonth > 0
    ? Math.round((closedLastMonthCount / totalLastMonth) * 100)
    : 0

  const closeRateDelta = closeRateThisMonth - closeRateLastMonth
  const visitsThisWeek = visitsWeekRes.count ?? 0
  const visitsLastWeek = visitsLastWeekRes.count ?? 0
  const visitsDelta = visitsThisWeek - visitsLastWeek

  return {
    totalValue,
    readyToSign,
    closedThisMonth,
    estimatedCommission,
    commissionEarned,
    commissionClosable,
    closableDeals,
    closeRate: closeRateThisMonth,
    stages,
    trends: { closedDelta, closeRateDelta, visitsDelta, visitsThisWeek },
  }
}

type InteractionRow = { lead_id: string; created_at: string }

export async function getCoolingLeads(limit = 5): Promise<CoolingLead[]> {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('id, full_name, origin, phone, property_id, created_at, properties(title, price)')
    .not('status', 'in', '("closed_won","closed_lost")')
    .returns<Array<{
      id: string
      full_name: string
      origin: string
      phone: string | null
      property_id: string | null
      created_at: string | null
      properties: { title: string; price: number | null } | null
    }>>()

  if (!leads?.length) return []

  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('lead_id, created_at')
    .in('lead_id', leads.map((l) => l.id))
    .order('created_at', { ascending: false })
    .returns<InteractionRow[]>()

  const lastContactByLead = new Map<string, string>()
  for (const i of interactions ?? []) {
    if (!lastContactByLead.has(i.lead_id)) {
      lastContactByLead.set(i.lead_id, i.created_at)
    }
  }

  const now = Date.now()
  const cooling = leads
    .map((lead) => {
      const lastContactDate = lastContactByLead.get(lead.id) ?? lead.created_at
      const lastDate = lastContactDate ? new Date(lastContactDate).getTime() : 0
      const daysSilent = lastDate > 0
        ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))
        : 30

      return {
        id: lead.id,
        name: lead.full_name,
        channel: lead.origin,
        propertyTitle: lead.properties?.title ?? null,
        amount: lead.properties?.price ?? null,
        daysSilent,
        phone: lead.phone,
      }
    })
    .filter((l) => l.daysSilent >= 7)
    .sort((a, b) => b.daysSilent - a.daysSilent)
    .slice(0, limit)

  return cooling
}

export async function getTodayActions(): Promise<TodayAction[]> {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  const [viewingsRes, unassignedRes, coolingRes] = await Promise.all([
    supabase
      .from('viewings')
      .select('id, scheduled_at, lead_id, property_id, leads(full_name, phone), properties(title, price)')
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .returns<Array<{
        id: string
        scheduled_at: string
        lead_id: string
        property_id: string
        leads: { full_name: string; phone: string | null } | null
        properties: { title: string; price: number | null } | null
      }>>(),
    supabase
      .from('leads')
      .select('id, full_name, ai_score, phone, properties(title, price)')
      .is('assigned_agent_id', null)
      .eq('status', 'new')
      .order('ai_score', { ascending: false, nullsFirst: false })
      .limit(5)
      .returns<Array<{
        id: string
        full_name: string
        ai_score: number | null
        phone: string | null
        properties: { title: string; price: number | null } | null
      }>>(),
    getCoolingLeads(3),
  ])

  const actions: TodayAction[] = []

  const viewing = viewingsRes.data?.[0]
  if (viewing) {
    const time = new Date(viewing.scheduled_at).toLocaleTimeString('es-PA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    actions.push({
      id: `viewing-${viewing.id}`,
      variant: 'neutral',
      tag: `Visita hoy ${time}`,
      title: `Llamá a ${viewing.leads?.full_name ?? 'el cliente'} antes de la visita`,
      context: `Viene a ver ${viewing.properties?.title ?? 'la propiedad'}. Confirmale el horario.`,
      amount: viewing.properties?.price
        ? `$${Math.round(viewing.properties.price / 1000)}K`
        : '',
      leadId: viewing.lead_id,
      phone: viewing.leads?.phone ?? null,
      clientName: viewing.leads?.full_name ?? null,
      propertyTitle: viewing.properties?.title ?? null,
    })
  }

  const unassigned = unassignedRes.data ?? []
  if (unassigned.length > 0) {
    const totalPotential = unassigned.reduce((s, l) => s + (l.properties?.price ?? 0), 0)
    const highScore = unassigned.find((l) => (l.ai_score ?? 0) >= 70)
    actions.push({
      id: 'unassigned-leads',
      variant: 'opportunity',
      tag: 'Oportunidad caliente',
      title: `${unassigned.length} lead${unassigned.length > 1 ? 's' : ''} nuevo${unassigned.length > 1 ? 's' : ''} sin asignar${highScore ? ' — uno con score alto' : ''}`,
      context: highScore
        ? `${highScore.full_name} pregunta por ${highScore.properties?.title ?? 'una propiedad'}. Asignalo antes de que se enfríe.`
        : `Llegaron leads nuevos. Asignalos para que los contacten.`,
      amount: totalPotential > 0 ? `~$${Math.round(totalPotential / 1000)}K potencial` : '',
      leadId: null,
      phone: null,
      clientName: null,
      propertyTitle: null,
    })
  }

  if (coolingRes.length > 0) {
    const coldest = coolingRes[0]
    actions.push({
      id: `cooling-${coldest.id}`,
      variant: 'urgent',
      tag: `${coldest.daysSilent} días sin respuesta`,
      title: `${coldest.name} no responde · su deal se enfría`,
      context: coldest.propertyTitle
        ? `Interesado/a en ${coldest.propertyTitle}. Todavía tenés ventana para reactivar.`
        : 'Sin propiedad asignada. Relanzá el contacto.',
      amount: coldest.amount
        ? coldest.amount >= 10000
          ? `$${Math.round(coldest.amount / 1000)}K`
          : `$${coldest.amount.toLocaleString('en-US')}/mes`
        : '',
      leadId: coldest.id,
      phone: coldest.phone,
      clientName: coldest.name,
      propertyTitle: coldest.propertyTitle,
    })
  }

  while (actions.length < 3) {
    actions.push({
      id: `placeholder-${actions.length}`,
      variant: 'neutral',
      tag: 'Sin urgencia',
      title: 'Todo al día — aprovechá para revisar tu inventario',
      context: 'Actualizá fotos, precios y descripciones de tus propiedades.',
      amount: '',
      leadId: null,
      phone: null,
      clientName: null,
      propertyTitle: null,
    })
  }

  return actions.slice(0, 3)
}

export async function getPropertiesNeedingAttention(limit = 4): Promise<PropertyAlert[]> {
  const supabase = await createClient()
  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, images, price, listing_type, status, updated_at')
    .eq('status', 'active')
    .returns<Array<{
      id: string
      title: string
      images: unknown
      price: number | null
      listing_type: string
      status: string
      updated_at: string | null
    }>>()

  if (!properties?.length) return []

  const propertyIds = properties.map((p) => p.id)

  const [leadsRes, viewingsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, property_id, created_at')
      .in('property_id', propertyIds)
      .not('status', 'in', '("closed_won","closed_lost")')
      .returns<Array<{ id: string; property_id: string; created_at: string | null }>>(),
    supabase
      .from('viewings')
      .select('id, property_id')
      .in('property_id', propertyIds)
      .returns<Array<{ id: string; property_id: string }>>(),
  ])

  const leadsByProperty = new Map<string, Array<{ id: string; created_at: string | null }>>()
  for (const l of leadsRes.data ?? []) {
    const arr = leadsByProperty.get(l.property_id) ?? []
    arr.push(l)
    leadsByProperty.set(l.property_id, arr)
  }

  const viewingsByProperty = new Map<string, number>()
  for (const v of viewingsRes.data ?? []) {
    viewingsByProperty.set(v.property_id, (viewingsByProperty.get(v.property_id) ?? 0) + 1)
  }

  type StoredImage = { path: string; url: string }
  const alerts: PropertyAlert[] = []

  for (const prop of properties) {
    const pLeads = leadsByProperty.get(prop.id) ?? []
    const pViewings = viewingsByProperty.get(prop.id) ?? 0
    const imgs = Array.isArray(prop.images) ? (prop.images as StoredImage[]) : []
    const imageUrl = imgs[0]?.url ?? null

    const recentLeads = pLeads.filter((l) => l.created_at && l.created_at >= fourteenDaysAgo)

    if (recentLeads.length === 0 && pLeads.length === 0) {
      alerts.push({
        id: prop.id,
        title: prop.title,
        imageUrl,
        severity: 'warn',
        issue: '0 leads en 14 días · considerá bajar precio o nuevas fotos',
        issueStrong: '0 leads en 14 días',
        actionType: 'boost',
      })
    } else if (pLeads.length >= 5 && pViewings === 0) {
      alerts.push({
        id: prop.id,
        title: prop.title,
        imageUrl,
        severity: 'danger',
        issue: `${pLeads.length} leads · 0 visitas · pitch o precio no enganchan`,
        issueStrong: `${pLeads.length} leads · 0 visitas`,
        actionType: 'view-leads',
      })
    }
  }

  return alerts.slice(0, limit)
}

export async function getTeamPerformance(): Promise<AgentPerformance[]> {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = startOfWeek(now)

  const { data: agents } = await supabase
    .from('agents')
    .select('id, full_name, role')
    .returns<Array<{ id: string; full_name: string; role: string | null }>>()

  if (!agents?.length) return []

  const agentIds = agents.map((a) => a.id)

  const [leadsRes, interactionsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, assigned_agent_id, status, properties(price)')
      .in('assigned_agent_id', agentIds)
      .not('status', 'in', '("closed_won","closed_lost")')
      .returns<Array<{
        id: string
        assigned_agent_id: string
        status: string | null
        properties: { price: number | null } | null
      }>>(),
    supabase
      .from('lead_interactions')
      .select('id, agent_id, lead_id, created_at')
      .in('agent_id', agentIds)
      .gte('created_at', weekStart)
      .returns<Array<{ id: string; agent_id: string; lead_id: string; created_at: string }>>(),
  ])

  const leads = leadsRes.data ?? []
  const interactions = interactionsRes.data ?? []

  function initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
  }

  const avgPipeline = agents.length > 0
    ? leads.reduce((s, l) => s + (l.properties?.price ?? 0), 0) / agents.length
    : 0

  return agents.map((agent) => {
    const agentLeads = leads.filter((l) => l.assigned_agent_id === agent.id)
    const pipeline = agentLeads.reduce((s, l) => s + (l.properties?.price ?? 0), 0)
    const dealsOpen = agentLeads.length

    const agentInteractions = interactions.filter((i) => i.agent_id === agent.id)
    const contactedLeadIds = new Set(agentInteractions.map((i) => i.lead_id))
    const leadsUncontacted = agentLeads.filter((l) => !contactedLeadIds.has(l.id)).length

    const avgResponseMinutes = agentInteractions.length > 0 ? 15 : 60

    let tier: 'top' | 'warn' | 'default' = 'default'
    if (pipeline > avgPipeline && avgResponseMinutes < 30) tier = 'top'
    else if (avgResponseMinutes > 60 || leadsUncontacted > 3) tier = 'warn'

    return {
      id: agent.id,
      name: agent.full_name,
      initials: initials(agent.full_name),
      role: agent.role ?? 'agent',
      pipeline,
      avgResponseMinutes,
      dealsOpen,
      leadsUncontacted,
      tier,
    }
  })
}

export async function getDashboardUser(): Promise<{
  id: string
  firstName: string
  role: string
  brokerageId: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, role, brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ full_name: string; role: string | null; brokerage_id: string | null }>()

  const fullName = agent?.full_name ?? user.email ?? 'Usuario'
  const firstName = fullName.split(' ')[0] ?? fullName

  return {
    id: user.id,
    firstName,
    role: agent?.role ?? 'agent',
    brokerageId: agent?.brokerage_id ?? null,
  }
}

export async function getUpcomingViewings(limit = 5): Promise<UpcomingViewing[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('viewings')
    .select('id, scheduled_at, lead_id, leads(full_name), properties(title)')
    .gte('scheduled_at', now)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(limit)
    .returns<Array<{
      id: string
      scheduled_at: string
      lead_id: string | null
      leads: { full_name: string } | null
      properties: { title: string } | null
    }>>()

  return (data ?? []).map((v) => ({
    id: v.id,
    scheduledAt: v.scheduled_at,
    leadName: v.leads?.full_name ?? 'Cliente',
    propertyTitle: v.properties?.title ?? 'Propiedad',
    leadId: v.lead_id,
  }))
}

/**
 * Reads the compliance reminders shown in the dashboard "Deals en curso"
 * section directly from the task engine — every open `request_doc` task is a
 * pending document request. This keeps the dashboard and the Tareas page in
 * sync (single source of truth) instead of querying `compliance_documents`
 * separately.
 */
const DOC_CODE_LABELS: Record<string, string> = {
  identity: 'Cédula',
  address_proof: 'Comprobante de domicilio',
  income_proof: 'Comprobante de ingresos',
  bank_statements_6m: 'Estados bancarios 6m',
  pre_approval: 'Pre-aprobación bancaria',
  funds_constitution_letter: 'Carta constitución de fondos',
  pep_declaration: 'Declaración PEP',
  paz_y_salvo_nacional: 'Paz y salvo nacional',
  paz_y_salvo_municipal: 'Paz y salvo municipal',
  registro_publico_libre_gravamenes: 'Registro Público (libre gravámenes)',
  recibos_servicios_publicos: 'Recibos servicios públicos',
  cuotas_mantenimiento: 'Cuotas mantenimiento',
}

function labelDocCode(code: string): string {
  return DOC_CODE_LABELS[code] ?? code
}

export async function getPendingReminders(limit = 5): Promise<PendingReminder[]> {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      'id, lead_id, cta_metadata, created_at, leads!inner(full_name, phone, property_id, properties(title))',
    )
    .eq('cta_action', 'request_doc')
    .in('status', ['open', 'escalated'])
    .order('created_at', { ascending: true })
    .returns<
      Array<{
        id: string
        lead_id: string
        cta_metadata: Record<string, unknown> | null
        created_at: string
        leads: {
          full_name: string
          phone: string | null
          property_id: string | null
          properties: { title: string } | null
        }
      }>
    >()

  if (!tasks?.length) return []

  type Bucket = {
    leadId: string
    leadName: string
    leadPhone: string | null
    propertyTitle: string | null
    docCodes: Set<string>
    oldestCreatedAt: number
  }

  const byLead = new Map<string, Bucket>()
  for (const task of tasks) {
    const created = new Date(task.created_at).getTime()
    const codes = Array.isArray(task.cta_metadata?.docCodes)
      ? (task.cta_metadata.docCodes as string[])
      : []
    const existing = byLead.get(task.lead_id)
    if (existing) {
      for (const c of codes) existing.docCodes.add(c)
      if (created < existing.oldestCreatedAt) existing.oldestCreatedAt = created
    } else {
      byLead.set(task.lead_id, {
        leadId: task.lead_id,
        leadName: task.leads.full_name,
        leadPhone: task.leads.phone,
        propertyTitle: task.leads.properties?.title ?? null,
        docCodes: new Set(codes),
        oldestCreatedAt: created,
      })
    }
  }

  // Resolve a check_id per lead so the dashboard rows can deep-link to the
  // compliance detail page. If the lead has no compliance check yet, the row
  // falls back to the compliance index page.
  const leadIds = Array.from(byLead.keys())
  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('id, lead_id')
    .in('lead_id', leadIds)
    .returns<Array<{ id: string; lead_id: string }>>()

  const checkByLead = new Map<string, string>()
  for (const c of checks ?? []) {
    if (!checkByLead.has(c.lead_id)) checkByLead.set(c.lead_id, c.id)
  }

  const now = Date.now()
  return Array.from(byLead.values())
    .sort((a, b) => a.oldestCreatedAt - b.oldestCreatedAt)
    .slice(0, limit)
    .map((b) => {
      const codes = Array.from(b.docCodes)
      return {
        id: b.leadId,
        leadId: b.leadId,
        leadName: b.leadName,
        leadPhone: b.leadPhone,
        propertyTitle: b.propertyTitle,
        checkId: checkByLead.get(b.leadId) ?? null,
        docCount: codes.length,
        docNames: codes.map(labelDocCode),
        oldestDays: Math.max(0, Math.floor((now - b.oldestCreatedAt) / 86_400_000)),
      }
    })
}

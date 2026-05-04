import { createClient } from '@/lib/supabase/server'

const COMMISSION_RATE = 0.025

export type DealPrediction = {
  dealId: string
  leadId: string
  leadName: string
  propertyTitle: string | null
  amount: number
  commission: number
  stage: string
  daysInStage: number
  probability: number
  weightedAmount: number
  atRisk: boolean
  riskReason: string | null
  nextTaskTitle: string | null
  nextTaskPhase: string | null
}

export type ForecastSummary = {
  predictions: DealPrediction[]
  totalPipelineValue: number
  weightedForecast: number
  totalCommission: number
  atRiskCount: number
  atRiskValue: number
}

const STAGE_BASE_PROBABILITY: Record<string, number> = {
  contacto_inicial: 5,
  visitas: 15,
  negociacion: 35,
  promesa_firmada: 65,
  tramite_bancario: 80,
  escritura_publica: 92,
  entrega_llaves: 98,
  post_cierre: 100,
  closed_won: 100,
  closed_lost: 0,
}

const STAGE_STAGNATION_DAYS: Record<string, number> = {
  contacto_inicial: 7,
  visitas: 10,
  negociacion: 14,
  promesa_firmada: 21,
  tramite_bancario: 45,
  escritura_publica: 30,
  entrega_llaves: 15,
}

function computeProbability(
  stage: string,
  daysInStage: number,
  aiScore: number | null,
): number {
  const base = STAGE_BASE_PROBABILITY[stage] ?? 10
  if (base === 100 || base === 0) return base

  const scoreAdjust = aiScore != null ? (aiScore - 50) / 5 : 0
  const stagnation = STAGE_STAGNATION_DAYS[stage] ?? 14
  const decay =
    daysInStage > stagnation
      ? Math.min(40, (daysInStage - stagnation) * 1.5)
      : 0

  const adjusted = base + scoreAdjust - decay
  return Math.max(1, Math.min(99, Math.round(adjusted)))
}

function detectRisk(
  stage: string,
  daysInStage: number,
): { atRisk: boolean; reason: string | null } {
  if (stage === 'closed_won' || stage === 'closed_lost' || stage === 'post_cierre') {
    return { atRisk: false, reason: null }
  }
  const threshold = STAGE_STAGNATION_DAYS[stage] ?? 14
  if (daysInStage > threshold * 1.5) {
    return { atRisk: true, reason: `${daysInStage}d en etapa (umbral ${threshold}d)` }
  }
  if (daysInStage > threshold) {
    return { atRisk: true, reason: `Cerca del umbral (${daysInStage}d / ${threshold}d)` }
  }
  return { atRisk: false, reason: null }
}

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export async function getPipelineForecast(
  brokerageId: string,
): Promise<ForecastSummary> {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('deals')
    .select('id, lead_id, property_id, amount, stage, updated_at, created_at')
    .eq('brokerage_id', brokerageId)
    .not('stage', 'in', '(closed_won,closed_lost,post_cierre)')
    .returns<
      Array<{
        id: string
        lead_id: string
        property_id: string | null
        amount: number | null
        stage: string
        updated_at: string | null
        created_at: string | null
      }>
    >()

  if (!deals || deals.length === 0) {
    return {
      predictions: [],
      totalPipelineValue: 0,
      weightedForecast: 0,
      totalCommission: 0,
      atRiskCount: 0,
      atRiskValue: 0,
    }
  }

  const leadIds = [...new Set(deals.map((d) => d.lead_id))]
  const propertyIds = deals
    .map((d) => d.property_id)
    .filter((id): id is string => !!id)

  const [leadsRes, propertiesRes, nextTasksRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, full_name, ai_score')
      .in('id', leadIds)
      .returns<
        Array<{ id: string; full_name: string; ai_score: number | null }>
      >(),
    propertyIds.length > 0
      ? supabase
          .from('properties')
          .select('id, title')
          .in('id', propertyIds)
          .returns<Array<{ id: string; title: string }>>()
      : { data: [] },
    supabase
      .from('tasks')
      .select('lead_id, step_number, title, phase, due_at')
      .in('lead_id', leadIds)
      .in('status', ['open', 'escalated'])
      .order('step_number', { ascending: true })
      .returns<
        Array<{
          lead_id: string
          step_number: number
          title: string
          phase: string
          due_at: string | null
        }>
      >(),
  ])

  const leadById = new Map((leadsRes.data ?? []).map((l) => [l.id, l]))
  const propById = new Map((propertiesRes.data ?? []).map((p) => [p.id, p]))

  const nextTaskByLead = new Map<
    string,
    { title: string; phase: string }
  >()
  for (const t of nextTasksRes.data ?? []) {
    if (!nextTaskByLead.has(t.lead_id)) {
      nextTaskByLead.set(t.lead_id, { title: t.title, phase: t.phase })
    }
  }

  const predictions: DealPrediction[] = deals.map((d) => {
    const lead = leadById.get(d.lead_id)
    const prop = d.property_id ? propById.get(d.property_id) : null
    const refDate = d.updated_at ?? d.created_at ?? new Date().toISOString()
    const daysInStage = daysBetween(refDate)
    const probability = computeProbability(
      d.stage,
      daysInStage,
      lead?.ai_score ?? null,
    )
    const amount = Number(d.amount ?? 0)
    const risk = detectRisk(d.stage, daysInStage)
    const nextTask = nextTaskByLead.get(d.lead_id) ?? null

    return {
      dealId: d.id,
      leadId: d.lead_id,
      leadName: lead?.full_name ?? 'Lead',
      propertyTitle: prop?.title ?? null,
      amount,
      commission: Math.round(amount * COMMISSION_RATE),
      stage: d.stage,
      daysInStage,
      probability,
      weightedAmount: Math.round(amount * (probability / 100)),
      atRisk: risk.atRisk,
      riskReason: risk.reason,
      nextTaskTitle: nextTask?.title ?? null,
      nextTaskPhase: nextTask?.phase ?? null,
    }
  })

  predictions.sort((a, b) => b.commission - a.commission)

  const totalPipelineValue = predictions.reduce((s, p) => s + p.amount, 0)
  const weightedForecast = predictions.reduce(
    (s, p) => s + p.weightedAmount,
    0,
  )
  const totalCommission = predictions.reduce((s, p) => s + p.commission, 0)
  const atRiskItems = predictions.filter((p) => p.atRisk)

  return {
    predictions,
    totalPipelineValue,
    weightedForecast,
    totalCommission,
    atRiskCount: atRiskItems.length,
    atRiskValue: atRiskItems.reduce((s, p) => s + p.amount, 0),
  }
}

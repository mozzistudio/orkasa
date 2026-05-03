import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'

export type ScoreFactors = {
  origin: number
  responseSpeed: number
  interactionVolume: number
  engagement: number
  pipelineFit: number
}

export type ScoreResult = {
  score: number
  factors: ScoreFactors
  notes: string[]
}

const ORIGIN_WEIGHTS: Record<string, number> = {
  referido: 100,
  walk_in: 85,
  whatsapp: 75,
  portal: 65,
  web: 55,
  other: 40,
}

function originScore(origin: string | null): number {
  if (!origin) return 40
  return ORIGIN_WEIGHTS[origin] ?? 40
}

function responseSpeedScore(
  createdAt: string,
  firstInteractionAt: string | null,
): number {
  if (!firstInteractionAt) {
    const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
    if (hours < 1) return 90
    if (hours < 4) return 70
    if (hours < 24) return 50
    if (hours < 72) return 30
    return 10
  }
  const hours =
    (new Date(firstInteractionAt).getTime() - new Date(createdAt).getTime()) /
    3_600_000
  if (hours < 0.25) return 100
  if (hours < 1) return 90
  if (hours < 4) return 75
  if (hours < 24) return 55
  if (hours < 72) return 30
  return 15
}

function interactionVolumeScore(count: number): number {
  if (count === 0) return 0
  if (count >= 8) return 100
  return Math.min(100, Math.round((count / 8) * 100))
}

function engagementScore(input: {
  hasViewing: boolean
  viewingCompleted: boolean
  hasOffer: boolean
  hasDeal: boolean
  status: string | null
}): number {
  let score = 0
  if (input.status === 'closed_won') return 100
  if (input.status === 'closed_lost') return 5
  if (input.hasDeal) score += 60
  if (input.hasOffer) score += 25
  if (input.viewingCompleted) score += 20
  else if (input.hasViewing) score += 10
  if (input.status === 'negotiating') score += 15
  if (input.status === 'qualified') score += 10
  if (input.status === 'contacted') score += 5
  return Math.min(100, score)
}

function pipelineFitScore(input: {
  hasProperty: boolean
  hasPhone: boolean
  hasEmail: boolean
  hasPriceMatch: boolean
}): number {
  let score = 25
  if (input.hasProperty) score += 25
  if (input.hasPhone) score += 25
  if (input.hasEmail) score += 15
  if (input.hasPriceMatch) score += 10
  return Math.min(100, score)
}

const FACTOR_WEIGHTS: Record<keyof ScoreFactors, number> = {
  origin: 0.15,
  responseSpeed: 0.2,
  interactionVolume: 0.2,
  engagement: 0.35,
  pipelineFit: 0.1,
}

export function combineScore(factors: ScoreFactors): number {
  const total =
    factors.origin * FACTOR_WEIGHTS.origin +
    factors.responseSpeed * FACTOR_WEIGHTS.responseSpeed +
    factors.interactionVolume * FACTOR_WEIGHTS.interactionVolume +
    factors.engagement * FACTOR_WEIGHTS.engagement +
    factors.pipelineFit * FACTOR_WEIGHTS.pipelineFit
  return Math.max(0, Math.min(100, Math.round(total)))
}

type LeadForScoring = {
  id: string
  origin: string | null
  status: string | null
  phone: string | null
  email: string | null
  property_id: string | null
  created_at: string
}

type ScoringContext = {
  firstInteractionAt: string | null
  interactionCount: number
  hasViewing: boolean
  viewingCompleted: boolean
  hasOffer: boolean
  hasDeal: boolean
  hasPriceMatch: boolean
}

export function computeScore(
  lead: LeadForScoring,
  ctx: ScoringContext,
): ScoreResult {
  const factors: ScoreFactors = {
    origin: originScore(lead.origin),
    responseSpeed: responseSpeedScore(lead.created_at, ctx.firstInteractionAt),
    interactionVolume: interactionVolumeScore(ctx.interactionCount),
    engagement: engagementScore({
      hasViewing: ctx.hasViewing,
      viewingCompleted: ctx.viewingCompleted,
      hasOffer: ctx.hasOffer,
      hasDeal: ctx.hasDeal,
      status: lead.status,
    }),
    pipelineFit: pipelineFitScore({
      hasProperty: !!lead.property_id,
      hasPhone: !!lead.phone,
      hasEmail: !!lead.email,
      hasPriceMatch: ctx.hasPriceMatch,
    }),
  }

  const notes: string[] = []
  if (factors.origin >= 80) notes.push('Origen fuerte')
  if (factors.responseSpeed < 30) notes.push('Respuesta lenta')
  if (factors.interactionVolume === 0) notes.push('Sin interacciones')
  if (factors.engagement >= 60) notes.push('Alto compromiso')
  if (factors.pipelineFit < 50) notes.push('Falta info de contacto')

  return {
    score: combineScore(factors),
    factors,
    notes,
  }
}

export async function scoreLead(
  client: SupabaseClient<Database>,
  leadId: string,
): Promise<ScoreResult | null> {
  const { data: lead } = await client
    .from('leads')
    .select(
      'id, origin, status, phone, email, property_id, created_at',
    )
    .eq('id', leadId)
    .maybeSingle<LeadForScoring>()

  if (!lead) return null

  const [
    interactionsRes,
    firstInteractionRes,
    viewingsRes,
    offersRes,
    dealsRes,
  ] = await Promise.all([
    client
      .from('lead_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('lead_id', leadId),
    client
      .from('lead_interactions')
      .select('created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<{ created_at: string }>(),
    client
      .from('viewings')
      .select('status')
      .eq('lead_id', leadId)
      .returns<Array<{ status: string }>>(),
    client
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('lead_id', leadId),
    client
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('lead_id', leadId),
  ])

  const ctx: ScoringContext = {
    firstInteractionAt: firstInteractionRes.data?.created_at ?? null,
    interactionCount: interactionsRes.count ?? 0,
    hasViewing: (viewingsRes.data ?? []).length > 0,
    viewingCompleted: (viewingsRes.data ?? []).some(
      (v) => v.status === 'completed',
    ),
    hasOffer: (offersRes.count ?? 0) > 0,
    hasDeal: (dealsRes.count ?? 0) > 0,
    hasPriceMatch: false,
  }

  const result = computeScore(lead, ctx)

  await client
    .from('leads')
    .update({
      ai_score: result.score,
      ai_score_factors: {
        ...result.factors,
        notes: result.notes,
      } as unknown as Json,
      ai_score_updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  return result
}

export async function scoreAllActiveLeads(
  client: SupabaseClient<Database>,
): Promise<{ scored: number }> {
  const { data: leads } = await client
    .from('leads')
    .select('id')
    .in('status', [
      'new',
      'contacted',
      'qualified',
      'viewing_scheduled',
      'negotiating',
    ])
    .returns<Array<{ id: string }>>()

  if (!leads || leads.length === 0) return { scored: 0 }

  let scored = 0
  for (const lead of leads) {
    const r = await scoreLead(client, lead.id)
    if (r) scored++
  }
  return { scored }
}

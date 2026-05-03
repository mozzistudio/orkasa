'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { processTaskEvent } from '@/lib/tasks/trigger-engine'
import { checkAutoComplete } from '@/lib/tasks/auto-complete'
import { notifyDealStageChange } from '@/lib/notifications'
import type { Database } from '@/lib/database.types'

type DealStage = Database['public']['Enums']['deal_stage']

const VALID_STAGES = [
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
] as const satisfies readonly DealStage[]

export async function updateDealStage(
  dealId: string,
  newStage: string,
): Promise<{ error?: string }> {
  if (!(VALID_STAGES as readonly string[]).includes(newStage)) {
    return { error: 'Invalid stage' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: deal } = await supabase
    .from('deals')
    .select('id, lead_id, property_id, brokerage_id, stage')
    .eq('id', dealId)
    .maybeSingle<{
      id: string
      lead_id: string
      property_id: string | null
      brokerage_id: string
      stage: string
    }>()

  if (!deal) return { error: 'Deal not found' }

  const closedStages = ['closed_won', 'closed_lost', 'post_cierre']
  const closedAt = closedStages.includes(newStage) ? new Date().toISOString() : null

  const { error } = await supabase
    .from('deals')
    .update({
      stage: newStage as DealStage,
      closed_at: closedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)

  if (error) return { error: error.message }

  const payload = {
    event: 'deal_stage_changed' as const,
    leadId: deal.lead_id,
    brokerageId: deal.brokerage_id,
    agentId: user.id,
    propertyId: deal.property_id ?? undefined,
    dealId: deal.id,
    oldStatus: deal.stage,
    newStatus: newStage,
    dealStage: newStage,
  }
  checkAutoComplete(payload).catch(() => {})
  processTaskEvent(payload).catch(() => {})

  notifyDealStageChange({
    dealId: deal.id,
    leadId: deal.lead_id,
    oldStage: deal.stage,
    newStage,
  }).catch(() => {})

  revalidatePath('/app/deals')
  revalidatePath('/app/operaciones')
  revalidatePath(`/app/operaciones/${dealId}`)
  revalidatePath('/app/offers')
  revalidatePath('/app/tasks')
  revalidatePath('/app')
  return {}
}

// ─── Lead-engagement model: deal = client journey, properties live inside ──

const createDealSchema = z.object({
  lead_id: z.string().uuid(),
  property_id: z.string().uuid().nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  amount: z.coerce.number().positive().nullable().optional(),
  currency: z.string().min(3).max(3).default('USD'),
  stage: z.enum([
    'contacto_inicial',
    'visitas',
    'negociacion',
    'promesa_firmada',
    'tramite_bancario',
    'escritura_publica',
    'entrega_llaves',
  ]).default('contacto_inicial'),
  redirect_to_detail: z.coerce.boolean().optional(),
})

function readForm(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const cleaned: Record<string, FormDataEntryValue | null> = {}
  for (const [k, v] of Object.entries(raw)) {
    cleaned[k] = typeof v === 'string' && v.trim() === '' ? null : v
  }
  return cleaned
}

/**
 * Create a manual Operación from the UI. Always lead-keyed; property is
 * optional but if provided gets a `lead_properties` row attached to the
 * new deal so it shows up in the considered list.
 */
export async function createDeal(
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = createDealSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('brokerage_id, full_name, assigned_agent_id')
    .eq('id', parsed.data.lead_id)
    .maybeSingle<{
      brokerage_id: string
      full_name: string
      assigned_agent_id: string | null
    }>()

  if (!lead) return { error: 'Lead no encontrado' }

  const title =
    parsed.data.title?.trim() ||
    `Operación ${lead.full_name}`

  const { data: created, error } = await supabase
    .from('deals')
    .insert({
      lead_id: parsed.data.lead_id,
      brokerage_id: lead.brokerage_id,
      agent_id: lead.assigned_agent_id ?? user.id,
      property_id: parsed.data.property_id ?? null,
      title,
      amount: parsed.data.amount ?? null,
      currency: parsed.data.currency,
      stage: parsed.data.stage as DealStage,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }

  // If a property was specified, ensure it appears in the deal's lead_properties
  if (parsed.data.property_id) {
    const { data: existing } = await supabase
      .from('lead_properties')
      .select('id')
      .eq('lead_id', parsed.data.lead_id)
      .eq('property_id', parsed.data.property_id)
      .maybeSingle<{ id: string }>()

    if (existing) {
      await supabase
        .from('lead_properties')
        .update({ deal_id: created.id })
        .eq('id', existing.id)
    } else {
      await supabase.from('lead_properties').insert({
        lead_id: parsed.data.lead_id,
        property_id: parsed.data.property_id,
        brokerage_id: lead.brokerage_id,
        role: 'interesada',
        status: 'pendiente',
        deal_id: created.id,
      })
    }
  }

  processTaskEvent({
    event: 'deal_created',
    leadId: parsed.data.lead_id,
    brokerageId: lead.brokerage_id,
    agentId: user.id,
    propertyId: parsed.data.property_id ?? undefined,
    dealId: created.id,
  }).catch(() => {})

  revalidatePath('/app/operaciones')
  revalidatePath('/app/deals')
  revalidatePath(`/app/leads/${parsed.data.lead_id}`)
  if (parsed.data.property_id) {
    revalidatePath(`/app/properties/${parsed.data.property_id}`)
  }
  revalidatePath('/app')

  if (parsed.data.redirect_to_detail) {
    redirect(`/app/operaciones/${created.id}`)
  }
  return { id: created.id }
}

/**
 * Add a property under consideration to an existing deal (Operación).
 * Idempotent — if the (lead, property) row already exists, just attaches
 * it to the deal.
 */
export async function addPropertyToDeal(
  dealId: string,
  propertyId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: deal } = await supabase
    .from('deals')
    .select('lead_id, brokerage_id')
    .eq('id', dealId)
    .maybeSingle<{ lead_id: string; brokerage_id: string }>()

  if (!deal) return { error: 'Operación no encontrada' }

  const { data: existing } = await supabase
    .from('lead_properties')
    .select('id, deal_id')
    .eq('lead_id', deal.lead_id)
    .eq('property_id', propertyId)
    .maybeSingle<{ id: string; deal_id: string | null }>()

  if (existing) {
    if (existing.deal_id !== dealId) {
      await supabase
        .from('lead_properties')
        .update({ deal_id: dealId })
        .eq('id', existing.id)
    }
  } else {
    await supabase.from('lead_properties').insert({
      lead_id: deal.lead_id,
      property_id: propertyId,
      brokerage_id: deal.brokerage_id,
      role: 'interesada',
      status: 'pendiente',
      deal_id: dealId,
    })
  }

  revalidatePath(`/app/operaciones/${dealId}`)
  revalidatePath(`/app/properties/${propertyId}`)
  return {}
}

/**
 * Mark a property within a deal as descartada (rejected by the buyer in
 * favor of another option). Captures a lost reason for honest reporting.
 */
export async function markPropertyDescartada(
  leadPropertyId: string,
  reason: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: row, error } = await supabase
    .from('lead_properties')
    .update({
      status: 'descartada',
      lost_reason: reason,
    })
    .eq('id', leadPropertyId)
    .select('deal_id, property_id')
    .single<{ deal_id: string | null; property_id: string }>()

  if (error) return { error: error.message }

  if (row.deal_id) {
    revalidatePath(`/app/operaciones/${row.deal_id}`)
  }
  revalidatePath(`/app/properties/${row.property_id}`)
  return {}
}

/**
 * Mark a deal as won, recording which property the buyer ultimately
 * purchased. The other lead_properties under this deal are left alone
 * for the agent to mark descartada with reasons (or auto-mark below).
 */
export async function markDealWon(
  dealId: string,
  winningPropertyId: string,
  amount: number | null,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('deals')
    .update({
      stage: 'closed_won',
      winning_property_id: winningPropertyId,
      amount,
      closed_at: new Date().toISOString(),
    })
    .eq('id', dealId)

  if (error) return { error: error.message }

  // Mark the winning property's lead_property as oferta_hecha (acquired)
  await supabase
    .from('lead_properties')
    .update({ status: 'oferta_hecha' })
    .eq('deal_id', dealId)
    .eq('property_id', winningPropertyId)

  // Auto-mark the other properties as descartada with a positive reason
  await supabase
    .from('lead_properties')
    .update({
      status: 'descartada',
      lost_reason: 'cliente eligió otra propiedad de nuestra cartera',
    })
    .eq('deal_id', dealId)
    .neq('property_id', winningPropertyId)
    .neq('status', 'descartada')

  processTaskEvent({
    event: 'deal_stage_changed',
    leadId: '', // filled by trigger engine via deal lookup if needed
    brokerageId: '',
    agentId: user.id,
    dealId,
    dealStage: 'closed_won',
  }).catch(() => {})

  revalidatePath(`/app/operaciones/${dealId}`)
  revalidatePath('/app/operaciones')
  revalidatePath('/app')
  return {}
}

export type OperacionPickerData = {
  leads: Array<{
    id: string
    full_name: string
    phone: string | null
    email: string | null
    property_id: string | null
  }>
  properties: Array<{ id: string; title: string }>
}

/**
 * Lazy-loaded picker data for the "Crear operación" modal so the button
 * can live anywhere (topbar, dashboard) without forcing every parent
 * page to fetch leads + properties up-front.
 */
export async function getOperacionPickerData(): Promise<OperacionPickerData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { leads: [], properties: [] }

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) return { leads: [], properties: [] }

  const [leadsRes, propsRes] = await Promise.all([
    supabase
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
      >(),
    supabase
      .from('properties')
      .select('id, title')
      .eq('brokerage_id', agent.brokerage_id)
      .returns<Array<{ id: string; title: string }>>(),
  ])

  return {
    leads: leadsRes.data ?? [],
    properties: propsRes.data ?? [],
  }
}

export async function markDealLost(
  dealId: string,
  reason: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('deals')
    .update({
      stage: 'closed_lost',
      lost_reason: reason,
      closed_at: new Date().toISOString(),
    })
    .eq('id', dealId)

  if (error) return { error: error.message }

  revalidatePath(`/app/operaciones/${dealId}`)
  revalidatePath('/app/operaciones')
  return {}
}

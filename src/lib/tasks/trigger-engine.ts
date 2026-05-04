import { createClient } from '@/lib/supabase/server'
import { TASK_CATALOG } from './task-catalog'
import { matchSimilarProperties } from '@/lib/properties/match'
import type {
  TaskEventPayload,
  TaskContext,
  TriggerContext,
  TaskAuditAction,
  TaskRow,
} from './types'
import type { Database, Json } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type DbClient = SupabaseClient<Database>

/**
 * Cron and other server-side jobs run without a user session, so they pass an
 * explicit service-role client. Anything triggered from a server action or
 * route handler can rely on the cookie-bound default.
 */
async function getClient(client?: DbClient): Promise<DbClient> {
  return client ?? ((await createClient()) as unknown as DbClient)
}

export async function logTaskAudit(
  taskId: string,
  brokerageId: string,
  agentId: string | null,
  action: TaskAuditAction,
  details: Json = {},
  client?: DbClient,
): Promise<void> {
  try {
    const supabase = await getClient(client)
    await supabase.from('task_audit_log').insert({
      task_id: taskId,
      brokerage_id: brokerageId,
      agent_id: agentId,
      action,
      details,
    })
  } catch {
    // best-effort — never block the caller
  }
}

async function buildTriggerContext(
  payload: TaskEventPayload,
  client?: DbClient,
): Promise<TriggerContext | null> {
  const supabase = await getClient(client)

  const [leadRes, openTasksRes, doneTasksRes] = await Promise.all([
    supabase
      .from('leads')
      .select('full_name, phone, status, property_id, metadata')
      .eq('id', payload.leadId)
      .maybeSingle<{
        full_name: string
        phone: string | null
        status: string | null
        property_id: string | null
        metadata: Record<string, unknown> | null
      }>(),
    supabase
      .from('tasks')
      .select('step_number')
      .eq('lead_id', payload.leadId)
      .eq('status', 'open')
      .returns<Array<{ step_number: number }>>(),
    supabase
      .from('tasks')
      .select('step_number, completed_at')
      .eq('lead_id', payload.leadId)
      .eq('status', 'done')
      .order('completed_at', { ascending: false })
      .returns<Array<{ step_number: number; completed_at: string | null }>>(),
  ])

  if (!leadRes.data) return null

  let property: TriggerContext['property'] = null
  const propId = payload.propertyId ?? leadRes.data.property_id
  if (propId) {
    const { data } = await supabase
      .from('properties')
      .select('title, price, property_type, owner_name, owner_phone')
      .eq('id', propId)
      .maybeSingle<{
        title: string
        price: number | null
        property_type: string
        owner_name: string | null
        owner_phone: string | null
      }>()
    property = data
  }

  let offer: TriggerContext['offer'] = null
  if (payload.offerId) {
    const { data } = await supabase
      .from('offers')
      .select('id, amount, currency, public_token')
      .eq('id', payload.offerId)
      .maybeSingle<{
        id: string
        amount: number
        currency: string
        public_token: string | null
      }>()
    offer = data
      ? { ...data, amount: Number(data.amount) }
      : null
  }

  let deal: TriggerContext['deal'] = null
  if (payload.dealId) {
    const { data } = await supabase
      .from('deals')
      .select('id, stage, amount, closed_at, metadata')
      .eq('id', payload.dealId)
      .maybeSingle<{
        id: string
        stage: string
        amount: number | null
        closed_at: string | null
        metadata: Record<string, unknown> | null
      }>()
    deal = data
  }

  const { data: providerRows } = await supabase
    .from('providers')
    .select('name, phone, service_type')
    .eq('brokerage_id', payload.brokerageId)
    .in('service_type', ['notario', 'abogado', 'tasador', 'banco'])
    .order('is_primary', { ascending: false })
    .order('updated_at', { ascending: false })
    .returns<Array<{ name: string; phone: string | null; service_type: string }>>()

  const providerByType = new Map<
    string,
    { name: string; phone: string | null }
  >()
  for (const p of providerRows ?? []) {
    if (!providerByType.has(p.service_type)) {
      providerByType.set(p.service_type, { name: p.name, phone: p.phone })
    }
  }
  const notaryRow = providerByType.get('notario') ?? null
  const lawyerRow = providerByType.get('abogado') ?? null
  const appraiserRow = providerByType.get('tasador') ?? null
  const bankerRow = providerByType.get('banco') ?? null

  const daysSinceClosed = deal?.closed_at
    ? Math.floor((Date.now() - new Date(deal.closed_at).getTime()) / 86_400_000)
    : null

  const lastDoneStepDates: Record<number, string> = {}
  for (const t of doneTasksRes.data ?? []) {
    if (!t.completed_at) continue
    if (!lastDoneStepDates[t.step_number]) {
      lastDoneStepDates[t.step_number] = t.completed_at
    }
  }

  return {
    ...payload,
    lead: leadRes.data,
    property,
    deal,
    offer,
    notary: notaryRow,
    lawyer: lawyerRow,
    appraiser: appraiserRow,
    banker: bankerRow,
    existingOpenSteps: (openTasksRes.data ?? []).map((t) => t.step_number),
    daysSinceClosed,
    lastDoneStepDates,
  }
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://orkasa.vercel.app'
}

function buildTaskContext(ctx: TriggerContext): TaskContext {
  const nameParts = ctx.lead.full_name.split(' ')
  const offerAmount = ctx.offer?.amount ?? ctx.deal?.amount ?? undefined
  const base: TaskContext = {
    firstName: nameParts[0],
    leadName: ctx.lead.full_name,
    propertyTitle: ctx.property?.title,
    amount: offerAmount,
    formattedAmount: offerAmount
      ? `$${Number(offerAmount).toLocaleString('es-PA')}`
      : undefined,
    ownerName: ctx.property?.owner_name ?? undefined,
    ownerPhone: ctx.property?.owner_phone ?? undefined,
    offerLink: ctx.offer?.public_token
      ? `${getAppUrl()}/offer/${ctx.offer.public_token}/pdf`
      : undefined,
    notaryName: ctx.notary?.name ?? undefined,
    notaryPhone: ctx.notary?.phone ?? undefined,
    lawyerName: ctx.lawyer?.name ?? undefined,
    lawyerPhone: ctx.lawyer?.phone ?? undefined,
    appraiserName: ctx.appraiser?.name ?? undefined,
    appraiserPhone: ctx.appraiser?.phone ?? undefined,
    bankerName: ctx.banker?.name ?? undefined,
    bankerPhone: ctx.banker?.phone ?? undefined,
  }

  const meta = ctx.lead.metadata
  if (meta?.employment_type === 'autonomo') {
    ;(base as TaskContext & { isAutonomo?: boolean }).isAutonomo = true
  }
  if (ctx.deal?.metadata?.financing_type === 'cash') {
    ;(base as TaskContext & { isCash?: boolean }).isCash = true
  }
  if (ctx.property?.property_type) {
    ;(base as TaskContext & { propertyType?: string }).propertyType =
      ctx.property.property_type
  }

  return base
}

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export async function processTaskEvent(
  payload: TaskEventPayload,
  client?: DbClient,
): Promise<void> {
  const ctx = await buildTriggerContext(payload, client)
  if (!ctx) return

  const supabase = await getClient(client)
  const taskCtx = buildTaskContext(ctx)

  for (const entry of TASK_CATALOG) {
    if (!entry.triggerEvents.includes(payload.event)) continue

    if (entry.triggerCondition && !entry.triggerCondition(ctx)) continue

    if (ctx.existingOpenSteps.includes(entry.stepNumber)) continue

    const title = entry.titleTemplate(taskCtx)
    const ctaMetadata = entry.ctaMetadataBuilder?.(taskCtx) ?? {}
    if (entry.whatsappTemplate) {
      ctaMetadata.template = entry.whatsappTemplate
    }
    // The builder may have set a non-lead phone (e.g. property owner). Don't
    // overwrite it; otherwise fall back to the lead's phone.
    if (ctaMetadata.phone == null && ctx.lead.phone) {
      ctaMetadata.phone = ctx.lead.phone
    }

    // Step 3 (sendPropertyOptions) needs similar properties pre-computed
    // from the lead's property of interest. We do it here so the catalog
    // entry stays declarative.
    if (
      entry.stepNumber === 3 &&
      ctx.property &&
      payload.propertyId
    ) {
      try {
        const matches = await matchSimilarProperties(
          supabase,
          payload.propertyId,
          payload.brokerageId,
          3,
        )
        if (matches.length > 0) {
          ctaMetadata.propertyTitles = matches.map((m) => m.title)
          ctaMetadata.suggestedPropertyIds = matches.map((m) => m.id)
        }
      } catch {
        // best-effort
      }
    }

    const row: TaskInsert = {
      lead_id: payload.leadId,
      brokerage_id: payload.brokerageId,
      agent_id: payload.agentId,
      deal_id: payload.dealId ?? null,
      step_number: entry.stepNumber,
      phase: entry.phase,
      title,
      description: entry.description,
      cta_action: entry.ctaAction,
      cta_metadata: ctaMetadata as Json,
      due_at: addDays(entry.dueDaysOffset),
      escalation_at: addDays(entry.escalationDaysOffset),
      auto_complete_on: entry.autoCompleteOn ?? null,
      status: 'open',
      trigger_reason: {
        event: payload.event,
        interactionType: payload.interactionType ?? null,
        documentCode: payload.documentCode ?? null,
        newStatus: payload.newStatus ?? null,
        dealStage: payload.dealStage ?? null,
        completedStep: payload.completedStep ?? null,
      },
      property_id: payload.propertyId ?? null,
      offer_id: payload.offerId ?? null,
      viewing_id: payload.viewingId ?? null,
    }

    try {
      const { data } = await supabase
        .from('tasks')
        .insert(row)
        .select('id')
        .maybeSingle<{ id: string }>()

      if (data) {
        ctx.existingOpenSteps.push(entry.stepNumber)
        await logTaskAudit(
          data.id,
          payload.brokerageId,
          payload.agentId,
          'created',
          { stepNumber: entry.stepNumber, event: payload.event },
          client,
        )
        const { notifyTaskCreated } = await import('@/lib/notifications')
        notifyTaskCreated({
          taskId: data.id,
          leadId: payload.leadId,
          brokerageId: payload.brokerageId,
          agentId: payload.agentId,
          title,
        }).catch(() => {})
      }
    } catch {
      // unique constraint violation = duplicate, skip silently
    }
  }
}

export async function getOpenTasksForLead(
  leadId: string,
): Promise<TaskRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('lead_id', leadId)
    .in('status', ['open', 'escalated'])
    .order('step_number', { ascending: true })
    .returns<TaskRow[]>()
  return data ?? []
}

export async function getAllTasksForLead(
  leadId: string,
): Promise<TaskRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('lead_id', leadId)
    .order('step_number', { ascending: true })
    .returns<TaskRow[]>()
  return data ?? []
}

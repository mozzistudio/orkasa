import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'

type NotificationInsert =
  Database['public']['Tables']['notifications']['Insert']

export type NotificationType =
  | 'task_created'
  | 'task_escalated'
  | 'task_due_soon'
  | 'lead_new'
  | 'lead_assigned'
  | 'lead_status_changed'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_countered'
  | 'viewing_scheduled'
  | 'viewing_reminder'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'doc_uploaded'

export type EntityType =
  | 'task'
  | 'lead'
  | 'offer'
  | 'viewing'
  | 'deal'
  | 'property'

type CreateNotificationInput = {
  brokerageId: string
  agentId: string | null
  type: NotificationType
  title: string
  body?: string | null
  entityType?: EntityType
  entityId?: string | null
  metadata?: Record<string, unknown>
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    const supabase = await createClient()
    const row: NotificationInsert = {
      brokerage_id: input.brokerageId,
      agent_id: input.agentId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    }
    await supabase.from('notifications').insert(row)
  } catch {
    // best-effort — never block the caller
  }
}

async function resolveLeadOwner(leadId: string): Promise<{
  brokerageId: string
  agentId: string | null
  leadName: string
} | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('brokerage_id, assigned_agent_id, full_name')
    .eq('id', leadId)
    .maybeSingle<{
      brokerage_id: string
      assigned_agent_id: string | null
      full_name: string
    }>()
  if (!data) return null
  return {
    brokerageId: data.brokerage_id,
    agentId: data.assigned_agent_id,
    leadName: data.full_name,
  }
}

export async function notifyLeadCreated(input: {
  leadId: string
  leadName: string
  brokerageId: string
  agentId: string | null
}): Promise<void> {
  await createNotification({
    brokerageId: input.brokerageId,
    agentId: input.agentId,
    type: 'lead_new',
    title: `Nuevo lead: ${input.leadName}`,
    body: 'Lead recién registrado en el sistema',
    entityType: 'lead',
    entityId: input.leadId,
  })
}

export async function notifyOfferReceived(input: {
  leadId: string
  offerId: string
  amount: number
  currency: string
}): Promise<void> {
  const owner = await resolveLeadOwner(input.leadId)
  if (!owner) return
  const formattedAmount = `${input.currency} ${Number(input.amount).toLocaleString('es-PA')}`
  await createNotification({
    brokerageId: owner.brokerageId,
    agentId: owner.agentId,
    type: 'offer_received',
    title: `Oferta enviada · ${owner.leadName}`,
    body: `${formattedAmount}`,
    entityType: 'offer',
    entityId: input.offerId,
    metadata: { leadId: input.leadId },
  })
}

export async function notifyOfferStatusChange(input: {
  offerId: string
  leadId: string
  newStatus: string
  amount: number
  currency: string
}): Promise<void> {
  const owner = await resolveLeadOwner(input.leadId)
  if (!owner) return

  const typeMap: Record<string, NotificationType> = {
    accepted: 'offer_accepted',
    rejected: 'offer_rejected',
    countered: 'offer_countered',
  }
  const type = typeMap[input.newStatus]
  if (!type) return

  const formattedAmount = `${input.currency} ${Number(input.amount).toLocaleString('es-PA')}`
  const titleMap: Record<NotificationType, string> = {
    offer_accepted: `Oferta aceptada · ${owner.leadName}`,
    offer_rejected: `Oferta rechazada · ${owner.leadName}`,
    offer_countered: `Contraoferta · ${owner.leadName}`,
  } as Record<NotificationType, string>

  await createNotification({
    brokerageId: owner.brokerageId,
    agentId: owner.agentId,
    type,
    title: titleMap[type] ?? `Oferta actualizada · ${owner.leadName}`,
    body: formattedAmount,
    entityType: 'offer',
    entityId: input.offerId,
    metadata: { leadId: input.leadId },
  })
}

export async function notifyViewingScheduled(input: {
  leadId: string
  viewingId: string
  scheduledAt: string
  propertyTitle?: string
}): Promise<void> {
  const owner = await resolveLeadOwner(input.leadId)
  if (!owner) return
  const date = new Date(input.scheduledAt)
  const formatted = date.toLocaleString('es-PA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  await createNotification({
    brokerageId: owner.brokerageId,
    agentId: owner.agentId,
    type: 'viewing_scheduled',
    title: `Visita agendada · ${owner.leadName}`,
    body: `${formatted}${input.propertyTitle ? ` · ${input.propertyTitle}` : ''}`,
    entityType: 'viewing',
    entityId: input.viewingId,
    metadata: { leadId: input.leadId },
  })
}

export async function notifyDealStageChange(input: {
  dealId: string
  leadId: string
  oldStage: string
  newStage: string
}): Promise<void> {
  const owner = await resolveLeadOwner(input.leadId)
  if (!owner) return

  let type: NotificationType = 'deal_stage_changed'
  if (input.newStage === 'closed_won') type = 'deal_won'
  else if (input.newStage === 'closed_lost') type = 'deal_lost'

  const stageLabels: Record<string, string> = {
    contacto_inicial: 'Contacto inicial',
    visitas: 'Visitas',
    negociacion: 'Negociación',
    promesa_firmada: 'Promesa firmada',
    tramite_bancario: 'Trámite bancario',
    escritura_publica: 'Escritura pública',
    entrega_llaves: 'Entrega de llaves',
    post_cierre: 'Post cierre',
    closed_won: 'Ganado',
    closed_lost: 'Perdido',
  }

  const titleMap: Partial<Record<NotificationType, string>> = {
    deal_won: `Deal ganado · ${owner.leadName}`,
    deal_lost: `Deal perdido · ${owner.leadName}`,
    deal_stage_changed: `Etapa avanzada · ${owner.leadName}`,
  }

  await createNotification({
    brokerageId: owner.brokerageId,
    agentId: owner.agentId,
    type,
    title: titleMap[type] ?? `Deal actualizado · ${owner.leadName}`,
    body: `${stageLabels[input.oldStage] ?? input.oldStage} → ${stageLabels[input.newStage] ?? input.newStage}`,
    entityType: 'deal',
    entityId: input.dealId,
    metadata: { leadId: input.leadId },
  })
}

export async function notifyTaskCreated(input: {
  taskId: string
  leadId: string
  brokerageId: string
  agentId: string | null
  title: string
}): Promise<void> {
  await createNotification({
    brokerageId: input.brokerageId,
    agentId: input.agentId,
    type: 'task_created',
    title: input.title,
    body: 'Nueva tarea asignada',
    entityType: 'task',
    entityId: input.taskId,
    metadata: { leadId: input.leadId },
  })
}

export async function notifyTaskEscalated(input: {
  taskId: string
  leadId: string
  brokerageId: string
  agentId: string | null
  title: string
}): Promise<void> {
  await createNotification({
    brokerageId: input.brokerageId,
    agentId: input.agentId,
    type: 'task_escalated',
    title: `Tarea escalada · ${input.title}`,
    body: 'Una tarea sobrepasó el plazo de escalación',
    entityType: 'task',
    entityId: input.taskId,
    metadata: { leadId: input.leadId },
  })
}

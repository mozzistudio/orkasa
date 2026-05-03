import { createClient } from '@/lib/supabase/server'
import { logTaskAudit, processTaskEvent } from './trigger-engine'
import type { TaskEventPayload, TaskRow } from './types'

function eventMatchesAutoComplete(
  autoCompleteOn: string,
  payload: TaskEventPayload,
): boolean {
  const parts = autoCompleteOn.split(':')
  const category = parts[0]
  const subtype = parts[1]

  switch (category) {
    case 'interaction':
      return (
        payload.event === 'interaction_logged' &&
        payload.interactionType === subtype
      )

    case 'doc':
      return (
        (payload.event === 'document_uploaded' ||
          payload.event === 'document_verified') &&
        payload.documentCode === subtype
      )

    case 'viewing_scheduled':
      return payload.event === 'viewing_scheduled'

    case 'viewing_completed':
      if (payload.event !== 'viewing_completed') return false
      if (!subtype) return true
      return (payload.metadata?.viewingType as string | undefined) === subtype

    case 'offer_created':
      return payload.event === 'offer_created'

    case 'deal_stage':
      return (
        payload.event === 'deal_stage_changed' &&
        payload.dealStage === subtype
      )

    case 'compliance':
      return (
        payload.event === 'compliance_approved' &&
        (!subtype || payload.documentCode === subtype)
      )

    default:
      return autoCompleteOn === payload.event
  }
}

/**
 * For multi-doc tasks, the simple `kind`-based auto-complete matcher fires too
 * eagerly — verifying ONE document marks the whole task done even when other
 * required codes are still pending. Tasks can opt into stricter matching by
 * placing `requiredDocCodesAll` (every code must be verified) or
 * `requiredDocCodesAny` (at least one must be verified) into `cta_metadata`.
 *
 * Codes refer to the `compliance_documents.code` column (e.g.
 * `identity_id_panamanian`), not the legacy `kind` enum.
 */
async function multiDocConditionsMet(
  metadata: Record<string, unknown>,
  leadId: string,
): Promise<boolean> {
  const all = Array.isArray(metadata.requiredDocCodesAll)
    ? (metadata.requiredDocCodesAll as string[])
    : null
  const any = Array.isArray(metadata.requiredDocCodesAny)
    ? (metadata.requiredDocCodesAny as string[])
    : null

  if (!all?.length && !any?.length) return true

  const supabase = await createClient()
  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('id')
    .eq('lead_id', leadId)
    .returns<Array<{ id: string }>>()

  const checkIds = (checks ?? []).map((c) => c.id)
  if (!checkIds.length) return false

  const codes = [...(all ?? []), ...(any ?? [])]
  const { data: docs } = await supabase
    .from('compliance_documents')
    .select('code, status')
    .in('check_id', checkIds)
    .in('code', codes)
    .returns<Array<{ code: string; status: string }>>()

  const verified = new Set(
    (docs ?? [])
      .filter((d) => d.status === 'verified')
      .map((d) => d.code),
  )

  if (all?.length && !all.every((c) => verified.has(c))) return false
  if (any?.length && !any.some((c) => verified.has(c))) return false

  return true
}

export async function checkAutoComplete(
  payload: TaskEventPayload,
): Promise<void> {
  const supabase = await createClient()

  const { data: openTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('lead_id', payload.leadId)
    .eq('status', 'open')
    .not('auto_complete_on', 'is', null)
    .returns<TaskRow[]>()

  if (!openTasks?.length) return

  for (const task of openTasks) {
    if (!task.auto_complete_on) continue
    if (!eventMatchesAutoComplete(task.auto_complete_on, payload)) continue

    const conditionsMet = await multiDocConditionsMet(
      task.cta_metadata ?? {},
      payload.leadId,
    )
    if (!conditionsMet) continue

    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: payload.agentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id)
      .eq('status', 'open')

    if (error) continue

    await logTaskAudit(
      task.id,
      payload.brokerageId,
      payload.agentId,
      'auto_completed',
      {
        event: payload.event,
        interactionType: payload.interactionType,
        documentCode: payload.documentCode,
      },
    )

    await processTaskEvent({
      ...payload,
      event: 'task_completed',
      completedStep: task.step_number,
    }).catch(() => {})
  }
}

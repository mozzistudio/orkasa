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
      return payload.event === 'viewing_completed'

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

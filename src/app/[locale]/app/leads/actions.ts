'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { processTaskEvent } from '@/lib/tasks/trigger-engine'
import { checkAutoComplete } from '@/lib/tasks/auto-complete'

const LeadOrigins = [
  'portal',
  'web',
  'referido',
  'whatsapp',
  'walk_in',
  'other',
] as const
const LeadStatuses = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'negotiating',
  'closed_won',
  'closed_lost',
] as const

const leadSchema = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  origin: z.enum(LeadOrigins),
  status: z.enum(LeadStatuses).default('new'),
  property_id: z.string().uuid().nullable().optional(),
  assigned_agent_id: z.string().uuid().nullable().optional(),
  ai_score: z.coerce.number().int().min(0).max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

type LeadInsert = Database['public']['Tables']['leads']['Insert']
type LeadUpdate = Database['public']['Tables']['leads']['Update']

function readForm(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const cleaned: Record<string, FormDataEntryValue | null> = {}
  for (const [k, v] of Object.entries(raw)) {
    cleaned[k] = typeof v === 'string' && v.trim() === '' ? null : v
  }
  return cleaned
}

export async function createLead(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) {
    return { error: 'No brokerage' }
  }

  const parsed = leadSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const insert: LeadInsert = {
    ...parsed.data,
    brokerage_id: agent.brokerage_id,
  }

  const { data: created, error } = await supabase
    .from('leads')
    .insert(insert)
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }

  processTaskEvent({
    event: 'lead_created',
    leadId: created.id,
    brokerageId: agent.brokerage_id,
    agentId: user.id,
    propertyId: insert.property_id ?? undefined,
  }).catch(() => {})

  revalidatePath('/app/leads')
  revalidatePath('/app')
  redirect(`/app/leads/${created.id}`)
}

export async function updateLead(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const parsed = leadSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const update: LeadUpdate = parsed.data
  const { error } = await supabase.from('leads').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/app/leads')
  revalidatePath(`/app/leads/${id}`)
  revalidatePath('/app')
  redirect(`/app/leads/${id}`)
}

// Used by the kanban — just changes the status field and revalidates
export async function updateLeadStatus(
  id: string,
  status: (typeof LeadStatuses)[number],
): Promise<{ error?: string }> {
  if (!(LeadStatuses as readonly string[]).includes(status)) {
    return { error: 'Invalid status' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: lead } = await supabase
    .from('leads')
    .select('status, brokerage_id')
    .eq('id', id)
    .maybeSingle<{ status: string | null; brokerage_id: string }>()

  const oldStatus = lead?.status ?? undefined

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }

  if (user && lead?.brokerage_id) {
    const payload = {
      event: 'lead_status_changed' as const,
      leadId: id,
      brokerageId: lead.brokerage_id,
      agentId: user.id,
      oldStatus,
      newStatus: status,
    }
    checkAutoComplete(payload).catch(() => {})
    processTaskEvent(payload).catch(() => {})
  }

  revalidatePath('/app/leads')
  return {}
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('leads').delete().eq('id', id)
  revalidatePath('/app/leads')
  revalidatePath('/app')
  redirect('/app/leads')
}

export async function addLeadInteraction(
  leadId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const type = (formData.get('type') as string) || 'note'
  const content = (formData.get('content') as string)?.trim()
  if (!content) return { error: 'Empty interaction' }

  const { error } = await supabase.from('lead_interactions').insert({
    lead_id: leadId,
    agent_id: user.id,
    type,
    content,
  })
  if (error) return { error: error.message }

  const { data: leadRow } = await supabase
    .from('leads')
    .select('brokerage_id')
    .eq('id', leadId)
    .maybeSingle<{ brokerage_id: string }>()

  if (leadRow?.brokerage_id) {
    const payload = {
      event: 'interaction_logged' as const,
      leadId,
      brokerageId: leadRow.brokerage_id,
      agentId: user.id,
      interactionType: type,
    }
    checkAutoComplete(payload).catch(() => {})
    processTaskEvent(payload).catch(() => {})
  }

  revalidatePath(`/app/leads/${leadId}`)
  return {}
}

export async function completeTask(
  taskId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: task } = await supabase
    .from('tasks')
    .select('id, lead_id, brokerage_id, step_number')
    .eq('id', taskId)
    .eq('status', 'open')
    .maybeSingle<{
      id: string
      lead_id: string
      brokerage_id: string
      step_number: number
    }>()

  if (!task) return { error: 'Task not found or already done' }

  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('status', 'open')

  if (error) return { error: error.message }

  const { logTaskAudit } = await import('@/lib/tasks/trigger-engine')
  await logTaskAudit(taskId, task.brokerage_id, user.id, 'completed', {
    stepNumber: task.step_number,
  })

  processTaskEvent({
    event: 'task_completed',
    leadId: task.lead_id,
    brokerageId: task.brokerage_id,
    agentId: user.id,
    completedStep: task.step_number,
  }).catch(() => {})

  revalidatePath(`/app/leads/${task.lead_id}`)
  return {}
}

export async function skipTask(
  taskId: string,
  reason?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: task } = await supabase
    .from('tasks')
    .select('id, lead_id, brokerage_id, step_number')
    .eq('id', taskId)
    .eq('status', 'open')
    .maybeSingle<{
      id: string
      lead_id: string
      brokerage_id: string
      step_number: number
    }>()

  if (!task) return { error: 'Task not found or already done' }

  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'skipped',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('status', 'open')

  if (error) return { error: error.message }

  const { logTaskAudit } = await import('@/lib/tasks/trigger-engine')
  await logTaskAudit(taskId, task.brokerage_id, user.id, 'skipped', {
    stepNumber: task.step_number,
    reason: reason ?? null,
  })

  revalidatePath(`/app/leads/${task.lead_id}`)
  return {}
}

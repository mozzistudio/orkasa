'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { processTaskEvent } from '@/lib/tasks/trigger-engine'
import { checkAutoComplete } from '@/lib/tasks/auto-complete'
import { notifyViewingScheduled } from '@/lib/notifications'

const viewingSchema = z.object({
  lead_id: z.string().uuid(),
  property_id: z.string().uuid().optional(),
  scheduled_at: z.string().min(1),
  duration_minutes: z.coerce.number().int().min(15).max(180).default(30),
  notes: z.string().max(2000).nullable().optional(),
})

export async function createViewing(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = Object.fromEntries(formData)
  const cleaned: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    cleaned[k] = typeof v === 'string' && v.trim() === '' ? null : v
  }

  const parsed = viewingSchema.safeParse(cleaned)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('brokerage_id, property_id')
    .eq('id', parsed.data.lead_id)
    .maybeSingle<{ brokerage_id: string; property_id: string | null }>()

  if (!lead) return { error: 'Lead not found' }

  const propertyId = parsed.data.property_id ?? lead.property_id
  if (!propertyId) return { error: 'No property associated' }

  const { data: viewing, error } = await supabase
    .from('viewings')
    .insert({
      lead_id: parsed.data.lead_id,
      property_id: propertyId as string,
      agent_id: user.id,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      duration_minutes: parsed.data.duration_minutes,
      notes: parsed.data.notes ?? null,
      status: 'scheduled',
    })
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }

  const payload = {
    event: 'viewing_scheduled' as const,
    leadId: parsed.data.lead_id,
    brokerageId: lead.brokerage_id,
    agentId: user.id,
    propertyId: propertyId ?? undefined,
    viewingId: viewing.id,
  }
  checkAutoComplete(payload).catch(() => {})
  processTaskEvent(payload).catch(() => {})

  let propertyTitle: string | undefined
  if (propertyId) {
    const { data: prop } = await supabase
      .from('properties')
      .select('title')
      .eq('id', propertyId)
      .maybeSingle<{ title: string }>()
    propertyTitle = prop?.title
  }

  notifyViewingScheduled({
    leadId: parsed.data.lead_id,
    viewingId: viewing.id,
    scheduledAt: parsed.data.scheduled_at,
    propertyTitle,
  }).catch(() => {})

  revalidatePath('/app/calendar')
  revalidatePath(`/app/leads/${parsed.data.lead_id}`)
  revalidatePath('/app/tasks')
  revalidatePath('/app')
  return {}
}

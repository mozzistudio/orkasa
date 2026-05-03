'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { processTaskEvent } from '@/lib/tasks/trigger-engine'
import { checkAutoComplete } from '@/lib/tasks/auto-complete'
import {
  notifyOfferReceived,
  notifyOfferStatusChange,
} from '@/lib/notifications'
import type { Database } from '@/lib/database.types'

type OfferStatus = Database['public']['Enums']['offer_status']

const offerSchema = z.object({
  lead_id: z.string().uuid(),
  property_id: z.string().uuid().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().default('USD'),
  conditions: z.string().max(2000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export async function createOffer(
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

  const parsed = offerSchema.safeParse(cleaned)
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

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      lead_id: parsed.data.lead_id,
      property_id: propertyId,
      brokerage_id: lead.brokerage_id,
      agent_id: user.id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      status: 'draft',
      conditions: parsed.data.conditions ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }

  const payload = {
    event: 'offer_created' as const,
    leadId: parsed.data.lead_id,
    brokerageId: lead.brokerage_id,
    agentId: user.id,
    propertyId,
    offerId: offer.id,
  }
  checkAutoComplete(payload).catch(() => {})
  processTaskEvent(payload).catch(() => {})

  notifyOfferReceived({
    leadId: parsed.data.lead_id,
    offerId: offer.id,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
  }).catch(() => {})

  revalidatePath('/app/offers')
  revalidatePath(`/app/leads/${parsed.data.lead_id}`)
  revalidatePath('/app/tasks')
  revalidatePath('/app')
  return {}
}

export async function updateOfferStatus(
  offerId: string,
  newStatus: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: offer } = await supabase
    .from('offers')
    .select('id, lead_id, property_id, brokerage_id, amount')
    .eq('id', offerId)
    .maybeSingle<{
      id: string
      lead_id: string
      property_id: string
      brokerage_id: string
      amount: number
    }>()

  if (!offer) return { error: 'Offer not found' }

  const { error } = await supabase
    .from('offers')
    .update({
      status: newStatus as OfferStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)

  if (error) return { error: error.message }

  notifyOfferStatusChange({
    offerId: offer.id,
    leadId: offer.lead_id,
    newStatus,
    amount: offer.amount,
    currency: 'USD',
  }).catch(() => {})

  if (newStatus === 'accepted') {
    const { data: deal } = await supabase
      .from('deals')
      .insert({
        lead_id: offer.lead_id,
        property_id: offer.property_id,
        brokerage_id: offer.brokerage_id,
        agent_id: user.id,
        amount: offer.amount,
        currency: 'USD',
        stage: 'negociacion',
      })
      .select('id')
      .single<{ id: string }>()

    if (deal) {
      await supabase
        .from('offers')
        .update({ deal_id: deal.id })
        .eq('id', offerId)

      processTaskEvent({
        event: 'deal_created',
        leadId: offer.lead_id,
        brokerageId: offer.brokerage_id,
        agentId: user.id,
        propertyId: offer.property_id,
        dealId: deal.id,
        offerId: offer.id,
      }).catch(() => {})
    }
  }

  revalidatePath('/app/offers')
  revalidatePath('/app/deals')
  revalidatePath('/app')
  return {}
}

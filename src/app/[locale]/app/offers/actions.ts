'use server'

import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
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

  const publicToken = randomBytes(24).toString('base64url')

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      lead_id: parsed.data.lead_id,
      property_id: propertyId,
      brokerage_id: lead.brokerage_id,
      agent_id: user.id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      status: 'submitted',
      conditions: parsed.data.conditions ?? null,
      notes: parsed.data.notes ?? null,
      public_token: publicToken,
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
  revalidatePath(`/app/properties/${propertyId}`)
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
    // Lead-engagement model: find existing OPEN deal for this lead first;
    // create one only if none exists. The deal then aggregates all the
    // properties this lead is considering, with the accepted offer's
    // property as a candidate (will become winning_property_id at close).
    const { data: openDeal } = await supabase
      .from('deals')
      .select('id, property_id')
      .eq('lead_id', offer.lead_id)
      .eq('brokerage_id', offer.brokerage_id)
      .not('stage', 'in', '(closed_won,closed_lost)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; property_id: string | null }>()

    let deal: { id: string } | null = openDeal
      ? { id: openDeal.id }
      : null

    if (!deal) {
      const { data: created } = await supabase
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
      deal = created
    } else {
      // Existing deal — bump stage to negociacion if earlier, ensure the
      // offered property is in lead_properties under this deal.
      await supabase
        .from('deals')
        .update({
          stage: 'negociacion',
          amount: offer.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', openDeal!.id)
        .in('stage', ['contacto_inicial', 'visitas'])

      const { data: lp } = await supabase
        .from('lead_properties')
        .select('id, deal_id')
        .eq('lead_id', offer.lead_id)
        .eq('property_id', offer.property_id)
        .maybeSingle<{ id: string; deal_id: string | null }>()

      if (lp && lp.deal_id !== openDeal!.id) {
        await supabase
          .from('lead_properties')
          .update({ deal_id: openDeal!.id })
          .eq('id', lp.id)
      } else if (!lp) {
        await supabase.from('lead_properties').insert({
          lead_id: offer.lead_id,
          property_id: offer.property_id,
          brokerage_id: offer.brokerage_id,
          role: 'interesada',
          status: 'pendiente',
          deal_id: openDeal!.id,
        })
      }
    }

    if (deal) {
      await supabase
        .from('offers')
        .update({ deal_id: deal.id })
        .eq('id', offerId)
    }

    const acceptedPayload = {
      event: 'offer_accepted' as const,
      leadId: offer.lead_id,
      brokerageId: offer.brokerage_id,
      agentId: user.id,
      propertyId: offer.property_id,
      dealId: deal?.id,
      offerId: offer.id,
    }
    checkAutoComplete(acceptedPayload).catch(() => {})
    processTaskEvent(acceptedPayload).catch(() => {})
  } else if (newStatus === 'rejected') {
    const rejectedPayload = {
      event: 'offer_rejected' as const,
      leadId: offer.lead_id,
      brokerageId: offer.brokerage_id,
      agentId: user.id,
      propertyId: offer.property_id,
      offerId: offer.id,
    }
    checkAutoComplete(rejectedPayload).catch(() => {})
    processTaskEvent(rejectedPayload).catch(() => {})
  }

  revalidatePath('/app/tasks')

  revalidatePath('/app/offers')
  revalidatePath('/app/deals')
  revalidatePath('/app')
  return {}
}

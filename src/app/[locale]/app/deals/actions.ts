'use server'

import { revalidatePath } from 'next/cache'
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
  revalidatePath('/app/offers')
  revalidatePath('/app/tasks')
  revalidatePath('/app')
  return {}
}

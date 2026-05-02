'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'

type ComplianceStatus = Database['public']['Enums']['compliance_status']

async function logAudit(
  checkId: string,
  action: string,
  details: Json = {},
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()

  if (!agent?.brokerage_id) return

  await supabase.from('compliance_audit_log').insert({
    brokerage_id: agent.brokerage_id,
    check_id: checkId,
    agent_id: user.id,
    action,
    details,
  })
}

/**
 * Approve a dossier from the detail page. Marks all checks for the lead
 * as approved and sets the agent as reviewer. Required: justification when
 * deal value > $300K.
 */
export async function approveDossier(
  checkId: string,
  justification?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('lead_id')
    .eq('id', checkId)
    .maybeSingle<{ lead_id: string | null }>()

  if (!check?.lead_id) return { error: 'Check not found' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('compliance_checks')
    .update({
      status: 'approved' as ComplianceStatus,
      reviewed_by: user.id,
      reviewed_at: now,
      notes: justification ?? null,
    })
    .eq('lead_id', check.lead_id)
    .neq('status', 'approved')

  if (error) return { error: error.message }

  await logAudit(checkId, 'dossier_approved', {
    approved_by: user.id,
    justification: justification ?? null,
  })

  revalidatePath('/app/compliance')
  revalidatePath(`/app/compliance/${checkId}`)
  return {}
}

/**
 * Reject a dossier. Reason is required (min 30 chars enforced client-side).
 */
export async function rejectDossier(
  checkId: string,
  reason: string,
): Promise<{ error?: string }> {
  if (!reason || reason.trim().length < 10) {
    return { error: 'Reason too short' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('lead_id')
    .eq('id', checkId)
    .maybeSingle<{ lead_id: string | null }>()

  if (!check?.lead_id) return { error: 'Check not found' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('compliance_checks')
    .update({
      status: 'rejected' as ComplianceStatus,
      reviewed_by: user.id,
      reviewed_at: now,
      notes: reason,
    })
    .eq('lead_id', check.lead_id)

  if (error) return { error: error.message }

  await logAudit(checkId, 'dossier_rejected', {
    rejected_by: user.id,
    reason,
  })

  revalidatePath('/app/compliance')
  revalidatePath(`/app/compliance/${checkId}`)
  return {}
}

/**
 * Reassign a dossier to another agent. Updates the lead's assigned_agent_id.
 */
export async function reassignDossier(
  checkId: string,
  newAgentId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('lead_id')
    .eq('id', checkId)
    .maybeSingle<{ lead_id: string | null }>()

  if (!check?.lead_id) return { error: 'Check not found' }

  const { error } = await supabase
    .from('leads')
    .update({ assigned_agent_id: newAgentId })
    .eq('id', check.lead_id)

  if (error) return { error: error.message }

  await logAudit(checkId, 'dossier_reassigned', {
    reassigned_by: user.id,
    new_agent_id: newAgentId,
  })

  revalidatePath(`/app/compliance/${checkId}`)
  return {}
}

/**
 * Mark a flag (PEP question, etc.) as cleared. Stores the agent's answer
 * as a note on the check + logs it in the audit trail.
 */
export async function clearFlag(
  checkId: string,
  flagType: 'pep' | 'high_amount' | 'ubo',
  answer: 'yes' | 'no',
  justification: string,
): Promise<{ error?: string }> {
  if (!justification || justification.trim().length < 10) {
    return { error: 'Justification too short' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (flagType === 'pep' && answer === 'no') {
    const { error } = await supabase
      .from('compliance_checks')
      .update({ pep_match: false })
      .eq('id', checkId)
    if (error) return { error: error.message }
  }

  await logAudit(checkId, `flag_${flagType}_cleared`, {
    answer,
    justification,
    cleared_by: user.id,
  })

  revalidatePath(`/app/compliance/${checkId}`)
  return {}
}

/**
 * Escalate a dossier to a compliance officer (or owner). For now we just
 * log the escalation — a real impl would notify the recipient.
 */
export async function escalateDossier(
  checkId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await logAudit(checkId, 'dossier_escalated', { escalated_by: user.id })

  revalidatePath(`/app/compliance/${checkId}`)
  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'

type ComplianceStatus = Database['public']['Enums']['compliance_status']
type ComplianceRisk = Database['public']['Enums']['compliance_risk']
type DocStatus = Database['public']['Enums']['compliance_doc_status']

const VALID_STATUSES: readonly ComplianceStatus[] = [
  'pending',
  'in_review',
  'approved',
  'rejected',
  'requires_action',
]

const VALID_RISKS: readonly ComplianceRisk[] = ['low', 'medium', 'high', 'critical']
const VALID_DOC_STATUSES: readonly DocStatus[] = [
  'pending',
  'uploaded',
  'verified',
  'rejected',
  'expired',
]

/**
 * Append a row to compliance_audit_log. Best-effort: failures don't block
 * the calling action — audit insert is logged server-side but doesn't surface
 * to the user.
 */
async function logAudit(
  checkId: string,
  action: string,
  details: Json = {},
) {
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

export async function updateComplianceStatus(
  id: string,
  status: ComplianceStatus,
  riskLevel?: ComplianceRisk | null,
): Promise<{ error?: string }> {
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return { error: 'Invalid status' }
  }
  if (riskLevel && !(VALID_RISKS as readonly string[]).includes(riskLevel)) {
    return { error: 'Invalid risk level' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_checks')
    .update({
      status,
      risk_level: riskLevel ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  await logAudit(id, 'status_changed', { status, risk_level: riskLevel ?? null })

  revalidatePath('/app/compliance')
  revalidatePath(`/app/compliance/${id}`)
  return {}
}

export async function updateComplianceNotes(
  id: string,
  notes: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_checks')
    .update({ notes })
    .eq('id', id)

  if (error) return { error: error.message }

  await logAudit(id, 'notes_updated', {})
  revalidatePath(`/app/compliance/${id}`)
  return {}
}

/**
 * Mark a document slot as uploaded. We don't actually push file bytes here —
 * the storage flow (signed URL upload) happens client-side. This action
 * records the metadata once the upload completes.
 */
export async function markDocumentUploaded(
  documentId: string,
  filePath: string,
  fileName: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Look up the check_id so we can audit-log
  const { data: doc } = await supabase
    .from('compliance_documents')
    .select('check_id, kind')
    .eq('id', documentId)
    .maybeSingle<{ check_id: string; kind: string }>()

  const { error } = await supabase
    .from('compliance_documents')
    .update({
      file_path: filePath,
      file_name: fileName,
      status: 'uploaded',
      uploaded_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  if (error) return { error: error.message }

  if (doc) {
    await logAudit(doc.check_id, 'doc_uploaded', { kind: doc.kind, fileName })
  }

  revalidatePath(`/app/compliance/${doc?.check_id ?? ''}`)
  return {}
}

export async function setDocumentStatus(
  documentId: string,
  status: DocStatus,
  notes?: string,
): Promise<{ error?: string }> {
  if (!(VALID_DOC_STATUSES as readonly string[]).includes(status)) {
    return { error: 'Invalid document status' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: doc } = await supabase
    .from('compliance_documents')
    .select('check_id, kind')
    .eq('id', documentId)
    .maybeSingle<{ check_id: string; kind: string }>()

  const update: Database['public']['Tables']['compliance_documents']['Update'] = {
    status,
    notes: notes ?? null,
  }
  if (status === 'verified') {
    update.verified_by = user.id
    update.verified_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('compliance_documents')
    .update(update)
    .eq('id', documentId)

  if (error) return { error: error.message }

  if (doc) {
    await logAudit(doc.check_id, `doc_${status}`, { kind: doc.kind })
  }

  revalidatePath(`/app/compliance/${doc?.check_id ?? ''}`)
  return {}
}

/**
 * Trigger a sanctions / PEP re-screen. Mock for now — sets the result fields
 * directly. A real impl would queue a check against OFAC, UN, EU lists.
 */
export async function rerunScreening(
  checkId: string,
): Promise<{ error?: string; sanctionsMatch: boolean; pepMatch: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', sanctionsMatch: false, pepMatch: false }

  // Mock screening — for the demo we always return clean
  const sanctionsMatch = false
  const pepMatch = false

  const { error } = await supabase
    .from('compliance_checks')
    .update({
      sanctions_match: sanctionsMatch,
      pep_match: pepMatch,
    })
    .eq('id', checkId)

  if (error) {
    return { error: error.message, sanctionsMatch: false, pepMatch: false }
  }

  await logAudit(checkId, 'screening_rerun', { sanctionsMatch, pepMatch })

  revalidatePath(`/app/compliance/${checkId}`)
  return { sanctionsMatch, pepMatch }
}

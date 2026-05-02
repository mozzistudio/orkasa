'use server'

import { revalidatePath } from 'next/cache'
import { getGeminiClient, GEMINI_IMAGE_MODEL } from '@/lib/gemini'
import { buildDocPrompt } from '@/lib/compliance-doc-prompts'
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

// =============================================================================
// generateDemoDocument — fabricate a realistic-looking demo file via Gemini
// =============================================================================
//
// For seeded demo docs (path starting with `compliance-demo/...`) there's no
// real file. This action calls Gemini 2.5 Flash Image with a prompt tailored
// to the doc code (cédula, paz y salvo, payslip, etc.) injecting the lead's
// real name + property data, uploads the result to the private bucket, and
// updates the doc row to point at it.
//
// Every prompt mandates a "MUESTRA · DEMO · ORKASA" watermark to prevent any
// possibility of misuse.

export async function generateDemoDocument(
  documentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getGeminiClient()
  if (!client) {
    return {
      ok: false,
      error: 'GEMINI_API_KEY no configurada en el servidor.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // Fetch doc + check + lead + property in one shot
  const { data: doc } = await supabase
    .from('compliance_documents')
    .select('id, code, name, check_id, brokerage_id')
    .eq('id', documentId)
    .maybeSingle<{
      id: string
      code: string | null
      name: string | null
      check_id: string
      brokerage_id: string
    }>()

  if (!doc) return { ok: false, error: 'Documento no encontrado' }
  if (!doc.code) {
    return {
      ok: false,
      error: 'Este documento no tiene código asociado para generación demo.',
    }
  }

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('id, lead_id')
    .eq('id', doc.check_id)
    .maybeSingle<{ id: string; lead_id: string | null }>()

  let leadName = 'Cliente Demo'
  let leadEmail: string | null = null
  let propertyTitle: string | null = null
  let propertyAddress: string | null = null
  let propertyCity: string | null = null
  let propertyNeighborhood: string | null = null
  let propertyPrice: number | null = null

  if (check?.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('full_name, email, property_id')
      .eq('id', check.lead_id)
      .maybeSingle<{
        full_name: string
        email: string | null
        property_id: string | null
      }>()
    if (lead) {
      leadName = lead.full_name
      leadEmail = lead.email
      if (lead.property_id) {
        const { data: prop } = await supabase
          .from('properties')
          .select('title, address, city, neighborhood, price')
          .eq('id', lead.property_id)
          .maybeSingle<{
            title: string
            address: string | null
            city: string | null
            neighborhood: string | null
            price: number | null
          }>()
        if (prop) {
          propertyTitle = prop.title
          propertyAddress = prop.address
          propertyCity = prop.city
          propertyNeighborhood = prop.neighborhood
          propertyPrice = prop.price ? Number(prop.price) : null
        }
      }
    }
  }

  const prompt = buildDocPrompt(doc.code, {
    leadName,
    leadEmail,
    propertyTitle,
    propertyAddress,
    propertyCity,
    propertyNeighborhood,
    propertyPrice,
  })

  try {
    const response = await client.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const imagePart = response.candidates
      ?.flatMap((c) => c.content?.parts ?? [])
      .find((p) => p.inlineData?.data)

    if (!imagePart?.inlineData?.data) {
      return {
        ok: false,
        error: 'Gemini no devolvió una imagen. Reintentá en unos segundos.',
      }
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
    const mime = imagePart.inlineData.mimeType ?? 'image/png'
    const ext = mime.split('/')[1]?.split('+')[0] ?? 'png'
    const fileName = `${doc.code}-demo-${Date.now()}.${ext}`
    const path = `${doc.brokerage_id}/${doc.check_id}/${fileName}`

    const { error: uploadErr } = await supabase.storage
      .from('compliance-documents')
      .upload(path, buffer, { contentType: mime, upsert: false })

    if (uploadErr) {
      return { ok: false, error: `Upload error: ${uploadErr.message}` }
    }

    // Update doc row — keep status='uploaded' (still needs human review)
    const { error: updateErr } = await supabase
      .from('compliance_documents')
      .update({
        file_path: path,
        file_name: fileName,
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (updateErr) return { ok: false, error: updateErr.message }

    await logAudit(doc.check_id, 'doc_uploaded', {
      kind: doc.code,
      fileName,
      generatedBy: 'gemini-2.5-flash-image',
    })

    revalidatePath(`/app/compliance/${doc.check_id}`)
    revalidatePath(`/app/compliance/${doc.check_id}/documents/${documentId}`)
    return { ok: true }
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message }
    return { ok: false, error: 'Error desconocido al generar.' }
  }
}

// =============================================================================
// Document downloads — return a short-lived signed URL
// =============================================================================

export async function getDocumentSignedUrl(
  documentId: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: doc } = await supabase
    .from('compliance_documents')
    .select('file_path, file_name')
    .eq('id', documentId)
    .maybeSingle<{ file_path: string | null; file_name: string | null }>()

  if (!doc?.file_path) return { error: 'Sin archivo subido' }

  // Demo files use a `compliance-demo/...` synthetic path that doesn't exist
  // in storage. Pretend-sign: return a placeholder URL so the UI can show
  // the "open file" link without 404'ing.
  if (doc.file_path.startsWith('compliance-demo/')) {
    return { url: `#demo-${doc.file_name ?? 'file'}` }
  }

  // 5-minute TTL is enough for the user to click through.
  const { data, error } = await supabase.storage
    .from('compliance-documents')
    .createSignedUrl(doc.file_path, 300, {
      download: doc.file_name ?? undefined,
    })

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}

// =============================================================================
// Alerts — resolve / acknowledge / mark false positive / escalate
// =============================================================================

type AlertStatus = Database['public']['Enums']['compliance_alert_status']

const VALID_ALERT_STATUSES: readonly AlertStatus[] = [
  'open',
  'acknowledged',
  'resolved',
  'false_positive',
  'escalated',
]

export async function setAlertStatus(
  alertId: string,
  status: AlertStatus,
  resolutionNote?: string,
): Promise<{ error?: string }> {
  if (!(VALID_ALERT_STATUSES as readonly string[]).includes(status)) {
    return { error: 'Invalid alert status' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const update: Database['public']['Tables']['compliance_alerts']['Update'] = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (
    status === 'resolved' ||
    status === 'false_positive' ||
    status === 'escalated'
  ) {
    update.resolved_by = user.id
    update.resolved_at = new Date().toISOString()
    update.resolution_note = resolutionNote ?? null
  }

  const { error } = await supabase
    .from('compliance_alerts')
    .update(update)
    .eq('id', alertId)

  if (error) return { error: error.message }
  revalidatePath('/app/compliance')
  return {}
}

// =============================================================================
// Broker-view actions
// =============================================================================

export async function approveDeal(
  leadId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: checks, error: fetchErr } = await supabase
    .from('compliance_checks')
    .select('id')
    .eq('lead_id', leadId)
    .neq('status', 'approved')

  if (fetchErr) return { error: fetchErr.message }
  if (!checks?.length) return {}

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('compliance_checks')
    .update({
      status: 'approved' as ComplianceStatus,
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq('lead_id', leadId)
    .neq('status', 'approved')

  if (error) return { error: error.message }

  for (const c of checks) {
    await logAudit(c.id, 'deal_approved', { approved_by: user.id })
  }

  revalidatePath('/app/compliance')
  return {}
}

export async function logWhatsAppReminder(
  leadId: string,
  documentType: string,
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('lead_interactions').insert({
    lead_id: leadId,
    type: 'whatsapp_reminder',
    content: `Reminder sent for: ${documentType}`,
    agent_id: user.id,
  })

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('id')
    .eq('lead_id', leadId)
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (check) {
    await logAudit(check.id, 'whatsapp_reminder_sent', { documentType })
  }

  revalidatePath('/app/compliance')
}

export async function postponeReminder(
  leadId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('id')
    .eq('lead_id', leadId)
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (check) {
    await logAudit(check.id, 'reminder_postponed', { postponed_by: user.id })
  }

  revalidatePath('/app/compliance')
  return {}
}

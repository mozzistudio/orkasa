'use server'

import { createClient } from '@/lib/supabase/server'
import { checklistFor, type Scenario } from '@/lib/compliance-docs'
import type { Database } from '@/lib/database.types'

type Check = Database['public']['Tables']['compliance_checks']['Row']
type DocStatus = Database['public']['Enums']['compliance_doc_status']
type DocKind = Database['public']['Enums']['compliance_doc_kind']

/**
 * Map a DocSpec category onto the (legacy) compliance_doc_kind enum.
 * The new schema relies on `code/name/category` text columns; `kind` is
 * kept for backwards compat and best-effort mapped here so old code that
 * filters by kind keeps working.
 */
function legacyKind(category: string): DocKind {
  switch (category) {
    case 'identity':
      return 'identity'
    case 'capacity':
      return 'income_proof'
    case 'sof':
      return 'funds_origin'
    case 'sow':
      return 'income_proof'
    case 'sanctions_pep':
      return 'pep_declaration'
    case 'corporate':
      return 'company_existence'
    default:
      return 'other'
  }
}

/**
 * Demo file metadata for a few well-known doc codes — enough variety to
 * make the UI feel populated. Codes not in this map stay as 'pending'.
 */
const DEMO_FILES: Record<
  string,
  { fileName: string; status: DocStatus; daysAgo: number }
> = {
  identity_id_panamanian: {
    fileName: 'cedula-frente-dorso.pdf',
    status: 'verified',
    daysAgo: 5,
  },
  identity_address_proof: {
    fileName: 'factura-naturgy-marzo.pdf',
    status: 'verified',
    daysAgo: 5,
  },
  identity_tax_id: {
    fileName: 'ruc-panama.pdf',
    status: 'verified',
    daysAgo: 4,
  },
  capacity_payslips: {
    fileName: 'fichas-pago-q1-2026.pdf',
    status: 'uploaded',
    daysAgo: 2,
  },
  capacity_employer_letter: {
    fileName: 'carta-empleador.pdf',
    status: 'uploaded',
    daysAgo: 2,
  },
  sof_bank_statements: {
    fileName: 'estados-bcp-feb-mar-abr.pdf',
    status: 'uploaded',
    daysAgo: 1,
  },
  sof_credit_preapproval: {
    fileName: 'pre-aprobacion-banistmo.pdf',
    status: 'verified',
    daysAgo: 7,
  },
  pep_declaration: {
    fileName: 'declaracion-pep-firmada.pdf',
    status: 'verified',
    daysAgo: 6,
  },
  property_escritura: {
    fileName: 'escritura-publica-2018.pdf',
    status: 'verified',
    daysAgo: 10,
  },
  property_registro_publico: {
    fileName: 'cert-registro-publico.pdf',
    status: 'uploaded',
    daysAgo: 3,
  },
  property_paz_idaan: {
    fileName: 'paz-y-salvo-idaan.pdf',
    status: 'verified',
    daysAgo: 8,
  },
  property_paz_electric: {
    fileName: 'paz-y-salvo-ensa.pdf',
    status: 'verified',
    daysAgo: 8,
  },
  property_paz_imu: {
    fileName: 'paz-y-salvo-anati.pdf',
    status: 'rejected',
    daysAgo: 4,
  },
  reference_landlord: {
    fileName: 'ref-bailleur-anterior.pdf',
    status: 'verified',
    daysAgo: 9,
  },
  reference_bank: {
    fileName: 'carta-ref-bancaria.pdf',
    status: 'verified',
    daysAgo: 9,
  },
  guarantee_deposit_funds: {
    fileName: 'comprobante-deposito-2-meses.pdf',
    status: 'verified',
    daysAgo: 7,
  },
  broker_license: {
    fileName: 'licencia-jtbr-2026.pdf',
    status: 'verified',
    daysAgo: 30,
  },
  broker_aml_manual: {
    fileName: 'manual-prevencion-ld-ft-v3.pdf',
    status: 'verified',
    daysAgo: 60,
  },
  transaction_mandate_sale: {
    fileName: 'mandato-corretaje-firmado.pdf',
    status: 'uploaded',
    daysAgo: 1,
  },
}

type DocInsert = Database['public']['Tables']['compliance_documents']['Insert']

export async function seedDocsForCheck(
  checkId: string,
): Promise<{ inserted: number; error?: string }> {
  const supabase = await createClient()

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('id', checkId)
    .maybeSingle<Check>()

  if (!check) return { inserted: 0, error: 'Check not found' }

  const scenario = (check.scenario ?? 'sale_buyer') as Scenario
  const checklist = checklistFor(scenario, {
    // For now: assume individual buyer with a $300K transaction so we get
    // SoW docs surfaced. Tune per-lead later.
    transactionValue: 300_000,
    isCorporate: false,
    edd: false,
  })

  // Wipe existing docs for this check (idempotent re-seed)
  await supabase.from('compliance_documents').delete().eq('check_id', checkId)

  const now = Date.now()
  const inserts: DocInsert[] = checklist.map((spec) => {
    const demo = DEMO_FILES[spec.code]
    const isUploaded = !!demo
    return {
      brokerage_id: check.brokerage_id,
      check_id: check.id,
      kind: legacyKind(spec.category),
      code: spec.code,
      name: spec.name,
      category: spec.category,
      description: spec.description ?? null,
      is_required: !spec.optional,
      is_corporate_only: spec.corporateOnly ?? false,
      status: demo?.status ?? 'pending',
      file_path: isUploaded
        ? `compliance-demo/${check.brokerage_id}/${check.id}/${demo.fileName}`
        : null,
      file_name: demo?.fileName ?? null,
      uploaded_at: demo
        ? new Date(now - demo.daysAgo * 86_400_000).toISOString()
        : null,
    }
  })

  const { error } = await supabase.from('compliance_documents').insert(inserts)
  if (error) return { inserted: 0, error: error.message }

  return { inserted: inserts.length }
}

export async function seedAllChecks(): Promise<{
  total: number
  errors: string[]
}> {
  const supabase = await createClient()
  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('id')
    .returns<Pick<Check, 'id'>[]>()

  const errors: string[] = []
  let total = 0
  for (const c of checks ?? []) {
    const result = await seedDocsForCheck(c.id)
    if (result.error) errors.push(`${c.id}: ${result.error}`)
    else total += result.inserted
  }
  return { total, errors }
}

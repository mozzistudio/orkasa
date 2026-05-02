/**
 * Single source of truth for translating compliance jargon (PEP, OFAC, KYC,
 * AML, UAF, UBO, SOF, SOW, DDR…) into broker-friendly Spanish copy.
 *
 * The detail page MUST go through this module — never hardcode jargon strings.
 */

export type ScreeningFlagKind =
  | 'pep_match'
  | 'sanctions_match'
  | 'high_amount_threshold'
  | 'ubo_required'
  | 'doc_expired'

export const screeningFlagToHumanQuestion: Record<
  ScreeningFlagKind,
  {
    title: (clientName: string) => string
    explainer: string
    icon: 'question' | 'block'
    askTemplate: 'askPep' | 'askPayslips' | 'askUbo' | 'noTemplate'
  }
> = {
  pep_match: {
    title: (clientName) =>
      `Confirmar si ${clientName} tiene parientes en cargos de gobierno`,
    explainer:
      'Pregunta obligatoria para compras superiores a $300K en Panamá. Si la respuesta es no, marcala como aclarada y listo. Si es sí, vamos a necesitarle un papel adicional.',
    icon: 'question',
    askTemplate: 'askPep',
  },
  sanctions_match: {
    title: (clientName) =>
      `${clientName} aparece en una lista internacional de sanciones`,
    explainer:
      'Esto bloquea el deal automáticamente. Tenés que escalar a tu compliance officer o rechazar el deal.',
    icon: 'block',
    askTemplate: 'noTemplate',
  },
  high_amount_threshold: {
    title: () =>
      'Reportar la operación a la unidad de inteligencia financiera',
    explainer:
      'Es estándar para compras superiores a $100K. El sistema completa el formulario, vos solo firmás.',
    icon: 'question',
    askTemplate: 'noTemplate',
  },
  ubo_required: {
    title: (clientName) =>
      `Falta saber quién es el dueño real de la empresa de ${clientName}`,
    explainer:
      'La compra está a nombre de una empresa offshore. Necesitamos un papel firmado que diga el nombre del dueño real.',
    icon: 'question',
    askTemplate: 'askUbo',
  },
  doc_expired: {
    title: (clientName) =>
      `La cédula de ${clientName} está vencida`,
    explainer:
      'No podemos avanzar con un documento vencido. Mandale un recordatorio para que envíe la nueva.',
    icon: 'question',
    askTemplate: 'noTemplate',
  },
}

/**
 * Map technical document codes (and legacy "kind" values) to human-readable
 * names that a broker can read out loud. Falls back to the document's own
 * "name" field when no code mapping exists.
 */
export const docCodeToHumanName: Record<string, string> = {
  // Identity
  identity_id_panamanian: 'Cédula panameña',
  identity_id_foreign: 'Carnet de extranjería',
  identity_passport: 'Pasaporte',
  identity: 'Cédula',

  // Address
  address_proof: 'Comprobante de domicilio',
  address_proof_utility: 'Recibo de servicio público',
  address_proof_bank: 'Estado de cuenta con dirección',

  // Income / financial
  income_proof: 'Comprobante de ingresos',
  payslips_3m: '3 últimas fichas de pago',
  payslip: 'Ficha de pago',
  bank_statements_3m: 'Estados bancarios (3 meses)',
  bank_statement: 'Estado bancario',
  tax_id: 'Número de contribuyente (RUC)',
  tax_return: 'Declaración de renta',

  // Funds origin
  funds_origin: 'Origen de fondos',
  sof_bank_statements: 'Estados bancarios — origen de fondos',
  sof_employment_letter: 'Carta de trabajo — origen de fondos',
  sof_property_sale: 'Comprobante de venta de propiedad anterior',
  sof_inheritance: 'Acta de herencia',
  sof_donation: 'Carta de donación',

  // Pre-approval
  pre_approval: 'Pre-aprobación bancaria',
  bank_pre_approval: 'Pre-aprobación bancaria',

  // Company
  company_existence: 'Certificado de existencia de empresa',
  company_ubo: 'Declaración de beneficiario final',
  company_articles: 'Pacto social',

  // PEP
  pep_declaration: 'Declaración firmada de relación con funcionario público',

  // Other
  other: 'Documento adicional',
}

/**
 * Map a document row (kind, code, name) to the best human label. The order
 * is: explicit `name` field → code lookup → kind lookup → fallback.
 */
export function getDocHumanName(doc: {
  kind?: string | null
  code?: string | null
  name?: string | null
}): string {
  if (doc.name) return doc.name
  if (doc.code && docCodeToHumanName[doc.code]) {
    return docCodeToHumanName[doc.code]
  }
  if (doc.kind && docCodeToHumanName[doc.kind]) {
    return docCodeToHumanName[doc.kind]
  }
  return doc.name ?? doc.code ?? 'Documento'
}

/**
 * Format a date relative to now in Spanish, broker-friendly. Examples:
 *   "hace 5 días", "ayer", "hoy a las 14:30", "mañana 06:07", "30 abr"
 */
export function formatRelativeEs(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / (1000 * 60))
  const diffHr = Math.round(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const time = d.toLocaleTimeString('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  if (Math.abs(diffMin) < 60) {
    if (diffMin === 0) return 'ahora mismo'
    if (diffMin > 0) return `en ${diffMin} min`
    return `hace ${Math.abs(diffMin)} min`
  }

  if (Math.abs(diffHr) < 24 && d.getDate() === now.getDate()) {
    return `hoy a las ${time}`
  }

  if (diffDay === -1) return `ayer`
  if (diffDay === 1) return `mañana ${time}`
  if (diffDay < 0 && diffDay >= -14) return `hace ${Math.abs(diffDay)} días`
  if (diffDay > 0 && diffDay <= 14) return `en ${diffDay} días`

  // Fall back to short date
  const monthsShort = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ]
  return `${d.getDate()} ${monthsShort[d.getMonth()]}`
}

/**
 * Render the long-form date for tooltips and accessibility (alongside the
 * relative label).
 */
export function formatLongEs(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Compute the dossier state from a check + its docs.
 *
 *   blocked    — sanctions match. Page should redirect or show big red banner.
 *   incomplete — missing required docs OR pending questions.
 *   flagged    — all complete but a non-blocking screening flag (PEP, etc).
 *   ready      — complete + clean. Show green banner + approve CTA.
 */
export type DossierState = 'incomplete' | 'flagged' | 'ready' | 'blocked'

export function computeDossierState(input: {
  sanctionsMatch: boolean
  pepMatch: boolean
  documents: Array<{ status: string; is_required: boolean | null }>
  pendingQuestions: number
}): DossierState {
  if (input.sanctionsMatch) return 'blocked'

  const requiredDocs = input.documents.filter((d) => d.is_required !== false)
  const missingRequired = requiredDocs.some((d) => d.status !== 'verified')

  if (missingRequired || input.pendingQuestions > 0) return 'incomplete'
  if (input.pepMatch) return 'flagged'
  return 'ready'
}

/**
 * Return a human label for the deal status pill (top of header).
 */
export function getDossierStatusPill(state: DossierState, missingCount: number): {
  label: string
  variant: 'warn' | 'danger' | 'success'
} {
  switch (state) {
    case 'blocked':
      return { label: 'Bloqueado', variant: 'danger' }
    case 'incomplete':
      return {
        label: missingCount > 0
          ? `Esperando ${missingCount} cosa${missingCount > 1 ? 's' : ''}`
          : 'En revisión',
        variant: 'warn',
      }
    case 'flagged':
      return { label: 'Revisión adicional', variant: 'warn' }
    case 'ready':
      return { label: 'Listo para firmar', variant: 'success' }
  }
}

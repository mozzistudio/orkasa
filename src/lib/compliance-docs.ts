/**
 * Compliance document taxonomy — Panama (Ley 23/2015 + Acuerdo 4-2025 UAF).
 *
 * Each scenario (sale buyer / seller / rental tenant / landlord / broker) has
 * its own checklist of required documents. The detail page reads from this
 * taxonomy to render the document checklist UI, and the seed/auto-population
 * action inserts one row per spec'd document into compliance_documents.
 *
 * `code` is a stable slug used for lookups and audit trails.
 * `category` groups docs visually in the UI.
 * `requiredAbove` lets us mark a doc as conditional on transaction value.
 * `corporateOnly` flags docs only required when the lead is a legal entity.
 * `edd` flags docs only required for Enhanced Due Diligence (high-risk).
 */

export type Scenario =
  | 'sale_buyer'
  | 'sale_seller'
  | 'rental_tenant'
  | 'rental_landlord'
  | 'broker_sale'
  | 'broker_rental'

export type DocCategory =
  | 'identity'
  | 'capacity'
  | 'sof' // source of funds
  | 'sow' // source of wealth
  | 'sanctions_pep'
  | 'corporate'
  | 'property_proof'
  | 'property_status'
  | 'property_origin'
  | 'broker_agency'
  | 'transaction'
  | 'audit_trail'
  | 'references'
  | 'guarantee'
  | 'lease'
  | 'tax'
  | 'other'

export type DocSpec = {
  code: string
  name: string
  category: DocCategory
  description?: string
  /** Conditional on transaction value (USD). e.g. 300000 → required when amount ≥ $300K. */
  requiredAbove?: number
  /** Only required when the lead is a legal entity (company). */
  corporateOnly?: boolean
  /** Only required for Enhanced Due Diligence (PEP, high-risk). */
  edd?: boolean
  /** Optional: not strictly required but recommended. */
  optional?: boolean
}

const CATEGORY_LABELS: Record<DocCategory, string> = {
  identity: 'Identidad (KYC base)',
  capacity: 'Capacidad financiera',
  sof: 'Origen de fondos (SoF)',
  sow: 'Origen del patrimonio (SoW)',
  sanctions_pep: 'Sanciones / PEP',
  corporate: 'Persona jurídica',
  property_proof: 'Propiedad del bien',
  property_status: 'Estado del bien',
  property_origin: 'Origen del bien',
  broker_agency: 'Agencia (broker)',
  transaction: 'Transacción',
  audit_trail: 'Audit trail',
  references: 'Referencias',
  guarantee: 'Garantía',
  lease: 'Contrato de alquiler',
  tax: 'Conformidad fiscal',
  other: 'Otros',
}

export function categoryLabel(c: DocCategory): string {
  return CATEGORY_LABELS[c] ?? c
}

const SCENARIO_LABELS: Record<Scenario, string> = {
  sale_buyer: 'Venta · Comprador',
  sale_seller: 'Venta · Vendedor',
  rental_tenant: 'Alquiler · Inquilino',
  rental_landlord: 'Alquiler · Propietario',
  broker_sale: 'Broker · Venta',
  broker_rental: 'Broker · Alquiler',
}

export function scenarioLabel(s: Scenario): string {
  return SCENARIO_LABELS[s] ?? s
}

// =============================================================================
// SHARED FRAGMENTS (used in multiple scenarios)
// =============================================================================

const IDENTITY_INDIVIDUAL: DocSpec[] = [
  {
    code: 'identity_id_panamanian',
    name: 'Cédula panameña',
    category: 'identity',
    description: 'Cédula vigente, frente y dorso, lectura clara.',
  },
  {
    code: 'identity_id_foreign',
    name: 'Pasaporte (extranjeros)',
    category: 'identity',
    description: 'Pasaporte vigente con páginas de identificación.',
    optional: true,
  },
  {
    code: 'identity_address_proof',
    name: 'Comprobante de domicilio',
    category: 'identity',
    description:
      'Factura de servicios (IDAAN, ENSA, Naturgy) o estado bancario, máx 3 meses.',
  },
  {
    code: 'identity_tax_id',
    name: 'Número de contribuyente',
    category: 'identity',
    description: 'RUC (PA) o NIT del país de origen para extranjeros.',
  },
]

const SANCTIONS_PEP: DocSpec[] = [
  {
    code: 'pep_declaration',
    name: 'Declaración PEP',
    category: 'sanctions_pep',
    description:
      'Declaración firmada sobre exposición política propia, familiares hasta 2° grado y allegados.',
  },
]

const CORPORATE: DocSpec[] = [
  {
    code: 'corporate_pacto_social',
    name: 'Pacto social / acta constitutiva',
    category: 'corporate',
    description: 'Documento de constitución de la sociedad.',
    corporateOnly: true,
  },
  {
    code: 'corporate_good_standing',
    name: 'Certificado de existencia (Registro Público)',
    category: 'corporate',
    description: 'Vigencia máxima 30 días.',
    corporateOnly: true,
  },
  {
    code: 'corporate_aviso_operacion',
    name: 'Aviso de Operación',
    category: 'corporate',
    description: 'Comprobante vigente de aviso ante el MICI.',
    corporateOnly: true,
  },
  {
    code: 'corporate_shareholders_list',
    name: 'Lista de accionistas',
    category: 'corporate',
    description: 'Cadena societaria completa.',
    corporateOnly: true,
  },
  {
    code: 'corporate_ubo_kyc',
    name: 'KYC de beneficiarios finales (≥25%)',
    category: 'corporate',
    description: 'KYC completo de cada UBO con participación ≥25%.',
    corporateOnly: true,
  },
  {
    code: 'corporate_board_minutes',
    name: 'Acta autorizando la operación',
    category: 'corporate',
    description: 'Procès-verbal autorizando la compra/venta/alquiler.',
    corporateOnly: true,
  },
  {
    code: 'corporate_legal_rep_kyc',
    name: 'KYC del representante legal',
    category: 'corporate',
    description: 'Identificación del firmante autorizado.',
    corporateOnly: true,
  },
]

const PROPERTY_PROOF: DocSpec[] = [
  {
    code: 'property_escritura',
    name: 'Escritura pública',
    category: 'property_proof',
    description: 'Acta notarial de propiedad actual.',
  },
  {
    code: 'property_registro_publico',
    name: 'Certificado del Registro Público',
    category: 'property_proof',
    description:
      'Vigencia <30 días, prueba propiedad y ausencia de hipoteca no declarada.',
  },
  {
    code: 'property_plano_catastral',
    name: 'Plano catastral',
    category: 'property_proof',
    description: 'Plano de cadastro vigente.',
  },
  {
    code: 'property_avaluo',
    name: 'Avalúo oficial',
    category: 'property_proof',
    description: 'Evaluación oficial del bien.',
    optional: true,
  },
]

const PROPERTY_STATUS: DocSpec[] = [
  {
    code: 'property_paz_idaan',
    name: 'Paz y salvo IDAAN',
    category: 'property_status',
    description: 'Quitus servicio de agua.',
  },
  {
    code: 'property_paz_electric',
    name: 'Paz y salvo ENSA / Naturgy',
    category: 'property_status',
    description: 'Quitus servicio eléctrico.',
  },
  {
    code: 'property_paz_imu',
    name: 'Paz y salvo IMU / ANATI',
    category: 'property_status',
    description: 'Quitus impuestos prediales (ITBI/IBI).',
  },
  {
    code: 'property_paz_condo',
    name: 'Paz y salvo de copropiedad',
    category: 'property_status',
    description: 'Si el bien está en régimen PH.',
    optional: true,
  },
  {
    code: 'property_ph_cert',
    name: 'Certificado de PH',
    category: 'property_status',
    description: 'Régimen de Propiedad Horizontal aplicable.',
    optional: true,
  },
]

// =============================================================================
// SCENARIO CHECKLISTS
// =============================================================================

const SALE_BUYER: DocSpec[] = [
  ...IDENTITY_INDIVIDUAL,
  {
    code: 'identity_kyc_video_selfie',
    name: 'Selfie / KYC video',
    category: 'identity',
    description: 'Foto vivante o video, requerido si EDD activada.',
    edd: true,
  },

  // Capacidad financiera
  {
    code: 'capacity_payslips',
    name: 'Fichas de pago (3 últimas)',
    category: 'capacity',
    description: 'O 2 últimas declaraciones fiscales o carta del empleador.',
  },
  {
    code: 'capacity_employer_letter',
    name: 'Carta del empleador',
    category: 'capacity',
    optional: true,
  },
  {
    code: 'capacity_financial_statements',
    name: 'Estados financieros (autónomos)',
    category: 'capacity',
    description:
      'Estados financieros + declaraciones fiscales últimos 2 años (entrepreneurs/independientes).',
    optional: true,
  },

  // Source of funds
  {
    code: 'sof_bank_statements',
    name: 'Estados bancarios (3-6 meses)',
    category: 'sof',
    description: 'Mostrando la constitución del aporte para esta operación.',
  },
  {
    code: 'sof_prior_sale',
    name: 'Acta de venta anterior',
    category: 'sof',
    description: 'Si los fondos vienen de la venta de otro bien.',
    optional: true,
  },
  {
    code: 'sof_inheritance',
    name: 'Acta de sucesión + declaración fiscal',
    category: 'sof',
    description: 'Si los fondos vienen de herencia.',
    optional: true,
  },
  {
    code: 'sof_donation',
    name: 'Acta de donación',
    category: 'sof',
    description: 'Si los fondos vienen de una donación.',
    optional: true,
  },
  {
    code: 'sof_savings_history',
    name: 'Historial de ahorro',
    category: 'sof',
    description: 'Para fondos acumulados a lo largo del tiempo.',
    optional: true,
  },
  {
    code: 'sof_credit_preapproval',
    name: 'Pre-aprobación bancaria',
    category: 'sof',
    description: 'Si la operación se financia con crédito.',
    optional: true,
  },

  // Source of wealth (>$300K or high-risk)
  {
    code: 'sow_professional_history',
    name: 'Historial profesional',
    category: 'sow',
    description: 'Cómo el cliente construyó su patrimonio.',
    requiredAbove: 300_000,
  },
  {
    code: 'sow_business_sale',
    name: 'Cesión de empresa anterior',
    category: 'sow',
    optional: true,
    requiredAbove: 300_000,
  },
  {
    code: 'sow_investment_portfolio',
    name: 'Cartera de inversiones',
    category: 'sow',
    optional: true,
    requiredAbove: 300_000,
  },

  ...SANCTIONS_PEP,
  ...CORPORATE,
]

const SALE_SELLER: DocSpec[] = [
  ...IDENTITY_INDIVIDUAL,
  ...PROPERTY_PROOF,
  ...PROPERTY_STATUS,
  {
    code: 'property_origin_history',
    name: 'Historial de adquisición',
    category: 'property_origin',
    description:
      'Cómo el vendedor adquirió el bien. Si compra reciente a precio bajo + reventa alto: justificar (renovación, mercado).',
  },
  ...CORPORATE.map((d) =>
    d.code === 'corporate_board_minutes'
      ? { ...d, name: 'Acta autorizando la venta' }
      : d,
  ),
]

const RENTAL_TENANT: DocSpec[] = [
  ...IDENTITY_INDIVIDUAL,

  // Capacidad de pago (más liviana que venta)
  {
    code: 'capacity_payslips_rental',
    name: 'Fichas de pago (3 últimas)',
    category: 'capacity',
    description: 'O contrato de trabajo + carta de RH.',
  },
  {
    code: 'capacity_employment_contract',
    name: 'Contrato de trabajo',
    category: 'capacity',
    optional: true,
  },
  {
    code: 'capacity_tax_returns_rental',
    name: 'Declaraciones fiscales + estados bancarios (independientes)',
    category: 'capacity',
    optional: true,
  },
  {
    code: 'capacity_student_proof',
    name: 'Inscripción estudiantil + carta del garante',
    category: 'capacity',
    description: 'Para estudiantes — incluir KYC del garante.',
    optional: true,
  },
  {
    code: 'capacity_visa',
    name: 'Visa o permiso de residencia',
    category: 'capacity',
    description: 'Si el inquilino es extranjero.',
    optional: true,
  },

  // Referencias (estándar Panamá)
  {
    code: 'reference_landlord',
    name: 'Referencia del bailleur anterior',
    category: 'references',
    description: 'Carta + contacto del propietario anterior.',
  },
  {
    code: 'reference_professional',
    name: 'Referencia profesional',
    category: 'references',
  },
  {
    code: 'reference_bank',
    name: 'Carta de referencia bancaria',
    category: 'references',
    description: 'Estándar en Panamá para alquileres.',
  },

  // Garantía
  {
    code: 'guarantee_deposit_funds',
    name: 'Justificativo de fondos para depósito',
    category: 'guarantee',
    description: 'Generalmente 1-2 meses de alquiler.',
  },
  {
    code: 'guarantee_guarantor_kyc',
    name: 'KYC completo del garante',
    category: 'guarantee',
    description: 'Si aplica garante.',
    optional: true,
  },

  // AML reforzado para alquileres altos / largos / corporativos
  {
    code: 'sof_bank_statements_rental',
    name: 'Estados bancarios (alquiler >$2,500)',
    category: 'sof',
    description:
      'AML completo: alquiler >$2,500/mes activa KYC reforzado con origen de fondos.',
    requiredAbove: 2_500 * 12,
  },

  ...CORPORATE.map((d) =>
    d.code === 'corporate_board_minutes'
      ? { ...d, name: 'Acta autorizando el alquiler' }
      : d,
  ),
]

const RENTAL_LANDLORD: DocSpec[] = [
  ...IDENTITY_INDIVIDUAL,
  ...PROPERTY_PROOF.filter((d) =>
    ['property_escritura', 'property_registro_publico'].includes(d.code),
  ),
  {
    code: 'rental_landlord_power_of_attorney',
    name: 'Procuración notariada (gestión por terceros)',
    category: 'property_proof',
    description:
      'Si el broker o un mandatario gestiona por cuenta de un propietario.',
    optional: true,
  },
  ...PROPERTY_STATUS,
  {
    code: 'property_avaluo_rental',
    name: 'Avalúo reciente',
    category: 'property_status',
    description: 'Útil para fijar el precio de mercado.',
    optional: true,
  },
  {
    code: 'property_inventory',
    name: 'Inventario (si amueblado)',
    category: 'property_status',
    description: 'Inventario detallado con fotos datadas.',
    optional: true,
  },

  // Conformité fiscale
  {
    code: 'tax_dgi_registration',
    name: 'Inscripción DGI',
    category: 'tax',
    description: 'Inscripción del bien en la DGI para impuesto sobre rentas.',
  },
  {
    code: 'tax_foreign_withholding',
    name: 'Retención en fuente 12.5% (no residente)',
    category: 'tax',
    description: 'Si el bailleur es extranjero no residente.',
    optional: true,
  },
]

const BROKER_SALE: DocSpec[] = [
  // Agencia
  {
    code: 'broker_license',
    name: 'Licencia de agente inmobiliario',
    category: 'broker_agency',
    description: 'Junta Técnica de Bienes Raíces, vigente.',
  },
  {
    code: 'broker_aviso_operacion',
    name: 'Aviso de Operación de la agencia',
    category: 'broker_agency',
  },
  {
    code: 'broker_intendencia_registration',
    name: 'Registro de sujeto obligado (Intendencia)',
    category: 'broker_agency',
  },
  {
    code: 'broker_aml_manual',
    name: 'Manual de prevención LD/FT',
    category: 'broker_agency',
    description: 'Manual obligatorio (Lavado de Dinero / Financiamiento del Terrorismo).',
  },
  {
    code: 'broker_compliance_officer',
    name: 'Designación del Oficial de Cumplimiento',
    category: 'broker_agency',
    description: 'Compliance Officer declarado.',
  },
  {
    code: 'broker_aml_training',
    name: 'Pruebas de capacitación AML',
    category: 'broker_agency',
    description: 'Capacitación continua de los agentes.',
  },

  // Transacción
  {
    code: 'transaction_mandate_sale',
    name: 'Mandato firmado (contrato de corretaje)',
    category: 'transaction',
    description: 'Versión exclusiva o no.',
  },
  {
    code: 'transaction_risk_assessment',
    name: 'Evaluación de riesgo documentada',
    category: 'transaction',
    description: 'low/medium/high con justificación escrita.',
  },
  {
    code: 'transaction_promesa',
    name: 'Promesa de Compraventa',
    category: 'transaction',
  },
  {
    code: 'transaction_compraventa',
    name: 'Compraventa final (notariada)',
    category: 'transaction',
  },
  {
    code: 'transaction_commission_proof',
    name: 'Comprobante de pago de comisión',
    category: 'transaction',
    description: 'Factura + recibo.',
  },
  {
    code: 'transaction_fees_declaration',
    name: 'Declaración de honorarios (impuesto sobre la renta)',
    category: 'transaction',
  },

  // Audit trail
  {
    code: 'audit_communications',
    name: 'Comunicaciones archivadas',
    category: 'audit_trail',
    description: 'Emails y WhatsApp con comprador/vendedor.',
  },
  {
    code: 'audit_visit_notes',
    name: 'Notas de visitas',
    category: 'audit_trail',
  },
  {
    code: 'audit_decisions_log',
    name: 'Registro de decisiones',
    category: 'audit_trail',
    description: 'Validaciones / rechazos con motivo.',
  },
  {
    code: 'audit_uaf_dos',
    name: 'Declaración UAF (DOS)',
    category: 'audit_trail',
    description: 'Si aplica: copia + acuse de recibo.',
    optional: true,
  },
]

const BROKER_RENTAL: DocSpec[] = [
  // Agencia (mismos docs que venta — broker es sujeto obligado por igual)
  ...BROKER_SALE.filter((d) => d.category === 'broker_agency'),

  // Contrato y obligaciones específicas alquiler
  {
    code: 'lease_contract',
    name: 'Contrato de alquiler',
    category: 'lease',
    description:
      'Cláusulas obligatorias Panamá. Inscripción MIVIOT si <$1,500.',
  },
  {
    code: 'lease_miviot_registration',
    name: 'Inscripción DIGECA / MIVIOT',
    category: 'lease',
    description: 'Para alquileres regulados (sociales o <$1,500).',
    optional: true,
  },
  {
    code: 'transaction_mandate_rental',
    name: 'Mandato de alquiler firmado',
    category: 'transaction',
  },
  {
    code: 'lease_entry_walkthrough',
    name: 'Estado de lugares · entrada',
    category: 'lease',
    description: 'Con fotos datadas.',
  },
  {
    code: 'lease_exit_walkthrough',
    name: 'Estado de lugares · salida',
    category: 'lease',
    optional: true,
  },
  {
    code: 'lease_deposit_receipt',
    name: 'Recibos de depósito de garantía',
    category: 'lease',
    description: 'Séquestre obligatorio para algunos contratos.',
  },
  {
    code: 'lease_key_handover',
    name: 'Comprobante de entrega de llaves',
    category: 'lease',
  },
  {
    code: 'transaction_risk_assessment_rental',
    name: 'Evaluación de riesgo',
    category: 'transaction',
    description: 'Generalmente low para alquiler residencial estándar.',
  },

  // Audit trail (mismos que sale)
  ...BROKER_SALE.filter((d) => d.category === 'audit_trail'),
]

// =============================================================================
// LOOKUP TABLE
// =============================================================================

export const DOCS_BY_SCENARIO: Record<Scenario, DocSpec[]> = {
  sale_buyer: SALE_BUYER,
  sale_seller: SALE_SELLER,
  rental_tenant: RENTAL_TENANT,
  rental_landlord: RENTAL_LANDLORD,
  broker_sale: BROKER_SALE,
  broker_rental: BROKER_RENTAL,
}

/**
 * Filter the full checklist for a scenario based on transaction context.
 *
 * - Drops EDD-only docs when not in EDD mode
 * - Drops corporate-only docs when lead is an individual
 * - Drops requiredAbove docs when value is below threshold
 * - Always keeps optional ones (they're allowed but not blocking)
 */
export function checklistFor(
  scenario: Scenario,
  context: {
    transactionValue?: number
    isCorporate?: boolean
    edd?: boolean
  } = {},
): DocSpec[] {
  const list = DOCS_BY_SCENARIO[scenario] ?? []
  return list.filter((doc) => {
    if (doc.edd && !context.edd) return false
    if (doc.corporateOnly && !context.isCorporate) return false
    if (
      doc.requiredAbove != null &&
      (context.transactionValue ?? 0) < doc.requiredAbove
    ) {
      return false
    }
    return true
  })
}

/** Group a doc list by category, preserving order. */
export function groupByCategory(docs: DocSpec[]): Array<{
  category: DocCategory
  label: string
  items: DocSpec[]
}> {
  const order: DocCategory[] = []
  const map = new Map<DocCategory, DocSpec[]>()
  for (const d of docs) {
    if (!map.has(d.category)) {
      order.push(d.category)
      map.set(d.category, [])
    }
    map.get(d.category)!.push(d)
  }
  return order.map((cat) => ({
    category: cat,
    label: categoryLabel(cat),
    items: map.get(cat) ?? [],
  }))
}

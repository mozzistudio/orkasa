/**
 * Gemini prompts for generating realistic-looking demo compliance documents.
 *
 * Each prompt produces an IMAGE that *looks* like a real document (cédula,
 * paz y salvo, estado bancario, etc.) so the validation flow can be
 * demonstrated end-to-end. Every prompt mandates a clear "MUESTRA · DEMO"
 * watermark to avoid any possibility of misuse.
 *
 * Personalization fields (lead name, property, amounts) are injected by
 * `buildDocPrompt()` based on the doc code + ambient context.
 */

export type DocPromptContext = {
  /** Lead full name (compradore / vendedor / inquilino, etc.) */
  leadName: string
  /** Lead email, used as a small visual anchor */
  leadEmail?: string | null
  /** Property title — used on property-related docs */
  propertyTitle?: string | null
  /** Property address */
  propertyAddress?: string | null
  /** City + neighborhood */
  propertyCity?: string | null
  propertyNeighborhood?: string | null
  /** Sale price in USD — used on bank pre-approval, escritura, etc. */
  propertyPrice?: number | null
}

const WATERMARK_DIRECTIVE = `\nCRITICAL: Render a clearly visible diagonal watermark across the document reading "MUESTRA · DEMO · ORKASA" in semi-transparent gray text, repeated 3 times across the page. Also a footer line: "Documento generado para demostración — no válido legalmente". The watermark must be unmissable so this can never be confused with a real document.`

const STYLE_BASE = `Photorealistic document scan — flat overhead view, slight paper texture, no perspective distortion. Use clean modern typography (Helvetica/Arial-like). Black text on white paper. Realistic document layout with proper margins, headers, signature blocks. Avoid cartoonish illustrations.`

function fmtPrice(n?: number | null): string {
  if (!n) return 'USD 250,000.00'
  return `USD ${Math.round(n).toLocaleString('en-US')}.00`
}

function locationLine(ctx: DocPromptContext): string {
  const parts = [
    ctx.propertyAddress,
    ctx.propertyNeighborhood,
    ctx.propertyCity,
  ].filter(Boolean)
  if (parts.length === 0) return 'Costa del Este, Ciudad de Panamá'
  return parts.join(', ')
}

/**
 * Map of doc.code → prompt builder. Codes that aren't in here fall back to
 * a generic placeholder.
 */
const PROMPTS: Record<
  string,
  (ctx: DocPromptContext) => string
> = {
  identity_id_panamanian: (ctx) =>
    `Generate an image of a Panamanian national ID card (Cédula de Identidad Personal). Layout: front side of a horizontal ID card on a beige paper background. Include the heading "REPÚBLICA DE PANAMÁ — TRIBUNAL ELECTORAL — CÉDULA DE IDENTIDAD PERSONAL". Show the holder name "${ctx.leadName.toUpperCase()}", a sample cédula number "8-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}", date of birth "1985-03-12", nationality "PANAMEÑA", a portrait placeholder rectangle on the left, and an orange/red ribbon on the top edge. Add a barcode strip and signature line at the bottom. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  identity_id_foreign: (ctx) =>
    `Generate an image of a passport identification page. Show the holder name "${ctx.leadName.toUpperCase()}", surname highlighted, sample passport number "PA${Math.floor(Math.random() * 9000000 + 1000000)}", nationality "PANAMEÑA", date of birth "1985-03-12", expiration "2030-03-12", a portrait placeholder, machine-readable zone (MRZ) at the bottom with two lines of OCR-style characters. Background: official navy blue header with passport icon. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  identity_address_proof: (ctx) =>
    `Generate an image of a Panamanian utility bill (factura ENSA Panamá or Naturgy Panamá — pick one). Header with the utility company logo placeholder. Show the customer name "${ctx.leadName}", address "${locationLine(ctx)}", customer ID "${Math.floor(Math.random() * 900000 + 100000)}", billing period "Marzo 2026", consumption details (kWh used: 312, monto: $48.20), due date, payment status "PAGADO". Layout: invoice-style with column for description, quantity, amount. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  identity_tax_id: (ctx) =>
    `Generate an image of a Panamanian RUC (Registro Único de Contribuyentes) certificate from the DGI (Dirección General de Ingresos). Header "MINISTERIO DE ECONOMÍA Y FINANZAS — DIRECCIÓN GENERAL DE INGRESOS". Show taxpayer name "${ctx.leadName}", RUC number "${Math.floor(Math.random() * 9000000 + 1000000)}-1-${Math.floor(Math.random() * 900 + 100)}", DV "${Math.floor(Math.random() * 90 + 10)}", category "PERSONA NATURAL", activity "Asalariado", issued date "2026-03-15". Include an official-looking stamp/seal in the bottom right corner. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  capacity_payslips: (ctx) =>
    `Generate an image of a payslip (ficha de pago) for "${ctx.leadName}". Header with employer placeholder name "INMOBILIARIA PANAMÁ S.A. — RUC 123456-1-789012". Period "Marzo 2026 — Quincena 2". Show 2-column tabular layout: Devengado (Salario base $2,500.00, Comisiones $450.00, Total $2,950.00) | Deducciones (Seguro Social 9.75% $287.62, Seguro Educativo 1.25% $36.87, Impuesto sobre la Renta $128.45). Show "Salario neto: $2,497.06" prominently. Include employee data row: name, posición "Asesor Comercial Senior", fecha de ingreso "2021-06-15". ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  capacity_employer_letter: (ctx) =>
    `Generate an image of an employment verification letter (carta del empleador) printed on company letterhead. Header with placeholder logo "INMOBILIARIA PANAMÁ S.A.", company address line, RUC. Date "29 de abril de 2026". Body: "A QUIEN PUEDA INTERESAR — Por medio de la presente certificamos que el(la) Sr(a). ${ctx.leadName}, con cédula 8-XXX-XXXX, labora en nuestra empresa desde el 15 de junio de 2021, ocupando el cargo de Asesor Comercial Senior, con un salario mensual de USD 2,500.00 más comisiones. Esta carta se expide a solicitud del interesado para los trámites que estime pertinentes." Closing: "Atentamente," + signature line "Lic. Roberto Méndez — Gerente de Recursos Humanos" + company seal placeholder. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  capacity_financial_statements: (ctx) =>
    `Generate an image of audited financial statements summary cover page. Header "ESTADOS FINANCIEROS AUDITADOS — ${ctx.leadName.toUpperCase()} — Período 2024-2025". Show a small table with: Total Ingresos $185,400, Total Gastos $92,300, Utilidad Neta $93,100. Below: signature blocks for "Contador Público Autorizado" + "Cliente". Include CPA stamp placeholder in the corner. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  sof_bank_statements: (ctx) =>
    `Generate an image of a bank statement (estado de cuenta) from a Panamanian bank like Banistmo or BCP (use a generic stylized bank header). Header with bank name placeholder, customer name "${ctx.leadName}", account number ending "****4521", statement period "Febrero — Abril 2026". Show a transaction table: Date | Description | Withdrawal | Deposit | Balance. Sample entries: salary deposits, transfers, account transfers showing accumulating balance from $45,200 to $73,800 over 3 months. Closing balance line at the bottom. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  sof_credit_preapproval: (ctx) =>
    `Generate an image of a bank loan pre-approval letter (carta de pre-aprobación) on bank letterhead. Header with stylized Panamanian bank logo placeholder. Date "29 de abril de 2026". Addressed to "${ctx.leadName}". Body: "Nos complace informarle que su solicitud de financiamiento hipotecario ha sido PRE-APROBADA por un monto de hasta ${fmtPrice(ctx.propertyPrice)} para la adquisición del inmueble ubicado en ${locationLine(ctx)}. Plazo: 30 años. Tasa fija: 5.75% anual. Esta pre-aprobación tiene una vigencia de 60 días." Add signature block "Lic. María Acosta — Oficial de Crédito Hipotecario" + bank stamp placeholder. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  sof_prior_sale: (ctx) =>
    `Generate an image of a notarized sale deed cover page (escritura pública de compraventa anterior). Header "REPÚBLICA DE PANAMÁ — NOTARÍA TERCERA DEL CIRCUITO DE PANAMÁ — ESCRITURA PÚBLICA No. 2543". Date "15 de enero de 2024". Body summary: "${ctx.leadName} (vendedor) vende a tercero el inmueble ubicado en Bella Vista, Ciudad de Panamá, por la suma de USD 195,000.00". Include notarial seal placeholder, two signature blocks. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  sof_inheritance: (ctx) =>
    `Generate an image of an inheritance declaration cover page (acta de sucesión) from a Panamanian court. Header "JUZGADO TERCERO DE CIRCUITO CIVIL DEL PRIMER CIRCUITO JUDICIAL DE PANAMÁ — DECLARATORIA DE HEREDEROS — Expediente No. 2025-0843". Body summary mentioning heir "${ctx.leadName}" receiving USD ${(Math.floor(Math.random() * 200) + 100) * 1000} from estate. Court seal placeholder + judge signature line. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  sof_donation: (ctx) =>
    `Generate an image of a notarized donation deed (acta de donación). Header "ESCRITURA DE DONACIÓN — Notaría Quinta — Escritura No. 1287". Date. Donor: "Familia [Apellido] sample". Recipient: "${ctx.leadName}". Amount: USD 80,000.00. Include notarial format, witnesses signature lines, official seal placeholder. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  sof_savings_history: (ctx) =>
    `Generate an image of a savings account history report from a Panamanian bank. Header with bank logo placeholder, account holder "${ctx.leadName}", account "Ahorros Premium ****8821". Show a year-by-year balance growth table from 2018 to 2026: starting balance $12,000, accumulating with monthly deposits and interest, ending at $87,500. Include a small ascending line chart visualization. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  sow_professional_history: (ctx) =>
    `Generate an image of a curriculum vitae / professional history summary for "${ctx.leadName}". Format: 1-page resume with name + title at top, work experience section listing 3 jobs with dates and descriptions, education section, certifications. Spanish language. Modern minimalist layout. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  pep_declaration: (ctx) =>
    `Generate an image of a sworn PEP declaration form (Declaración Jurada de Persona Expuesta Políticamente) per Panamanian Ley 23/2015. Header "DECLARACIÓN JURADA — PERSONA EXPUESTA POLÍTICAMENTE (PEP)". Show declarant block: "Yo, ${ctx.leadName}, con cédula 8-XXX-XXXX". Two checkboxes section: "[ ] NO soy PEP, ni familiar hasta 2° grado, ni allegado de ningún PEP" (CHECKED) and "[ ] SÍ soy PEP / familiar de PEP — detallar:" (unchecked). Body confirming the truthfulness, date "29 de abril de 2026", signature line, witness signature line, stamp placeholder. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_escritura: (ctx) =>
    `Generate an image of a notarized property deed (escritura pública de compraventa) cover page. Header "REPÚBLICA DE PANAMÁ — NOTARÍA SÉPTIMA DEL CIRCUITO DE PANAMÁ — ESCRITURA PÚBLICA No. 4892". Body summary: "Que comparece el(la) Sr(a). ${ctx.leadName} (vendedor) y procede a vender al comprador el inmueble denominado '${ctx.propertyTitle ?? 'Apartamento'}' ubicado en ${locationLine(ctx)}, finca No. 348-2156, por la suma de ${fmtPrice(ctx.propertyPrice)}." Two signature blocks, notarial seal placeholder, dual columns showing legal language. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_registro_publico: (ctx) =>
    `Generate an image of a Panamanian Public Registry certificate (Certificado del Registro Público). Header "REPÚBLICA DE PANAMÁ — REGISTRO PÚBLICO DE PANAMÁ — CERTIFICACIÓN DE PROPIEDAD". Show finca number "348-2156", inscripción No. "1247", tomo "78", folio "234". Owner: "${ctx.leadName}". Property location: "${locationLine(ctx)}". Status: "LIBRE DE GRAVAMEN — sin hipotecas vigentes". Issue date "29 de abril de 2026". Validity stamp showing 30-day expiry. Include the official Registro Público seal placeholder. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_plano_catastral: (ctx) =>
    `Generate an image of a cadastral plan (plano catastral) issued by ANATI (Autoridad Nacional de Administración de Tierras) of Panamá. Show the plan layout with: title block "PLANO CATASTRAL — Finca 348-2156", scale "1:500", a stylized parcel outline showing the property lot boundaries with measurements, neighboring lot numbers, north arrow indicator, signature block of the surveyor (agrimensor) at the bottom right, ANATI seal placeholder. Property address from "${locationLine(ctx)}". ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_avaluo: (ctx) =>
    `Generate an image of a real estate appraisal report (avalúo oficial) cover page. Header "AVALÚO COMERCIAL — Inmueble ${ctx.propertyTitle ?? 'Apartamento'}" with appraiser company logo placeholder. Show valuation summary: total appraised value ${fmtPrice(ctx.propertyPrice)}, area, $/m², appraisal date. Property data block with address and characteristics. Signature block of the appraiser (perito valuador certificado) + stamp. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_paz_idaan: (ctx) =>
    `Generate an image of a "Paz y Salvo" certificate from IDAAN (Instituto de Acueductos y Alcantarillados Nacionales — Panamá's water utility). Header with IDAAN logo placeholder + government seal. "PAZ Y SALVO" in large heading. Account holder "${ctx.leadName}", account number "PA-${Math.floor(Math.random() * 900000 + 100000)}", service address "${locationLine(ctx)}". Body: "Se certifica que la cuenta antes mencionada se encuentra al día en sus pagos al ${new Date().toLocaleDateString('es-PA')}. Sin saldo pendiente." Issue date, validity period 30 días, official IDAAN stamp. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_paz_electric: (ctx) =>
    `Generate an image of a "Paz y Salvo" certificate from ENSA (Empresa de Distribución Eléctrica) of Panamá. Header with ENSA logo placeholder. "PAZ Y SALVO ELÉCTRICO" heading. Customer "${ctx.leadName}", NIS "${Math.floor(Math.random() * 9000000 + 1000000)}", service address "${locationLine(ctx)}". Body certifying no outstanding balance. Issue date, 30-day validity stamp, ENSA seal. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_paz_imu: (ctx) =>
    `Generate an image of a "Paz y Salvo" certificate for property tax (IMU/ITBI) from ANATI Panamá. Header "REPÚBLICA DE PANAMÁ — AUTORIDAD NACIONAL DE ADMINISTRACIÓN DE TIERRAS — PAZ Y SALVO MUNICIPAL". Show finca No. "348-2156", taxpayer "${ctx.leadName}", property location "${locationLine(ctx)}". Body certifying property tax obligations are current through 2026. Issue date, official ANATI seal placeholder. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_paz_condo: (ctx) =>
    `Generate an image of a condominium HOA "Paz y Salvo" letter from a building administrator. Header "ADMINISTRACIÓN ${ctx.propertyTitle ?? 'EDIFICIO PREMIER'} — PAZ Y SALVO DE COPROPIEDAD". Owner "${ctx.leadName}", apartment "Apto. 12-A". Body: "El propietario se encuentra al día en sus cuotas de mantenimiento mensuales hasta abril 2026. Sin morosidad pendiente." Date, signature block "Junta Directiva", administrator seal. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,

  property_ph_cert: (ctx) =>
    `Generate an image of a Propiedad Horizontal (PH) registration certificate. Header "CERTIFICACIÓN DE RÉGIMEN DE PROPIEDAD HORIZONTAL — Ministerio de Vivienda Panamá". Show condominium name "${ctx.propertyTitle ?? 'EDIFICIO PREMIER'}", PH No. "PH-2018-1247", date of incorporation, address "${locationLine(ctx)}", coefficient of participation, common areas list. Official MIVIOT seal placeholder. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`,
}

/**
 * Build the Gemini prompt for a given doc code. Falls back to a generic
 * placeholder for codes without a specific template (so even uncovered docs
 * can render *something* rather than failing).
 */
export function buildDocPrompt(
  code: string,
  ctx: DocPromptContext,
): string {
  const builder = PROMPTS[code]
  if (builder) return builder(ctx)
  return `Generate an image of a generic Panamanian compliance document titled "${code}". Show the holder name "${ctx.leadName}", a date, signature block, official-looking layout with letterhead. ${STYLE_BASE}${WATERMARK_DIRECTIVE}`
}

export function hasPromptFor(code: string): boolean {
  return code in PROMPTS
}

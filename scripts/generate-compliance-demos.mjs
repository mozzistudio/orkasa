#!/usr/bin/env node
/**
 * One-shot generator for demo compliance documents.
 *
 * Walks every (lead, doc-code) combination that's currently flagged with a
 * `compliance-demo/...` placeholder path, calls Gemini 2.5 Flash Image with
 * a personalized prompt (real lead name + property data), uploads the
 * result to the private `compliance-documents` bucket, and updates ALL
 * doc rows for that (lead, code) pair to point at the new file. So each
 * unique image is generated once and reused across the lead's checks.
 *
 * Usage:
 *   node scripts/generate-compliance-demos.mjs
 *
 * Env required (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   GEMINI_API_KEY
 *
 * Auth: signs in as demo@orkasa.app (owner of Casa Móvil S.A.) so storage
 * uploads pass RLS via session JWT — no service role key needed.
 *
 * Cost: ~$0.01 per image × 24 unique combos = ~$0.24
 * Runtime: ~5-10s per call × 24 = ~3-4 min total
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

// =============================================================================
// Env
// =============================================================================
const here = dirname(fileURLToPath(import.meta.url))
const envText = readFileSync(resolve(here, '..', '.env.local'), 'utf8')
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [k, ...v] = l.split('=')
      return [k.trim(), v.join('=').trim()]
    }),
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const GEMINI_KEY = env.GEMINI_API_KEY
const DEMO_EMAIL = 'demo@orkasa.app'
const DEMO_PASSWORD = 'orkasa-demo-2026'

if (!SUPABASE_URL || !SUPABASE_ANON || !GEMINI_KEY) {
  console.error('Missing env vars. Need SUPABASE_URL, SUPABASE_ANON, GEMINI_KEY.')
  process.exit(1)
}

// =============================================================================
// Prompt library — same content as src/lib/compliance-doc-prompts.ts but
// duplicated here so this script has zero TS/import dependency on the app.
// =============================================================================

const STYLE_BASE = `Photorealistic document scan — flat overhead view, slight paper texture, no perspective distortion. Use clean modern typography (Helvetica/Arial-like). Black text on white paper. Realistic document layout with proper margins, headers, signature blocks. Avoid cartoonish illustrations.`

const WATERMARK = `\nCRITICAL: Render a clearly visible diagonal watermark across the document reading "MUESTRA · DEMO · ORKASA" in semi-transparent gray text, repeated 3 times across the page. Also a footer line: "Documento generado para demostración — no válido legalmente". The watermark must be unmissable so this can never be confused with a real document.`

function fmtPrice(n) {
  if (!n) return 'USD 250,000.00'
  return `USD ${Math.round(n).toLocaleString('en-US')}.00`
}

function locationLine(ctx) {
  const parts = [ctx.address, ctx.neighborhood, ctx.city].filter(Boolean)
  return parts.length === 0 ? 'Costa del Este, Ciudad de Panamá' : parts.join(', ')
}

const PROMPTS = {
  identity_id_panamanian: (ctx) =>
    `Generate an image of a Panamanian national ID card (Cédula de Identidad Personal). Layout: front side of a horizontal ID card on a beige paper background. Include the heading "REPÚBLICA DE PANAMÁ — TRIBUNAL ELECTORAL — CÉDULA DE IDENTIDAD PERSONAL". Show the holder name "${ctx.leadName.toUpperCase()}", a sample cédula number "8-${rand(100, 999)}-${rand(1000, 9999)}", date of birth "1985-03-12", nationality "PANAMEÑA", a portrait placeholder rectangle on the left, and an orange/red ribbon on the top edge. Add a barcode strip and signature line at the bottom. ${STYLE_BASE}${WATERMARK}`,

  identity_address_proof: (ctx) =>
    `Generate an image of a Panamanian utility bill (factura ENSA Panamá or Naturgy Panamá — pick one). Header with the utility company logo placeholder. Show the customer name "${ctx.leadName}", address "${locationLine(ctx)}", customer ID "${rand(100000, 999999)}", billing period "Marzo 2026", consumption details (kWh used: 312, monto: $48.20), due date, payment status "PAGADO". Layout: invoice-style with column for description, quantity, amount. ${STYLE_BASE}${WATERMARK}`,

  identity_tax_id: (ctx) =>
    `Generate an image of a Panamanian RUC (Registro Único de Contribuyentes) certificate from the DGI (Dirección General de Ingresos). Header "MINISTERIO DE ECONOMÍA Y FINANZAS — DIRECCIÓN GENERAL DE INGRESOS". Show taxpayer name "${ctx.leadName}", RUC number "${rand(1000000, 9999999)}-1-${rand(100, 999)}", DV "${rand(10, 99)}", category "PERSONA NATURAL", activity "Asalariado", issued date "2026-03-15". Include an official-looking stamp/seal in the bottom right corner. ${STYLE_BASE}${WATERMARK}`,

  capacity_payslips: (ctx) =>
    `Generate an image of a payslip (ficha de pago) for "${ctx.leadName}". Header with employer placeholder name "INMOBILIARIA PANAMÁ S.A. — RUC 123456-1-789012". Period "Marzo 2026 — Quincena 2". Show 2-column tabular layout: Devengado (Salario base $2,500.00, Comisiones $450.00, Total $2,950.00) | Deducciones (Seguro Social 9.75% $287.62, Seguro Educativo 1.25% $36.87, Impuesto sobre la Renta $128.45). Show "Salario neto: $2,497.06" prominently. Include employee data row: name, posición "Asesor Comercial Senior", fecha de ingreso "2021-06-15". ${STYLE_BASE}${WATERMARK}`,

  capacity_employer_letter: (ctx) =>
    `Generate an image of an employment verification letter (carta del empleador) printed on company letterhead. Header with placeholder logo "INMOBILIARIA PANAMÁ S.A.", company address line, RUC. Date "29 de abril de 2026". Body: "A QUIEN PUEDA INTERESAR — Por medio de la presente certificamos que el(la) Sr(a). ${ctx.leadName}, con cédula 8-XXX-XXXX, labora en nuestra empresa desde el 15 de junio de 2021, ocupando el cargo de Asesor Comercial Senior, con un salario mensual de USD 2,500.00 más comisiones. Esta carta se expide a solicitud del interesado para los trámites que estime pertinentes." Closing: "Atentamente," + signature line "Lic. Roberto Méndez — Gerente de Recursos Humanos" + company seal placeholder. ${STYLE_BASE}${WATERMARK}`,

  sof_bank_statements: (ctx) =>
    `Generate an image of a bank statement (estado de cuenta) from a Panamanian bank like Banistmo or BCP (use a generic stylized bank header). Header with bank name placeholder, customer name "${ctx.leadName}", account number ending "****4521", statement period "Febrero — Abril 2026". Show a transaction table: Date | Description | Withdrawal | Deposit | Balance. Sample entries: salary deposits, transfers, account transfers showing accumulating balance from $45,200 to $73,800 over 3 months. Closing balance line at the bottom. ${STYLE_BASE}${WATERMARK}`,

  sof_credit_preapproval: (ctx) =>
    `Generate an image of a bank loan pre-approval letter (carta de pre-aprobación) on bank letterhead. Header with stylized Panamanian bank logo placeholder. Date "29 de abril de 2026". Addressed to "${ctx.leadName}". Body: "Nos complace informarle que su solicitud de financiamiento hipotecario ha sido PRE-APROBADA por un monto de hasta ${fmtPrice(ctx.price)} para la adquisición del inmueble ubicado en ${locationLine(ctx)}. Plazo: 30 años. Tasa fija: 5.75% anual. Esta pre-aprobación tiene una vigencia de 60 días." Add signature block "Lic. María Acosta — Oficial de Crédito Hipotecario" + bank stamp placeholder. ${STYLE_BASE}${WATERMARK}`,

  pep_declaration: (ctx) =>
    `Generate an image of a sworn PEP declaration form (Declaración Jurada de Persona Expuesta Políticamente) per Panamanian Ley 23/2015. Header "DECLARACIÓN JURADA — PERSONA EXPUESTA POLÍTICAMENTE (PEP)". Show declarant block: "Yo, ${ctx.leadName}, con cédula 8-XXX-XXXX". Two checkboxes section: "[ ] NO soy PEP, ni familiar hasta 2° grado, ni allegado de ningún PEP" (CHECKED) and "[ ] SÍ soy PEP / familiar de PEP — detallar:" (unchecked). Body confirming the truthfulness, date "29 de abril de 2026", signature line, witness signature line, stamp placeholder. ${STYLE_BASE}${WATERMARK}`,
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildPrompt(code, ctx) {
  const builder = PROMPTS[code]
  if (!builder) {
    return `Generate an image of a generic Panamanian compliance document. Show the holder name "${ctx.leadName}". ${STYLE_BASE}${WATERMARK}`
  }
  return builder(ctx)
}

// =============================================================================
// Main
// =============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY })
const MODEL = 'gemini-2.5-flash-image'

async function main() {
  // 1. Sign in as demo user (RLS-friendly)
  console.log('→ Signing in as', DEMO_EMAIL)
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  if (authErr) {
    console.error('Auth failed:', authErr.message)
    process.exit(1)
  }

  // 2. Fetch all unique (lead, code) combos that need generation
  // We use the underlying tables directly since the join is straightforward.
  console.log('→ Loading docs to generate…')
  const { data: docs, error: fetchErr } = await supabase
    .from('compliance_documents')
    .select(
      'id, code, brokerage_id, check_id, status, file_path, file_name, ' +
        'compliance_checks!inner(lead_id, leads(full_name, property_id, properties(title, address, city, neighborhood, price)))',
    )
    .like('file_path', 'compliance-demo/%')
    .in('status', ['uploaded', 'verified'])

  if (fetchErr) {
    console.error('Fetch error:', fetchErr.message)
    process.exit(1)
  }

  // 3. Group by (lead_id, code) — generate once per combo
  const combos = new Map()
  for (const d of docs ?? []) {
    const check = d.compliance_checks
    const lead = check?.leads
    if (!lead || !d.code) continue
    const property = lead.properties
    const leadId = check.lead_id
    const key = `${leadId}::${d.code}`
    if (!combos.has(key)) {
      combos.set(key, {
        leadId,
        code: d.code,
        brokerageId: d.brokerage_id,
        ctx: {
          leadName: lead.full_name,
          address: property?.address ?? null,
          city: property?.city ?? null,
          neighborhood: property?.neighborhood ?? null,
          price: property?.price ? Number(property.price) : null,
        },
        docs: [],
      })
    }
    combos.get(key).docs.push({
      id: d.id,
      checkId: d.check_id,
      brokerageId: d.brokerage_id,
    })
  }

  console.log(`→ ${combos.size} unique (lead, code) combos to generate`)
  console.log(`  Will update ${docs?.length ?? 0} doc rows total`)

  // 4. Generate each combo sequentially (Gemini rate limits + cost control)
  let i = 0
  let success = 0
  let failed = 0
  for (const combo of combos.values()) {
    i++
    const progress = `[${i}/${combos.size}]`
    const label = `${combo.ctx.leadName} · ${combo.code}`
    console.log(`${progress} ${label} …`)

    const prompt = buildPrompt(combo.code, combo.ctx)

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })

      const part = response.candidates
        ?.flatMap((c) => c.content?.parts ?? [])
        .find((p) => p.inlineData?.data)

      if (!part?.inlineData?.data) {
        console.warn(`  ✗ Gemini returned no image`)
        failed++
        continue
      }

      const buffer = Buffer.from(part.inlineData.data, 'base64')
      const mime = part.inlineData.mimeType ?? 'image/png'
      const ext = mime.split('/')[1]?.split('+')[0] ?? 'png'
      const fileName = `${combo.code}-${Date.now()}.${ext}`
      // Use the first doc's check_id as the path anchor — RLS only checks
      // the brokerage segment so it's fine that multiple checks reuse it.
      const path = `${combo.brokerageId}/${combo.docs[0].checkId}/${fileName}`

      const { error: upErr } = await supabase.storage
        .from('compliance-documents')
        .upload(path, buffer, { contentType: mime, upsert: false })

      if (upErr) {
        console.warn(`  ✗ Upload error: ${upErr.message}`)
        failed++
        continue
      }

      // Update every doc row in this (lead, code) bucket to point at the
      // freshly-uploaded file
      const docIds = combo.docs.map((d) => d.id)
      const { error: updateErr } = await supabase
        .from('compliance_documents')
        .update({
          file_path: path,
          file_name: fileName,
          uploaded_at: new Date().toISOString(),
        })
        .in('id', docIds)

      if (updateErr) {
        console.warn(`  ✗ DB update error: ${updateErr.message}`)
        failed++
        continue
      }

      console.log(`  ✓ uploaded ${(buffer.length / 1024).toFixed(0)}kb · updated ${docIds.length} rows`)
      success++

      // Small delay to be friendly to Gemini rate limits
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      console.error(`  ✗ ${err?.message ?? err}`)
      failed++
    }
  }

  console.log('\n=== Done ===')
  console.log(`  Success: ${success}/${combos.size}`)
  console.log(`  Failed:  ${failed}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})

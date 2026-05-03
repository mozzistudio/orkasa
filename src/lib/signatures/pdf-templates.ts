import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { SignatureTemplate, TemplateData } from './types'

const PAGE_W = 595.28 // A4 width in points
const PAGE_H = 841.89 // A4 height in points
const MARGIN = 56 // ~2cm
const LINE = 13
const PARA = 8

type Ctx = {
  pdf: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  y: number
}

function newPage(ctx: Ctx): Ctx {
  const page = ctx.pdf.addPage([PAGE_W, PAGE_H])
  return { ...ctx, page, y: PAGE_H - MARGIN }
}

function ensureSpace(ctx: Ctx, needed: number): Ctx {
  if (ctx.y - needed < MARGIN) return newPage(ctx)
  return ctx
}

function drawHeading(ctx: Ctx, text: string): Ctx {
  ctx = ensureSpace(ctx, 28)
  ctx.page.drawText(text, {
    x: MARGIN,
    y: ctx.y - 14,
    size: 13,
    font: ctx.bold,
    color: rgb(0, 0, 0),
  })
  return { ...ctx, y: ctx.y - 22 }
}

function drawTitle(ctx: Ctx, text: string): Ctx {
  ctx = ensureSpace(ctx, 38)
  ctx.page.drawText(text, {
    x: MARGIN,
    y: ctx.y - 18,
    size: 17,
    font: ctx.bold,
    color: rgb(0, 0, 0),
  })
  return { ...ctx, y: ctx.y - 30 }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (cur) lines.push(cur)
      cur = w
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function drawParagraph(ctx: Ctx, text: string, opts: { size?: number; bold?: boolean } = {}): Ctx {
  const size = opts.size ?? 10.5
  const font = opts.bold ? ctx.bold : ctx.font
  const lines = wrapText(text, font, size, PAGE_W - MARGIN * 2)
  for (const line of lines) {
    ctx = ensureSpace(ctx, LINE)
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y - size,
      size,
      font,
      color: rgb(0.1, 0.1, 0.1),
    })
    ctx = { ...ctx, y: ctx.y - LINE }
  }
  return { ...ctx, y: ctx.y - PARA }
}

function drawDivider(ctx: Ctx): Ctx {
  ctx = ensureSpace(ctx, 12)
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y - 4 },
    end: { x: PAGE_W - MARGIN, y: ctx.y - 4 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  })
  return { ...ctx, y: ctx.y - 12 }
}

function drawKeyValue(ctx: Ctx, key: string, value: string): Ctx {
  ctx = ensureSpace(ctx, LINE)
  const size = 10
  ctx.page.drawText(key, {
    x: MARGIN,
    y: ctx.y - size,
    size,
    font: ctx.font,
    color: rgb(0.4, 0.4, 0.4),
  })
  ctx.page.drawText(value, {
    x: MARGIN + 160,
    y: ctx.y - size,
    size,
    font: ctx.bold,
    color: rgb(0, 0, 0),
  })
  return { ...ctx, y: ctx.y - LINE - 2 }
}

function fmtPrice(price: number | null, currency: string | null): string {
  if (price == null) return '—'
  const cur = currency ?? 'USD'
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: cur,
    maximumFractionDigits: 0,
  }).format(price)
}

function todayStr(): string {
  return new Date().toLocaleDateString('es-PA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function propertyDescription(p: TemplateData['property']): string {
  const parts: string[] = []
  parts.push(p.property_type === 'house' ? 'casa' : p.property_type === 'land' ? 'lote' : 'inmueble')
  if (p.bedrooms != null) parts.push(`${p.bedrooms} dormitorios`)
  if (p.bathrooms != null) parts.push(`${p.bathrooms} baños`)
  if (p.area_m2 != null) parts.push(`${p.area_m2} m²`)
  const loc = [p.address, p.neighborhood, p.city].filter(Boolean).join(', ')
  return `${parts.join(', ')}${loc ? ` ubicado en ${loc}` : ''}`
}

// ─── Templates ───────────────────────────────────────────────────────────

async function buildAutorizacionVenta(data: TemplateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([PAGE_W, PAGE_H])
  let ctx: Ctx = { pdf, page, font, bold, y: PAGE_H - MARGIN }

  ctx = drawTitle(ctx, 'AUTORIZACIÓN DE VENTA')
  ctx = drawParagraph(ctx, `Panamá, ${todayStr()}`, { size: 10 })
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'PARTES')
  ctx = drawKeyValue(ctx, 'Propietario:', data.owner.name)
  if (data.owner.phone) ctx = drawKeyValue(ctx, 'Teléfono:', data.owner.phone)
  if (data.owner.email) ctx = drawKeyValue(ctx, 'Email:', data.owner.email)
  ctx = drawKeyValue(ctx, 'Corredor:', data.brokerage.name)
  if (data.agent.name) ctx = drawKeyValue(ctx, 'Agente:', data.agent.name)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'INMUEBLE')
  ctx = drawKeyValue(ctx, 'Descripción:', data.property.title)
  if (data.property.address) ctx = drawKeyValue(ctx, 'Dirección:', data.property.address)
  if (data.property.neighborhood)
    ctx = drawKeyValue(ctx, 'Sector:', data.property.neighborhood)
  if (data.property.city) ctx = drawKeyValue(ctx, 'Ciudad:', data.property.city)
  ctx = drawKeyValue(
    ctx,
    'Precio de venta:',
    fmtPrice(data.property.price, data.property.currency),
  )
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'OBJETO Y CONDICIONES')

  const months = data.duration_months ?? 6
  const commission = data.commission_pct ?? 5

  ctx = drawParagraph(
    ctx,
    `PRIMERO. El PROPIETARIO autoriza al CORREDOR de manera exclusiva a publicar, promocionar y gestionar la venta del inmueble descrito (en adelante, "EL INMUEBLE") por un período de ${months} (${months === 12 ? 'doce' : months === 6 ? 'seis' : months}) meses contados a partir de la fecha de firma del presente documento.`,
  )

  ctx = drawParagraph(
    ctx,
    `SEGUNDO. El precio de venta inicial será de ${fmtPrice(data.property.price, data.property.currency)}. Cualquier modificación deberá ser autorizada por escrito por el PROPIETARIO.`,
  )

  ctx = drawParagraph(
    ctx,
    `TERCERO. La comisión por la gestión de venta será del ${commission}% (${commission === 5 ? 'cinco' : commission === 3 ? 'tres' : commission} por ciento) sobre el precio efectivo de venta, más el ITBMS aplicable, pagadera al CORREDOR al momento del cierre de la operación.`,
  )

  ctx = drawParagraph(
    ctx,
    `CUARTO. El PROPIETARIO autoriza al CORREDOR a tomar y publicar fotografías, videos y descripciones del INMUEBLE en portales inmobiliarios (Encuentra24, Mercadolibre, Compreoalquile y otros), redes sociales y sitios web propios.`,
  )

  ctx = drawParagraph(
    ctx,
    `QUINTO. El PROPIETARIO declara que es el único y legítimo propietario del INMUEBLE, que el mismo se encuentra libre de gravámenes y que cuenta con todas las autorizaciones necesarias para su venta.`,
  )

  ctx = drawParagraph(
    ctx,
    `SEXTO. Las partes aceptan que la firma electrónica del presente documento, conforme a la Ley 51 de 2008 de la República de Panamá, tiene plena validez y fuerza legal.`,
  )

  return pdf.save()
}

async function buildPromesaCompraventa(data: TemplateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([PAGE_W, PAGE_H])
  let ctx: Ctx = { pdf, page, font, bold, y: PAGE_H - MARGIN }

  ctx = drawTitle(ctx, 'PROMESA DE COMPRAVENTA')
  ctx = drawParagraph(ctx, `Panamá, ${todayStr()}`, { size: 10 })
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'PARTES')
  ctx = drawKeyValue(ctx, 'Vendedor (Propietario):', data.owner.name)
  if (data.owner.phone) ctx = drawKeyValue(ctx, 'Teléfono:', data.owner.phone)
  if (data.owner.email) ctx = drawKeyValue(ctx, 'Email:', data.owner.email)
  ctx = drawKeyValue(ctx, 'Comprador:', '[A completar]')
  ctx = drawKeyValue(ctx, 'Corredor:', data.brokerage.name)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'INMUEBLE')
  ctx = drawParagraph(ctx, propertyDescription(data.property))
  ctx = drawKeyValue(
    ctx,
    'Precio acordado:',
    fmtPrice(data.property.price, data.property.currency),
  )
  if (data.earnest_money != null) {
    ctx = drawKeyValue(
      ctx,
      'Arras (señal):',
      fmtPrice(data.earnest_money, data.property.currency),
    )
  }
  if (data.closing_date) ctx = drawKeyValue(ctx, 'Fecha de cierre:', data.closing_date)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'CONDICIONES')

  ctx = drawParagraph(
    ctx,
    `PRIMERO. El VENDEDOR se compromete a vender, y el COMPRADOR se compromete a comprar, el INMUEBLE descrito anteriormente, libre de gravámenes, hipotecas o cualquier otra limitación al dominio.`,
  )

  ctx = drawParagraph(
    ctx,
    `SEGUNDO. El precio total de la operación es de ${fmtPrice(data.property.price, data.property.currency)}, pagadero conforme al cronograma acordado entre las partes.`,
  )

  if (data.earnest_money != null) {
    ctx = drawParagraph(
      ctx,
      `TERCERO. En este acto, el COMPRADOR entrega al VENDEDOR la suma de ${fmtPrice(data.earnest_money, data.property.currency)} en concepto de arras, las cuales se imputarán al precio total al momento del cierre.`,
    )
  }

  ctx = drawParagraph(
    ctx,
    `CUARTO. La escritura pública se otorgará ante notario público de la República de Panamá${data.closing_date ? ` a más tardar el ${data.closing_date}` : ''}. Los gastos notariales y de registro se distribuirán según costumbre del mercado panameño.`,
  )

  ctx = drawParagraph(
    ctx,
    `QUINTO. El VENDEDOR garantiza la titularidad del INMUEBLE y se compromete a entregar todos los documentos necesarios (paz y salvo nacional, paz y salvo municipal, recibos de servicios al día, certificado de Registro Público).`,
  )

  ctx = drawParagraph(
    ctx,
    `SEXTO. El incumplimiento del COMPRADOR dará derecho al VENDEDOR a retener las arras como indemnización. El incumplimiento del VENDEDOR lo obligará a devolver las arras al doble.`,
  )

  ctx = drawParagraph(
    ctx,
    `SÉPTIMO. Las partes aceptan que la firma electrónica del presente documento, conforme a la Ley 51 de 2008 de la República de Panamá, tiene plena validez y fuerza legal.`,
  )

  return pdf.save()
}

async function buildAddendum(data: TemplateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([PAGE_W, PAGE_H])
  let ctx: Ctx = { pdf, page, font, bold, y: PAGE_H - MARGIN }

  ctx = drawTitle(ctx, 'ADDENDUM')
  ctx = drawParagraph(ctx, `Panamá, ${todayStr()}`, { size: 10 })
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'PARTES')
  ctx = drawKeyValue(ctx, 'Propietario:', data.owner.name)
  ctx = drawKeyValue(ctx, 'Corredor:', data.brokerage.name)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'INMUEBLE')
  ctx = drawKeyValue(ctx, 'Descripción:', data.property.title)
  if (data.property.address) ctx = drawKeyValue(ctx, 'Dirección:', data.property.address)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'MODIFICACIONES')
  ctx = drawParagraph(
    ctx,
    data.amendment_text ??
      'Las partes acuerdan modificar los términos del acuerdo previo según lo descrito a continuación: [completar].',
  )

  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawParagraph(
    ctx,
    `Salvo por las modificaciones expresamente indicadas en el presente Addendum, todas las demás cláusulas y condiciones del acuerdo original permanecen vigentes y en pleno vigor.`,
  )

  ctx = drawParagraph(
    ctx,
    `Las partes aceptan que la firma electrónica del presente documento, conforme a la Ley 51 de 2008 de la República de Panamá, tiene plena validez y fuerza legal.`,
  )

  return pdf.save()
}

export async function buildTemplate(
  type: SignatureTemplate,
  data: TemplateData,
): Promise<Uint8Array> {
  switch (type) {
    case 'autorizacion_venta':
      return buildAutorizacionVenta(data)
    case 'promesa_compraventa':
      return buildPromesaCompraventa(data)
    case 'addendum':
      return buildAddendum(data)
  }
}

// ─── Sign existing PDF (stamp signature page) ────────────────────────────

export async function stampSignedPdf(
  originalPdf: Uint8Array,
  signature: {
    typedName: string
    signedAt: Date
    ip: string
    userAgent: string
    documentTitle: string
    signerPhone: string | null
    signerEmail: string | null
  },
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(originalPdf)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([PAGE_W, PAGE_H])
  let ctx: Ctx = { pdf, page, font, bold, y: PAGE_H - MARGIN }

  ctx = drawTitle(ctx, 'CERTIFICADO DE FIRMA ELECTRÓNICA')
  ctx = drawParagraph(
    ctx,
    'Este documento ha sido firmado electrónicamente conforme a la Ley 51 de 2008 de la República de Panamá sobre Documentos y Firmas Electrónicas.',
    { size: 10 },
  )
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'DOCUMENTO')
  ctx = drawKeyValue(ctx, 'Título:', signature.documentTitle)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  ctx = drawHeading(ctx, 'FIRMA')
  ctx = drawKeyValue(ctx, 'Nombre del firmante:', signature.typedName)
  if (signature.signerPhone) ctx = drawKeyValue(ctx, 'Teléfono:', signature.signerPhone)
  if (signature.signerEmail) ctx = drawKeyValue(ctx, 'Email:', signature.signerEmail)
  ctx = drawKeyValue(
    ctx,
    'Fecha y hora:',
    signature.signedAt.toLocaleString('es-PA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Panama',
      timeZoneName: 'short',
    }),
  )
  ctx = drawKeyValue(ctx, 'IP del firmante:', signature.ip)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  // Signature visual block
  ctx = ensureSpace(ctx, 80)
  const blockY = ctx.y - 70
  ctx.page.drawRectangle({
    x: MARGIN,
    y: blockY,
    width: PAGE_W - MARGIN * 2,
    height: 60,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.8,
  })
  ctx.page.drawText(signature.typedName, {
    x: MARGIN + 16,
    y: blockY + 28,
    size: 22,
    font: bold,
    color: rgb(0.05, 0.05, 0.05),
  })
  ctx.page.drawText('Firmado electrónicamente', {
    x: MARGIN + 16,
    y: blockY + 12,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })
  ctx = { ...ctx, y: blockY - 16 }

  ctx = drawDivider(ctx)
  ctx = drawParagraph(
    ctx,
    `User-Agent: ${signature.userAgent.slice(0, 200)}`,
    { size: 8 },
  )

  return pdf.save()
}

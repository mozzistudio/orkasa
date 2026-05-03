import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 56
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

function drawHeading(ctx: Ctx, text: string): Ctx {
  ctx = ensureSpace(ctx, 28)
  ctx.page.drawText(text, {
    x: MARGIN,
    y: ctx.y - 14,
    size: 12,
    font: ctx.bold,
    color: rgb(0, 0, 0),
  })
  return { ...ctx, y: ctx.y - 22 }
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

function fmtPrice(price: number | null, currency: string | null): string {
  if (price == null) return '—'
  const cur = currency ?? 'USD'
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: cur,
    maximumFractionDigits: 0,
  }).format(price)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export type OfferPdfData = {
  offer: {
    id: string
    amount: number
    currency: string
    conditions: string | null
    notes: string | null
    created_at: string
    status: string
  }
  buyer: {
    full_name: string
    phone: string | null
    email: string | null
  }
  property: {
    title: string
    address: string | null
    neighborhood: string | null
    city: string | null
    price: number | null
    currency: string | null
    property_type: string
    bedrooms: number | null
    bathrooms: number | null
    area_m2: number | null
  }
  owner: {
    name: string | null
    phone: string | null
    email: string | null
  }
  brokerage: {
    name: string
  }
  agent: {
    name: string | null
    phone: string | null
  }
}

export async function buildOfferPdf(data: OfferPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([PAGE_W, PAGE_H])
  let ctx: Ctx = { pdf, page, font, bold, y: PAGE_H - MARGIN }

  const validUntil = new Date(data.offer.created_at)
  validUntil.setDate(validUntil.getDate() + 7)

  // ── Title ──
  ctx = drawTitle(ctx, 'CARTA DE OFERTA DE COMPRA')
  ctx = drawParagraph(ctx, `Panamá, ${fmtDate(data.offer.created_at)}`, { size: 10 })
  ctx = drawParagraph(
    ctx,
    `Ref: OFR-${data.offer.id.slice(0, 8).toUpperCase()}`,
    { size: 10 },
  )
  ctx = drawDivider(ctx)

  // ── Buyer ──
  ctx = drawHeading(ctx, 'OFERENTE (COMPRADOR)')
  ctx = drawKeyValue(ctx, 'Nombre completo:', data.buyer.full_name)
  if (data.buyer.phone) ctx = drawKeyValue(ctx, 'Teléfono:', data.buyer.phone)
  if (data.buyer.email) ctx = drawKeyValue(ctx, 'Email:', data.buyer.email)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  // ── Owner ──
  ctx = drawHeading(ctx, 'DESTINATARIO (PROPIETARIO)')
  ctx = drawKeyValue(ctx, 'Nombre:', data.owner.name ?? '[A determinar]')
  if (data.owner.phone) ctx = drawKeyValue(ctx, 'Teléfono:', data.owner.phone)
  if (data.owner.email) ctx = drawKeyValue(ctx, 'Email:', data.owner.email)
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  // ── Property ──
  ctx = drawHeading(ctx, 'INMUEBLE')
  ctx = drawKeyValue(ctx, 'Descripción:', data.property.title)
  const loc = [data.property.address, data.property.neighborhood, data.property.city]
    .filter(Boolean)
    .join(', ')
  if (loc) ctx = drawKeyValue(ctx, 'Ubicación:', loc)
  if (data.property.bedrooms != null)
    ctx = drawKeyValue(ctx, 'Dormitorios:', String(data.property.bedrooms))
  if (data.property.bathrooms != null)
    ctx = drawKeyValue(ctx, 'Baños:', String(data.property.bathrooms))
  if (data.property.area_m2 != null)
    ctx = drawKeyValue(ctx, 'Área:', `${data.property.area_m2} m²`)
  ctx = drawKeyValue(
    ctx,
    'Precio publicado:',
    fmtPrice(data.property.price, data.property.currency),
  )
  ctx = { ...ctx, y: ctx.y - 6 }
  ctx = drawDivider(ctx)

  // ── Offer ──
  ctx = drawHeading(ctx, 'TÉRMINOS DE LA OFERTA')

  // Highlight box for amount
  ctx = ensureSpace(ctx, 50)
  const boxY = ctx.y - 44
  ctx.page.drawRectangle({
    x: MARGIN,
    y: boxY,
    width: PAGE_W - MARGIN * 2,
    height: 44,
    color: rgb(0.97, 0.97, 0.97),
  })
  ctx.page.drawText('Monto ofrecido:', {
    x: MARGIN + 14,
    y: boxY + 26,
    size: 10,
    font: ctx.font,
    color: rgb(0.4, 0.4, 0.4),
  })
  ctx.page.drawText(fmtPrice(data.offer.amount, data.offer.currency), {
    x: MARGIN + 14,
    y: boxY + 8,
    size: 18,
    font: bold,
    color: rgb(0, 0, 0),
  })

  // Diff vs listed price
  if (data.property.price != null) {
    const diff = data.offer.amount - data.property.price
    const pct = (diff / data.property.price) * 100
    const diffStr = `${diff >= 0 ? '+' : ''}${fmtPrice(diff, data.offer.currency)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`
    ctx.page.drawText('vs. publicado:', {
      x: PAGE_W - MARGIN - 180,
      y: boxY + 26,
      size: 9,
      font: ctx.font,
      color: rgb(0.4, 0.4, 0.4),
    })
    ctx.page.drawText(diffStr, {
      x: PAGE_W - MARGIN - 180,
      y: boxY + 10,
      size: 11,
      font: bold,
      color: diff < 0 ? rgb(0.7, 0.2, 0.1) : rgb(0.1, 0.5, 0.2),
    })
  }
  ctx = { ...ctx, y: boxY - 10 }

  if (data.offer.conditions) {
    ctx = drawParagraph(ctx, 'Condiciones particulares:', { bold: true, size: 10 })
    ctx = drawParagraph(ctx, data.offer.conditions)
  }

  ctx = drawParagraph(
    ctx,
    `Vigencia: La presente oferta tiene validez hasta el ${fmtDate(validUntil.toISOString())}, salvo retiro escrito anterior por parte del oferente.`,
  )

  ctx = drawParagraph(
    ctx,
    `Sujeta a: (i) verificación documental del inmueble (paz y salvo nacional, paz y salvo municipal, certificado del Registro Público sin gravámenes), (ii) inspección física de la propiedad si aplica, (iii) firma de la promesa de compraventa con arras conforme a la práctica panameña.`,
  )

  ctx = drawParagraph(
    ctx,
    `Forma de cierre: Escritura pública ante notario público de la República de Panamá. Los gastos notariales y de registro se distribuirán según costumbre del mercado panameño, salvo acuerdo distinto entre las partes.`,
  )

  if (data.offer.notes) {
    ctx = { ...ctx, y: ctx.y - 4 }
    ctx = drawParagraph(ctx, 'Notas adicionales:', { bold: true, size: 10 })
    ctx = drawParagraph(ctx, data.offer.notes)
  }

  ctx = { ...ctx, y: ctx.y - 4 }
  ctx = drawDivider(ctx)

  // ── Footer ──
  ctx = drawHeading(ctx, 'PRESENTADA POR')
  ctx = drawKeyValue(ctx, 'Corredor:', data.brokerage.name)
  if (data.agent.name) ctx = drawKeyValue(ctx, 'Agente:', data.agent.name)
  if (data.agent.phone) ctx = drawKeyValue(ctx, 'Contacto:', data.agent.phone)

  ctx = { ...ctx, y: ctx.y - 12 }
  ctx = drawParagraph(
    ctx,
    `Esta carta de oferta es una propuesta formal del oferente al propietario y no constituye en sí misma un contrato vinculante de compraventa. La aceptación por parte del propietario obligará a las partes a otorgar la promesa de compraventa correspondiente.`,
    { size: 9 },
  )

  return pdf.save()
}

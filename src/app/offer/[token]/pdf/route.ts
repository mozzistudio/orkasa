import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildOfferPdf, type OfferPdfData } from '@/lib/offers/pdf-template'

export const dynamic = 'force-dynamic'

type RpcRow = {
  offer_id: string
  offer_amount: number
  offer_currency: string
  offer_conditions: string | null
  offer_notes: string | null
  offer_created_at: string
  offer_status: string
  buyer_full_name: string
  buyer_phone: string | null
  buyer_email: string | null
  property_title: string
  property_address: string | null
  property_neighborhood: string | null
  property_city: string | null
  property_price: number | null
  property_currency: string | null
  property_type: string
  property_bedrooms: number | null
  property_bathrooms: number | null
  property_area_m2: number | null
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  brokerage_name: string | null
  agent_full_name: string | null
  agent_phone: string | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: rows } = await supabase.rpc('offer_by_public_token', {
    p_token: token,
  })

  const row = (rows as RpcRow[] | null)?.[0]
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data: OfferPdfData = {
    offer: {
      id: row.offer_id,
      amount: Number(row.offer_amount),
      currency: row.offer_currency,
      conditions: row.offer_conditions,
      notes: row.offer_notes,
      created_at: row.offer_created_at,
      status: row.offer_status,
    },
    buyer: {
      full_name: row.buyer_full_name,
      phone: row.buyer_phone,
      email: row.buyer_email,
    },
    property: {
      title: row.property_title,
      address: row.property_address,
      neighborhood: row.property_neighborhood,
      city: row.property_city,
      price: row.property_price ? Number(row.property_price) : null,
      currency: row.property_currency,
      property_type: row.property_type,
      bedrooms: row.property_bedrooms,
      bathrooms: row.property_bathrooms ? Number(row.property_bathrooms) : null,
      area_m2: row.property_area_m2 ? Number(row.property_area_m2) : null,
    },
    owner: {
      name: row.owner_name,
      phone: row.owner_phone,
      email: row.owner_email,
    },
    brokerage: { name: row.brokerage_name ?? 'Orkasa' },
    agent: {
      name: row.agent_full_name,
      phone: row.agent_phone,
    },
  }

  const pdfBytes = await buildOfferPdf(data)
  const buf = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="oferta-${row.offer_id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}

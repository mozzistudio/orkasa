import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Meta verification handshake
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

type WhatsAppPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string }
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>
        messages?: Array<{
          id: string
          from: string
          timestamp: string
          type: string
          text?: { body: string }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
        }>
      }
    }>
  }>
}

export async function POST(request: NextRequest) {
  const supabase = serviceClient()

  let payload: WhatsAppPayload
  try {
    payload = (await request.json()) as WhatsAppPayload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Log raw event for debugging / replay
  await supabase.from('webhook_events').insert({
    provider: 'whatsapp_business',
    event_type: 'incoming',
    payload: payload as unknown as Json,
    received_at: new Date().toISOString(),
  })

  // Inbound messages are NOT tracked — the team handles incoming WhatsApp
  // manually on their phones. We only care about outbound delivery status
  // updates here.
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      if (!value) continue

      // Status updates for outbound messages
      for (const s of value.statuses ?? []) {
        const ts = new Date(parseInt(s.timestamp) * 1000).toISOString()
        const update: Database['public']['Tables']['messages']['Update'] = {
          status: s.status,
          ...(s.status === 'sent' && { sent_at: ts }),
          ...(s.status === 'delivered' && { delivered_at: ts }),
          ...(s.status === 'read' && { read_at: ts }),
          ...(s.status === 'failed' && { failed_at: ts }),
        }

        await supabase
          .from('messages')
          .update(update)
          .eq('channel', 'whatsapp')
          .eq('external_id', s.id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

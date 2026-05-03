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

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      if (!value) continue
      const phoneNumberId = value.metadata?.phone_number_id

      // Resolve brokerage by phone_number_id (lookup integrations.config)
      let brokerageId: string | null = null
      if (phoneNumberId) {
        const { data: integration } = await supabase
          .from('integrations')
          .select('brokerage_id, config')
          .eq('provider', 'whatsapp_business')
          .returns<
            Array<{
              brokerage_id: string
              config: { phone_number_id?: string } | null
            }>
          >()
        const match = integration?.find(
          (i) => i.config?.phone_number_id === phoneNumberId,
        )
        brokerageId = match?.brokerage_id ?? null
      }

      // Inbound messages
      for (const m of value.messages ?? []) {
        if (!brokerageId) continue
        const phone = m.from

        // Try to match an existing lead by phone
        const { data: lead } = await supabase
          .from('leads')
          .select('id')
          .eq('brokerage_id', brokerageId)
          .ilike('phone', `%${phone.slice(-8)}%`)
          .limit(1)
          .maybeSingle<{ id: string }>()

        await supabase.from('messages').insert({
          brokerage_id: brokerageId,
          lead_id: lead?.id ?? null,
          channel: 'whatsapp',
          direction: 'inbound',
          status: 'received',
          external_id: m.id,
          from_address: phone,
          body: m.text?.body ?? null,
          metadata: { type: m.type, timestamp: m.timestamp } as Json,
        })

        if (lead?.id) {
          await supabase.from('lead_interactions').insert({
            lead_id: lead.id,
            type: 'whatsapp_inbound',
            content: m.text?.body ?? '(media)',
          })
        }
      }

      // Status updates
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

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type ResendEvent = {
  type:
    | 'email.sent'
    | 'email.delivered'
    | 'email.opened'
    | 'email.bounced'
    | 'email.complained'
  data: {
    email_id: string
    to: string[]
    from: string
    subject: string
    created_at: string
  }
}

const STATUS_MAP: Record<ResendEvent['type'], string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'read',
  'email.bounced': 'failed',
  'email.complained': 'failed',
}

export async function POST(request: NextRequest) {
  const supabase = serviceClient()

  let payload: ResendEvent
  try {
    payload = (await request.json()) as ResendEvent
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  await supabase.from('webhook_events').insert({
    provider: 'resend',
    event_type: payload.type,
    external_id: payload.data?.email_id ?? null,
    payload: payload as unknown as Json,
    received_at: new Date().toISOString(),
  })

  const newStatus = STATUS_MAP[payload.type]
  if (!newStatus || !payload.data?.email_id) {
    return NextResponse.json({ ok: true })
  }

  const now = new Date().toISOString()
  const update: Database['public']['Tables']['messages']['Update'] = {
    status: newStatus,
    ...(payload.type === 'email.sent' && { sent_at: now }),
    ...(payload.type === 'email.delivered' && { delivered_at: now }),
    ...(payload.type === 'email.opened' && { read_at: now }),
    ...((payload.type === 'email.bounced' ||
      payload.type === 'email.complained') && { failed_at: now }),
  }

  await supabase
    .from('messages')
    .update(update)
    .eq('channel', 'email')
    .eq('external_id', payload.data.email_id)

  return NextResponse.json({ ok: true })
}

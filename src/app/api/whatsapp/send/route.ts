import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/messaging/service'

const schema = z.object({
  leadId: z.string().uuid(),
  body: z.string().max(4000).optional(),
  templateCode: z.string().max(80).optional(),
  templateVars: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'invalid_input' },
      { status: 400 },
    )
  }
  if (!parsed.data.body && !parsed.data.templateCode) {
    return NextResponse.json(
      { error: 'body_or_template_required' },
      { status: 400 },
    )
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('id, phone, brokerage_id')
    .eq('id', parsed.data.leadId)
    .maybeSingle<{ id: string; phone: string | null; brokerage_id: string }>()

  if (!lead?.phone) {
    return NextResponse.json(
      { error: 'lead_missing_phone' },
      { status: 400 },
    )
  }

  const result = await sendWhatsApp({
    brokerageId: lead.brokerage_id,
    leadId: lead.id,
    agentId: user.id,
    to: lead.phone,
    body: parsed.data.body,
    templateCode: parsed.data.templateCode,
    templateVars: parsed.data.templateVars,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'send_failed', messageId: result.messageId },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    externalId: result.externalId,
  })
}

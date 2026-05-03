import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/messaging/service'

const schema = z.object({
  leadId: z.string().uuid().optional(),
  to: z.string().email(),
  from: z.string().email().optional(),
  subject: z.string().min(1).max(255),
  html: z.string().max(100_000).optional(),
  text: z.string().max(20_000).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) {
    return NextResponse.json({ error: 'no_brokerage' }, { status: 400 })
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
  if (!parsed.data.html && !parsed.data.text) {
    return NextResponse.json(
      { error: 'html_or_text_required' },
      { status: 400 },
    )
  }

  const result = await sendEmail({
    brokerageId: agent.brokerage_id,
    leadId: parsed.data.leadId ?? null,
    agentId: user.id,
    to: parsed.data.to,
    from: parsed.data.from,
    subject: parsed.data.subject,
    html: parsed.data.html,
    text: parsed.data.text,
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

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOAuthAuthUrl } from '@/lib/calendar/service'
import type { CalendarProvider } from '@/lib/calendar/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const provider = request.nextUrl.searchParams.get('provider') as
    | CalendarProvider
    | null
  if (
    !provider ||
    (provider !== 'google_calendar' && provider !== 'outlook_calendar')
  ) {
    return NextResponse.json({ error: 'invalid_provider' }, { status: 400 })
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) {
    return NextResponse.json({ error: 'no_brokerage' }, { status: 400 })
  }

  // Pre-create the integration row to track the OAuth attempt
  await supabase
    .from('integrations')
    .upsert(
      {
        brokerage_id: agent.brokerage_id,
        provider,
        status: 'connecting',
      },
      { onConflict: 'brokerage_id,provider' },
    )

  const state = Buffer.from(
    JSON.stringify({ b: agent.brokerage_id, u: user.id, t: Date.now() }),
  ).toString('base64url')

  const url = getOAuthAuthUrl(provider, state)
  return NextResponse.redirect(url)
}

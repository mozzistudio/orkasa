import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import { exchangeGoogleCode } from '@/lib/calendar/google'
import { exchangeOutlookCode } from '@/lib/calendar/outlook'
import type { CalendarProvider } from '@/lib/calendar/types'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function decodeState(
  state: string,
): { brokerageId: string; userId: string } | null {
  try {
    const json = JSON.parse(
      Buffer.from(state, 'base64url').toString('utf8'),
    ) as { b: string; u: string; t: number }
    return { brokerageId: json.b, userId: json.u }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')

  // Provider is encoded in the path? We use a query param `provider` instead
  // because both Google + Outlook hit the same callback URL.
  const provider = params.get('provider') as CalendarProvider | null

  const redirectBase = new URL('/app/integrations', request.url)

  if (error || !code || !state || !provider) {
    redirectBase.searchParams.set('calendar_error', error ?? 'oauth_failed')
    return NextResponse.redirect(redirectBase)
  }

  const decoded = decodeState(state)
  if (!decoded) {
    redirectBase.searchParams.set('calendar_error', 'invalid_state')
    return NextResponse.redirect(redirectBase)
  }

  const tokens =
    provider === 'google_calendar'
      ? await exchangeGoogleCode(code)
      : await exchangeOutlookCode(code)

  if (!tokens) {
    redirectBase.searchParams.set('calendar_error', 'token_exchange_failed')
    return NextResponse.redirect(redirectBase)
  }

  const supabase = serviceClient()
  await supabase
    .from('integrations')
    .upsert(
      {
        brokerage_id: decoded.brokerageId,
        provider,
        status: 'connected',
        credentials: tokens as unknown as Json,
        config: { calendar_id: 'primary' } as Json,
        account_label: tokens.account_email ?? null,
        last_synced_at: new Date().toISOString(),
        error_count: 0,
        last_error: null,
      },
      { onConflict: 'brokerage_id,provider' },
    )

  redirectBase.searchParams.set('calendar_connected', provider)
  return NextResponse.redirect(redirectBase)
}

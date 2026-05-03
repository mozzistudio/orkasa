import type {
  CalendarEventInput,
  CalendarEventResult,
  CalendarTokens,
} from './types'

const MS_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const MS_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const SCOPES = ['Calendars.ReadWrite', 'User.Read', 'offline_access']

export function buildOutlookAuthUrl(state: string): string {
  const url = new URL(MS_AUTH_URL)
  url.searchParams.set('client_id', process.env.OUTLOOK_CLIENT_ID ?? '')
  url.searchParams.set(
    'redirect_uri',
    process.env.OUTLOOK_REDIRECT_URI ?? '',
  )
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('response_mode', 'query')
  url.searchParams.set('scope', SCOPES.join(' '))
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeOutlookCode(
  code: string,
): Promise<CalendarTokens | null> {
  if (
    !process.env.OUTLOOK_CLIENT_ID ||
    !process.env.OUTLOOK_CLIENT_SECRET ||
    !process.env.OUTLOOK_REDIRECT_URI
  )
    return null

  const params = new URLSearchParams({
    code,
    client_id: process.env.OUTLOOK_CLIENT_ID,
    client_secret: process.env.OUTLOOK_CLIENT_SECRET,
    redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: SCOPES.join(' '),
  })

  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  if (!res.ok) return null

  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
  }

  let accountEmail: string | undefined
  try {
    const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (meRes.ok) {
      const me = (await meRes.json()) as {
        mail?: string
        userPrincipalName?: string
      }
      accountEmail = me.mail ?? me.userPrincipalName
    }
  } catch {}

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    scope: data.scope,
    account_email: accountEmail,
  }
}

export async function createOutlookEvent(
  tokens: CalendarTokens,
  input: CalendarEventInput,
): Promise<CalendarEventResult> {
  const start = new Date(input.startsAt)
  const end = new Date(start.getTime() + input.durationMinutes * 60_000)

  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify({
      subject: input.title,
      body: {
        contentType: 'text',
        content: input.description ?? '',
      },
      location: input.location ? { displayName: input.location } : undefined,
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: 'UTC' },
      attendees: (input.attendeeEmails ?? []).map((email) => ({
        emailAddress: { address: email },
        type: 'required',
      })),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return { ok: false, error: `outlook_${res.status}: ${text.slice(0, 200)}` }
  }
  const data = (await res.json()) as { id?: string }
  return { ok: true, externalEventId: data.id }
}

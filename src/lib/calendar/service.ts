import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import {
  buildGoogleAuthUrl,
  createGoogleEvent,
  refreshGoogleToken,
} from './google'
import { buildOutlookAuthUrl, createOutlookEvent } from './outlook'
import type {
  CalendarEventInput,
  CalendarEventResult,
  CalendarProvider,
  CalendarTokens,
} from './types'

type IntegrationRow = Database['public']['Tables']['integrations']['Row']

export function getOAuthAuthUrl(
  provider: CalendarProvider,
  state: string,
): string {
  if (provider === 'google_calendar') return buildGoogleAuthUrl(state)
  return buildOutlookAuthUrl(state)
}

async function loadCalendarIntegration(
  brokerageId: string,
  provider: CalendarProvider,
): Promise<IntegrationRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('brokerage_id', brokerageId)
    .eq('provider', provider)
    .maybeSingle<IntegrationRow>()
  return data
}

async function ensureFreshTokens(
  integration: IntegrationRow,
): Promise<CalendarTokens | null> {
  const credentials = (integration.credentials as
    | CalendarTokens
    | null) ?? null
  if (!credentials?.access_token) return null

  if (
    integration.provider === 'google_calendar' &&
    credentials.refresh_token &&
    credentials.expires_at &&
    new Date(credentials.expires_at).getTime() < Date.now() + 60_000
  ) {
    const refreshed = await refreshGoogleToken(credentials.refresh_token)
    if (refreshed) {
      const supabase = await createClient()
      await supabase
        .from('integrations')
        .update({
          credentials: refreshed as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
      return refreshed
    }
  }

  return credentials
}

export async function syncViewingToCalendar(input: {
  brokerageId: string
  viewingId: string
}): Promise<CalendarEventResult & { provider?: CalendarProvider }> {
  const supabase = await createClient()

  // Prefer Google, fall back to Outlook
  const google = await loadCalendarIntegration(
    input.brokerageId,
    'google_calendar',
  )
  const outlook =
    !google || google.status !== 'connected'
      ? await loadCalendarIntegration(input.brokerageId, 'outlook_calendar')
      : null

  const integration =
    google?.status === 'connected'
      ? google
      : outlook?.status === 'connected'
        ? outlook
        : null
  if (!integration) {
    return { ok: false, error: 'no_calendar_connected' }
  }

  const tokens = await ensureFreshTokens(integration)
  if (!tokens) return { ok: false, error: 'invalid_tokens' }

  const { data: viewing } = await supabase
    .from('viewings')
    .select(
      'id, scheduled_at, duration_minutes, notes, lead_id, property_id',
    )
    .eq('id', input.viewingId)
    .maybeSingle<{
      id: string
      scheduled_at: string
      duration_minutes: number
      notes: string | null
      lead_id: string
      property_id: string
    }>()
  if (!viewing) return { ok: false, error: 'viewing_not_found' }

  const [{ data: lead }, { data: property }] = await Promise.all([
    supabase
      .from('leads')
      .select('full_name, email')
      .eq('id', viewing.lead_id)
      .maybeSingle<{ full_name: string; email: string | null }>(),
    supabase
      .from('properties')
      .select('title, address')
      .eq('id', viewing.property_id)
      .maybeSingle<{ title: string; address: string | null }>(),
  ])

  const config = (integration.config as { calendar_id?: string } | null) ?? {}
  const calendarId = config.calendar_id ?? 'primary'

  const eventInput: CalendarEventInput = {
    externalCalendarId: calendarId,
    title: `Visita: ${property?.title ?? 'Propiedad'} · ${lead?.full_name ?? 'Lead'}`,
    description: viewing.notes ?? undefined,
    startsAt: viewing.scheduled_at,
    durationMinutes: viewing.duration_minutes,
    attendeeEmails: lead?.email ? [lead.email] : [],
    location: property?.address ?? undefined,
  }

  const result =
    integration.provider === 'google_calendar'
      ? await createGoogleEvent(tokens, eventInput)
      : await createOutlookEvent(tokens, eventInput)

  if (result.ok && result.externalEventId) {
    await supabase
      .from('viewings')
      .update({
        external_calendar_id: calendarId,
        external_event_id: result.externalEventId,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', viewing.id)
  }

  return {
    ...result,
    provider: integration.provider as CalendarProvider,
  }
}

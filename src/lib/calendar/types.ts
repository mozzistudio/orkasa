export type CalendarProvider = 'google_calendar' | 'outlook_calendar'

export type CalendarEventInput = {
  externalCalendarId: string
  title: string
  description?: string
  startsAt: string
  durationMinutes: number
  attendeeEmails?: string[]
  location?: string
}

export type CalendarEventResult = {
  ok: boolean
  externalEventId?: string
  error?: string
}

export type CalendarTokens = {
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
  account_email?: string
}

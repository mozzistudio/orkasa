import type { EmailProvider, EmailSendInput, SendResult } from './types'

class UnconfiguredEmail implements EmailProvider {
  readonly id = 'email_unconfigured' as const
  async send(_input: EmailSendInput): Promise<SendResult> {
    return {
      ok: false,
      status: 'failed',
      error: 'email_not_configured',
    }
  }
}

class ResendProvider implements EmailProvider {
  readonly id = 'resend' as const

  constructor(
    private readonly apiKey: string,
    private readonly defaultFrom: string,
  ) {}

  async send(input: EmailSendInput): Promise<SendResult> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: input.from ?? this.defaultFrom,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return {
          ok: false,
          status: 'failed',
          error: `resend_api_${res.status}: ${text.slice(0, 200)}`,
        }
      }
      const data = (await res.json()) as { id?: string }
      return { ok: true, status: 'sent', externalId: data.id }
    } catch (err) {
      return {
        ok: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown_error',
      }
    }
  }
}

class SendGridProvider implements EmailProvider {
  readonly id = 'sendgrid' as const

  constructor(
    private readonly apiKey: string,
    private readonly defaultFrom: string,
  ) {}

  async send(input: EmailSendInput): Promise<SendResult> {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: input.to }] }],
          from: { email: input.from ?? this.defaultFrom },
          subject: input.subject,
          content: [
            ...(input.text
              ? [{ type: 'text/plain', value: input.text }]
              : []),
            ...(input.html
              ? [{ type: 'text/html', value: input.html }]
              : []),
          ],
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return {
          ok: false,
          status: 'failed',
          error: `sendgrid_api_${res.status}: ${text.slice(0, 200)}`,
        }
      }
      const externalId = res.headers.get('x-message-id') ?? undefined
      return { ok: true, status: 'sent', externalId }
    } catch (err) {
      return {
        ok: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown_error',
      }
    }
  }
}

export function getEmailProvider(input?: {
  provider?: 'resend' | 'sendgrid'
  api_key?: string
  from_address?: string
}): EmailProvider {
  if (!input?.api_key || !input.from_address) return new UnconfiguredEmail()
  if (input.provider === 'sendgrid') {
    return new SendGridProvider(input.api_key, input.from_address)
  }
  return new ResendProvider(input.api_key, input.from_address)
}

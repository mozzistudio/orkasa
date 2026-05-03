import type {
  WhatsAppProvider,
  WhatsAppSendInput,
  SendResult,
} from './types'

class UnconfiguredWhatsApp implements WhatsAppProvider {
  readonly id = 'whatsapp_unconfigured' as const
  async send(_input: WhatsAppSendInput): Promise<SendResult> {
    return {
      ok: false,
      status: 'failed',
      error: 'whatsapp_not_configured',
    }
  }
}

class WhatsAppBusiness implements WhatsAppProvider {
  readonly id = 'whatsapp_business' as const

  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
  ) {}

  async send(input: WhatsAppSendInput): Promise<SendResult> {
    if (!input.to) {
      return { ok: false, status: 'failed', error: 'missing_to' }
    }

    const phone = input.to.replace(/[^\d]/g, '')

    let payload: Record<string, unknown>
    if (input.templateCode) {
      payload = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: input.templateCode,
          language: { code: 'es' },
          components: input.templateVars
            ? [
                {
                  type: 'body',
                  parameters: Object.values(input.templateVars).map((v) => ({
                    type: 'text',
                    text: String(v),
                  })),
                },
              ]
            : undefined,
        },
      }
    } else {
      payload = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: input.body ?? '' },
      }
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const text = await res.text()
        return {
          ok: false,
          status: 'failed',
          error: `whatsapp_api_${res.status}: ${text.slice(0, 200)}`,
        }
      }

      const data = (await res.json()) as {
        messages?: Array<{ id: string }>
      }
      const externalId = data.messages?.[0]?.id

      return {
        ok: true,
        status: 'sent',
        externalId,
      }
    } catch (err) {
      return {
        ok: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown_error',
      }
    }
  }
}

export function getWhatsAppProvider(credentials?: {
  access_token?: string
  phone_number_id?: string
}): WhatsAppProvider {
  if (credentials?.access_token && credentials.phone_number_id) {
    return new WhatsAppBusiness(
      credentials.access_token,
      credentials.phone_number_id,
    )
  }
  return new UnconfiguredWhatsApp()
}

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import { getWhatsAppProvider } from './whatsapp'
import { getEmailProvider } from './email'
import type { SendResult } from './types'

type MessageInsert = Database['public']['Tables']['messages']['Insert']

type SendWhatsAppInput = {
  brokerageId: string
  leadId?: string | null
  agentId?: string | null
  to: string
  body?: string
  templateCode?: string
  templateVars?: Record<string, string | number>
}

type SendEmailInput = {
  brokerageId: string
  leadId?: string | null
  agentId?: string | null
  to: string
  from?: string
  subject: string
  html?: string
  text?: string
}

async function loadCredentials(
  brokerageId: string,
  provider: 'whatsapp_business' | 'resend' | 'sendgrid',
): Promise<Record<string, string> | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('credentials, status, config')
    .eq('brokerage_id', brokerageId)
    .eq('provider', provider)
    .eq('status', 'connected')
    .maybeSingle<{
      credentials: Record<string, string> | null
      status: string
      config: Record<string, string> | null
    }>()
  if (!data) return null
  return {
    ...(data.credentials ?? {}),
    ...(data.config ?? {}),
  }
}

export async function sendWhatsApp(
  input: SendWhatsAppInput,
): Promise<SendResult & { messageId?: string }> {
  const supabase = await createClient()

  const { data: msg } = await supabase
    .from('messages')
    .insert({
      brokerage_id: input.brokerageId,
      lead_id: input.leadId ?? null,
      agent_id: input.agentId ?? null,
      channel: 'whatsapp',
      direction: 'outbound',
      status: 'pending',
      to_address: input.to,
      body: input.body ?? null,
      template_code: input.templateCode ?? null,
      metadata: (input.templateVars ?? {}) as Json,
    } satisfies MessageInsert)
    .select('id')
    .single<{ id: string }>()

  const messageId = msg?.id

  const credentials = await loadCredentials(
    input.brokerageId,
    'whatsapp_business',
  )
  const provider = getWhatsAppProvider(credentials ?? undefined)
  const result = await provider.send({
    to: input.to,
    body: input.body,
    templateCode: input.templateCode,
    templateVars: input.templateVars,
  })

  if (messageId) {
    await supabase
      .from('messages')
      .update({
        status: result.ok ? 'sent' : 'failed',
        external_id: result.externalId ?? null,
        error_message: result.error ?? null,
        sent_at: result.ok ? new Date().toISOString() : null,
        failed_at: !result.ok ? new Date().toISOString() : null,
      })
      .eq('id', messageId)
  }

  return { ...result, messageId }
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendResult & { messageId?: string }> {
  const supabase = await createClient()

  const { data: msg } = await supabase
    .from('messages')
    .insert({
      brokerage_id: input.brokerageId,
      lead_id: input.leadId ?? null,
      agent_id: input.agentId ?? null,
      channel: 'email',
      direction: 'outbound',
      status: 'pending',
      to_address: input.to,
      from_address: input.from ?? null,
      subject: input.subject,
      body: input.text ?? null,
      metadata: { html: !!input.html } as Json,
    } satisfies MessageInsert)
    .select('id')
    .single<{ id: string }>()

  const messageId = msg?.id

  const resendCreds = await loadCredentials(input.brokerageId, 'resend')
  const sendgridCreds = !resendCreds
    ? await loadCredentials(input.brokerageId, 'sendgrid')
    : null

  const provider = getEmailProvider(
    resendCreds
      ? { provider: 'resend', ...resendCreds }
      : sendgridCreds
        ? { provider: 'sendgrid', ...sendgridCreds }
        : undefined,
  )

  const result = await provider.send({
    to: input.to,
    from: input.from,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })

  if (messageId) {
    await supabase
      .from('messages')
      .update({
        status: result.ok ? 'sent' : 'failed',
        external_id: result.externalId ?? null,
        error_message: result.error ?? null,
        sent_at: result.ok ? new Date().toISOString() : null,
        failed_at: !result.ok ? new Date().toISOString() : null,
      })
      .eq('id', messageId)
  }

  return { ...result, messageId }
}

export async function getIntegrationStatus(brokerageId: string): Promise<{
  whatsapp: boolean
  email: boolean
  googleCalendar: boolean
  outlookCalendar: boolean
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('provider, status')
    .eq('brokerage_id', brokerageId)
    .eq('status', 'connected')
    .returns<Array<{ provider: string; status: string }>>()

  const providers = new Set((data ?? []).map((i) => i.provider))
  return {
    whatsapp: providers.has('whatsapp_business'),
    email: providers.has('resend') || providers.has('sendgrid'),
    googleCalendar: providers.has('google_calendar'),
    outlookCalendar: providers.has('outlook_calendar'),
  }
}

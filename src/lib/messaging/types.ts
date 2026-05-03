export type MessageChannel = 'whatsapp' | 'email' | 'sms' | 'internal'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'received'

export type SendResult = {
  ok: boolean
  externalId?: string
  status?: MessageStatus
  error?: string
}

export type WhatsAppSendInput = {
  to: string
  body?: string
  templateCode?: string
  templateVars?: Record<string, string | number>
  attachments?: Array<{ url: string; filename?: string }>
}

export type EmailSendInput = {
  to: string
  from?: string
  subject: string
  html?: string
  text?: string
  attachments?: Array<{ filename: string; url: string }>
}

export interface WhatsAppProvider {
  readonly id: 'whatsapp_business' | 'whatsapp_unconfigured'
  send(input: WhatsAppSendInput): Promise<SendResult>
}

export interface EmailProvider {
  readonly id: 'resend' | 'sendgrid' | 'email_unconfigured'
  send(input: EmailSendInput): Promise<SendResult>
}

export type IntegrationConfig = {
  configured: boolean
  provider?: string
  accountLabel?: string | null
}

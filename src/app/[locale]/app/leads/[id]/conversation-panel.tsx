'use client'

import { useEffect, useState } from 'react'
import {
  MessageCircle,
  Mail,
  Send,
  Check,
  CheckCheck,
  AlertCircle,
  Inbox,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  channel: 'whatsapp' | 'email' | 'sms' | 'internal'
  direction: 'inbound' | 'outbound'
  status: string
  subject: string | null
  body: string | null
  template_code: string | null
  from_address: string | null
  to_address: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  error_message: string | null
  created_at: string
}

const CHANNEL_META: Record<
  Message['channel'],
  { label: string; Icon: typeof MessageCircle; color: string }
> = {
  whatsapp: {
    label: 'WhatsApp',
    Icon: MessageCircle,
    color: 'text-emerald-700',
  },
  email: { label: 'Email', Icon: Mail, color: 'text-ink' },
  sms: { label: 'SMS', Icon: MessageCircle, color: 'text-ink' },
  internal: { label: 'Nota interna', Icon: MessageCircle, color: 'text-steel' },
}

function statusBadge(status: string, error: string | null) {
  if (error || status === 'failed') {
    return (
      <span className="flex items-center gap-1 text-signal">
        <AlertCircle className="h-3 w-3" strokeWidth={2} />
        Falló
      </span>
    )
  }
  if (status === 'read') {
    return (
      <span className="flex items-center gap-1 text-emerald-700">
        <CheckCheck className="h-3 w-3" strokeWidth={2} />
        Leído
      </span>
    )
  }
  if (status === 'delivered') {
    return (
      <span className="flex items-center gap-1 text-steel">
        <CheckCheck className="h-3 w-3" strokeWidth={1.5} />
        Entregado
      </span>
    )
  }
  if (status === 'sent') {
    return (
      <span className="flex items-center gap-1 text-steel">
        <Check className="h-3 w-3" strokeWidth={1.5} />
        Enviado
      </span>
    )
  }
  if (status === 'received') {
    return (
      <span className="flex items-center gap-1 text-steel">
        <Inbox className="h-3 w-3" strokeWidth={1.5} />
        Recibido
      </span>
    )
  }
  return (
    <span className="font-mono uppercase tracking-[1.2px] text-[9px] text-steel">
      {status}
    </span>
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'HOY'
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'AYER'
  return d
    .toLocaleDateString('es-PA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .toUpperCase()
}

export function ConversationPanel({
  leadId,
  initialMessages,
}: {
  leadId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`lead-messages:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${leadId}`,
        },
        async () => {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true })
            .returns<Message[]>()
          setMessages(data ?? [])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId])

  if (messages.length === 0) {
    return (
      <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
        <header className="px-5 py-3.5 border-b border-bone flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-steel" strokeWidth={1.5} />
          <h2 className="text-[13px] font-medium text-ink">Conversaciones</h2>
        </header>
        <div className="px-5 py-8 text-center text-[13px] text-steel">
          Sin mensajes aún. Envía un WhatsApp o email para iniciar la
          conversación.
        </div>
      </section>
    )
  }

  let currentDay = ''
  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <header className="px-5 py-3.5 border-b border-bone flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-steel" strokeWidth={1.5} />
        <h2 className="text-[13px] font-medium text-ink">
          Conversaciones
          <span className="ml-2 font-mono text-[10px] tabular-nums text-steel">
            {messages.length}
          </span>
        </h2>
      </header>
      <div className="px-5 py-4 space-y-1">
        {messages.map((msg) => {
          const meta = CHANNEL_META[msg.channel]
          const Icon = meta.Icon
          const isOutbound = msg.direction === 'outbound'
          const dayLabel = formatDayLabel(msg.created_at)
          const showDayDivider = dayLabel !== currentDay
          currentDay = dayLabel

          return (
            <div key={msg.id}>
              {showDayDivider && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-bone" />
                  <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
                    {dayLabel}
                  </span>
                  <div className="flex-1 h-px bg-bone" />
                </div>
              )}
              <div
                className={`flex ${
                  isOutbound ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-[6px] px-3 py-2 ${
                    isOutbound
                      ? 'bg-ink text-paper'
                      : 'bg-bone-soft text-ink border border-bone'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 mb-1 font-mono text-[9px] uppercase tracking-[1.2px] ${
                      isOutbound ? 'text-paper/60' : meta.color
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5" strokeWidth={2} />
                    {meta.label}
                    {msg.template_code && (
                      <span className="ml-1 opacity-70">
                        · {msg.template_code}
                      </span>
                    )}
                  </div>
                  {msg.subject && (
                    <p className="text-[12px] font-medium mb-1">
                      {msg.subject}
                    </p>
                  )}
                  <p className="text-[13px] whitespace-pre-wrap leading-snug">
                    {msg.body || (
                      <span className="opacity-60">(Sin contenido)</span>
                    )}
                  </p>
                  {msg.error_message && (
                    <p className="mt-1.5 text-[11px] text-signal">
                      {msg.error_message}
                    </p>
                  )}
                  <div
                    className={`mt-1.5 flex items-center justify-between gap-3 font-mono text-[10px] tabular-nums ${
                      isOutbound ? 'text-paper/60' : 'text-steel'
                    }`}
                  >
                    <span>{formatTime(msg.created_at)}</span>
                    {isOutbound &&
                      statusBadge(msg.status, msg.error_message)}
                    {!isOutbound && msg.from_address && (
                      <span className="truncate max-w-[120px]">
                        {msg.from_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

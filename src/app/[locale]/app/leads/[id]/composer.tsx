'use client'

import { useRef, useState, useTransition } from 'react'
import {
  Phone,
  Mail,
  Calendar,
  Plus,
  StickyNote,
} from 'lucide-react'
import { addLeadInteraction } from '../actions'

const TABS = [
  { key: 'note', label: 'Nota', icon: StickyNote },
  { key: 'call', label: 'Llamada', icon: Phone },
  { key: 'whatsapp', label: 'WhatsApp', icon: null },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'visit', label: 'Visita', icon: Calendar },
] as const

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  )
}

export function Composer({ leadId }: { leadId: string }) {
  const [type, setType] = useState<string>('note')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('type', type)
    startTransition(async () => {
      const result = await addLeadInteraction(leadId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
    })
  }

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="flex border-b border-bone bg-paper-warm p-1 gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setType(tab.key)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] inline-flex items-center gap-1.5 transition-colors ${
              type === tab.key
                ? 'bg-white text-ink shadow-xs'
                : 'text-steel hover:text-ink'
            }`}
          >
            {tab.key === 'whatsapp' ? (
              <WhatsAppIcon className="h-[11px] w-[11px]" />
            ) : tab.icon ? (
              <tab.icon className="h-[11px] w-[11px]" strokeWidth={1.5} />
            ) : null}
            {tab.label}
          </button>
        ))}
      </div>

      <form ref={formRef} action={handleSubmit} className="px-4 pt-3.5 pb-4">
        <textarea
          name="content"
          required
          placeholder="Escribí lo que pasó: contexto, próximos pasos, lo que dijo el cliente..."
          className="w-full border-none bg-transparent outline-none text-[13px] text-ink leading-relaxed resize-none min-h-[60px] placeholder:text-steel-soft"
          rows={3}
        />
        {error && (
          <p className="mt-2 rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[11px] text-steel">⌘ Enter para guardar</span>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 bg-ink text-white px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium hover:bg-coal transition-colors disabled:opacity-60"
          >
            <Plus className="h-[11px] w-[11px]" strokeWidth={1.6} />
            {pending ? '…' : 'Agregar'}
          </button>
        </div>
      </form>
    </section>
  )
}

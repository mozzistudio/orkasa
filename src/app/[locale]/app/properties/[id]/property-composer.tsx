'use client'

import { useState } from 'react'
import { Calendar, StickyNote } from 'lucide-react'

const TABS = [
  { key: 'share', label: 'Compartir', icon: null },
  { key: 'note', label: 'Nota interna', icon: StickyNote },
  { key: 'visit', label: 'Programar visita', icon: Calendar },
] as const

const PLACEHOLDERS: Record<string, string> = {
  share:
    'Compartir esta propiedad por WhatsApp con un cliente · empezá a tipear el nombre...',
  note: 'Escribí una nota interna sobre esta propiedad...',
  visit: 'Nombre del cliente y fecha/hora para la visita...',
}

const SUBMIT_LABELS: Record<string, string> = {
  share: 'Compartir',
  note: 'Agregar',
  visit: 'Agendar',
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  )
}

export function PropertyComposer({
  propertyId: _propertyId,
}: {
  propertyId: string
}) {
  const [tab, setTab] = useState<string>('share')

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden shadow-xs">
      <div className="flex border-b border-bone bg-paper-warm p-1 gap-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] inline-flex items-center gap-1.5 transition-colors ${
              tab === t.key
                ? 'bg-white text-ink shadow-xs'
                : 'text-steel hover:text-ink'
            }`}
          >
            {t.key === 'share' ? (
              <WhatsAppIcon className="h-[11px] w-[11px]" />
            ) : t.icon ? (
              <t.icon className="h-[11px] w-[11px]" strokeWidth={1.5} />
            ) : null}
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-3.5 pb-4">
        <textarea
          placeholder={PLACEHOLDERS[tab]}
          className="w-full border-none bg-transparent outline-none text-[13px] text-ink leading-relaxed resize-none min-h-[60px] placeholder:text-steel-soft"
          rows={3}
        />
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[11px] text-steel">⌘ Enter para enviar</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-ink text-white px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium hover:bg-coal transition-colors"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path d="M3 8l4 4 7-9" />
            </svg>
            {SUBMIT_LABELS[tab]}
          </button>
        </div>
      </div>
    </section>
  )
}

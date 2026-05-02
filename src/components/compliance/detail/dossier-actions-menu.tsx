'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { RejectDealModal } from './reject-deal-modal'

export function DossierActionsMenu({ checkId }: { checkId: string }) {
  const [open, setOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const items: Array<{
    label: string
    onClick: () => void
    danger?: boolean
  }> = [
    { label: 'Reasignar agente', onClick: () => alert('Coming soon — V2') },
    { label: 'Mantener en espera', onClick: () => alert('Coming soon — V2') },
    { label: 'Pedir segunda opinión', onClick: () => alert('Coming soon — V2') },
    {
      label: 'Rechazar deal',
      onClick: () => {
        setOpen(false)
        setRejectOpen(true)
      },
      danger: true,
    },
    { label: 'Ver historial completo', onClick: () => alert('Coming soon — V2') },
    { label: 'Exportar dossier (PDF)', onClick: () => alert('Coming soon — V2') },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Más acciones"
        className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] border border-bone bg-paper text-steel hover:border-steel-soft hover:text-ink"
      >
        <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-30 w-56 rounded-[6px] border border-bone bg-paper py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick()
                if (!item.danger) setOpen(false)
              }}
              className={`block w-full px-3 py-1.5 text-left text-[12px] hover:bg-bone-soft ${
                item.danger ? 'text-signal-deep' : 'text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {rejectOpen && (
        <RejectDealModal
          checkId={checkId}
          onClose={() => setRejectOpen(false)}
        />
      )}
    </div>
  )
}

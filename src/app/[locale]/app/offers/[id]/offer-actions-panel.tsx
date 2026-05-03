'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FileText, X } from 'lucide-react'
import { updateOfferStatus } from '../actions'
import { buildReminderUrl } from '@/lib/whatsapp-templates'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  countered: 'Contraoferta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  withdrawn: 'Retirada',
}

function fmtMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function OfferActionsPanel({
  offerId,
  status,
  ownerName,
  ownerPhone,
  propertyTitle,
  buyerName,
  amount,
  currency,
  publicToken,
}: {
  offerId: string
  status: string
  ownerName: string | null
  ownerPhone: string | null
  propertyTitle: string
  buyerName: string
  amount: number
  currency: string
  publicToken: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isFinal =
    status === 'accepted' ||
    status === 'rejected' ||
    status === 'expired' ||
    status === 'withdrawn'

  function handleStatusChange(newStatus: string) {
    setError(null)
    if (newStatus === 'rejected' || newStatus === 'withdrawn') {
      if (!confirm(`¿Confirmar marcar la oferta como ${STATUS_LABEL[newStatus]}?`))
        return
    }
    startTransition(async () => {
      const result = await updateOfferStatus(offerId, newStatus)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function handleSendToOwner() {
    if (!ownerPhone || !publicToken) return
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${baseUrl}/offer/${publicToken}/pdf`
    const message = `Hola${ownerName ? ` ${ownerName}` : ''}, te escribo de Orkasa. Recibimos una oferta formal de ${fmtMoney(amount, currency)} por el ${propertyTitle} de parte de ${buyerName}.\n\nTe paso la carta de oferta acá: ${link}\n\n¿Cuándo te queda bien que conversemos para revisar las condiciones?`
    window.open(buildReminderUrl(ownerPhone, message), '_blank')
  }

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5">
        <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
          Acciones
        </h3>
      </div>
      <div className="px-4 pb-3.5 space-y-2">
        {!isFinal && ownerPhone && publicToken && (
          <button
            type="button"
            onClick={handleSendToOwner}
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[6px] bg-whatsapp text-white text-[12px] font-medium hover:bg-whatsapp-deep transition-colors disabled:opacity-50"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
            </svg>
            Enviar al propietario
          </button>
        )}

        {publicToken && (
          <a
            href={`/offer/${publicToken}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[6px] border border-bone text-ink text-[12px] hover:border-steel-soft transition-colors"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
            Descargar carta de oferta
          </a>
        )}

        {!isFinal && (
          <>
            <div className="pt-2 mt-2 border-t border-bone-soft">
              <div className="font-mono text-[10px] uppercase tracking-[0.7px] text-steel mb-1.5">
                Decisión del propietario
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStatusChange('accepted')}
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-[6px] border border-bone text-green-text hover:border-green-mark hover:bg-green-bg/40 text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                  <Check className="h-3 w-3" strokeWidth={2} />
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('rejected')}
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-[6px] border border-bone text-signal-deep hover:border-signal/30 hover:bg-signal-bg/40 text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                  Rechazar
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleStatusChange('countered')}
                disabled={pending}
                className="mt-1.5 w-full px-2 py-1.5 rounded-[6px] border border-bone text-amber-text hover:border-amber-mark hover:bg-amber-bg/40 text-[11px] transition-colors disabled:opacity-50"
              >
                Marcar como contraoferta
              </button>
            </div>

            <div className="pt-2 mt-2 border-t border-bone-soft">
              <button
                type="button"
                onClick={() => handleStatusChange('withdrawn')}
                disabled={pending}
                className="w-full px-2 py-1.5 text-[11px] text-steel hover:text-signal-deep underline-offset-2 hover:underline disabled:opacity-50"
              >
                Retirar oferta
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="rounded-[6px] border border-signal/30 bg-signal-bg px-3 py-2 text-[11px] text-signal-deep">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}

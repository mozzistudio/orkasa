'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, FileText } from 'lucide-react'
import { buildReminderUrl } from '@/lib/whatsapp-templates'
import { updateOfferStatus } from '@/app/[locale]/app/offers/actions'
import type { Database } from '@/lib/database.types'

type Offer = Database['public']['Tables']['offers']['Row']

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  countered: 'Contraoferta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  withdrawn: 'Retirada',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-bone-soft text-steel',
  submitted: 'bg-amber-bg text-amber-text',
  countered: 'bg-amber-bg text-amber-text',
  accepted: 'bg-green-bg text-green-text',
  rejected: 'bg-signal-bg text-signal-deep',
  expired: 'bg-bone-soft text-steel',
  withdrawn: 'bg-bone-soft text-steel',
}

function fmtPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export function PropertyOffers({
  offers,
  leadNames,
  propertyTitle,
  ownerName,
  ownerPhone,
  propertyPrice,
}: {
  offers: Offer[]
  leadNames: Map<string, string>
  propertyTitle: string
  ownerName: string | null
  ownerPhone: string | null
  propertyPrice: number | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleSendToOwner(offer: Offer) {
    if (!ownerPhone || !offer.public_token) return
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${baseUrl}/offer/${offer.public_token}/pdf`
    const buyer = leadNames.get(offer.lead_id) ?? 'el comprador'
    const amount = fmtPrice(Number(offer.amount), offer.currency)
    const message = `Hola ${ownerName ?? ''}, te escribo de Orkasa. Recibimos una oferta formal de ${amount} por el ${propertyTitle} de parte de ${buyer}.\n\nTe paso la carta de oferta acá: ${link}\n\n¿Cuándo te queda bien que conversemos para revisar las condiciones?`
    window.open(buildReminderUrl(ownerPhone, message), '_blank')
  }

  function handleStatusChange(offerId: string, newStatus: string) {
    startTransition(async () => {
      await updateOfferStatus(offerId, newStatus)
      router.refresh()
    })
  }

  if (offers.length === 0) {
    return (
      <section className="rounded-[12px] border border-dashed border-bone bg-paper-warm p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <DollarSign className="h-[14px] w-[14px] text-steel" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
            Ofertas
          </h3>
        </div>
        <p className="text-[12px] text-steel">
          Aún no hay ofertas registradas. Cuando un cliente haga una oferta,
          aparecerá aquí con su carta formal lista para enviar al propietario.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-bone-soft">
        <div className="flex items-center gap-2">
          <DollarSign className="h-[14px] w-[14px] text-steel" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
            Ofertas · {offers.length}
          </h3>
        </div>
      </div>

      <div className="divide-y divide-bone-soft">
        {offers.map((offer) => {
          const buyer = leadNames.get(offer.lead_id) ?? 'Cliente'
          const amount = Number(offer.amount)
          const diff =
            propertyPrice != null ? amount - propertyPrice : null
          const diffPct =
            propertyPrice != null && propertyPrice > 0
              ? (amount / propertyPrice - 1) * 100
              : null
          const isFinal =
            offer.status === 'accepted' ||
            offer.status === 'rejected' ||
            offer.status === 'expired' ||
            offer.status === 'withdrawn'

          return (
            <div key={offer.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-[18px] font-medium text-ink">
                      {fmtPrice(amount, offer.currency)}
                    </span>
                    {diff != null && diffPct != null && (
                      <span
                        className={`font-mono text-[11px] ${
                          diff < 0
                            ? 'text-signal-deep'
                            : 'text-green-text'
                        }`}
                      >
                        {diff >= 0 ? '+' : ''}
                        {diffPct.toFixed(1)}% vs publicado
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-steel mt-0.5">
                    De <strong className="text-ink font-medium">{buyer}</strong>
                    {offer.created_at && (
                      <>
                        {' · '}
                        {new Date(offer.created_at).toLocaleDateString(
                          'es-PA',
                          { day: 'numeric', month: 'short' },
                        )}
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[offer.status] ?? STATUS_STYLE.draft}`}
                >
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </span>
              </div>

              {offer.conditions && (
                <p className="text-[12px] text-steel mt-2 leading-snug whitespace-pre-wrap">
                  {offer.conditions}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {offer.public_token && (
                  <a
                    href={`/offer/${offer.public_token}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-bone bg-paper text-[11px] text-ink hover:border-steel-soft transition-colors"
                  >
                    <FileText className="h-[11px] w-[11px]" strokeWidth={1.5} />
                    Ver carta
                  </a>
                )}
                {!isFinal && ownerPhone && offer.public_token && (
                  <button
                    type="button"
                    onClick={() => handleSendToOwner(offer)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-whatsapp text-white text-[11px] font-medium hover:bg-whatsapp-deep transition-colors"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                    </svg>
                    Enviar al propietario
                  </button>
                )}
                {!isFinal && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(offer.id, 'accepted')}
                      disabled={pending}
                      className="px-2.5 py-1.5 rounded-[6px] border border-bone bg-paper text-[11px] text-green-text hover:border-green-mark transition-colors disabled:opacity-50"
                    >
                      Aceptar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(offer.id, 'rejected')}
                      disabled={pending}
                      className="px-2.5 py-1.5 rounded-[6px] border border-bone bg-paper text-[11px] text-signal-deep hover:border-signal/30 transition-colors disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

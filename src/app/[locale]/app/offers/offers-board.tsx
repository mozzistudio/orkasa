'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Check, X, RotateCcw } from 'lucide-react'
import { updateOfferStatus } from './actions'
import { formatPriceCompact } from '@/lib/utils'

type OfferRow = {
  id: string
  lead_id: string
  property_id: string
  amount: number
  currency: string
  status: string
  conditions: string | null
  created_at: string
  lead_name: string
  property_title: string
  agent_name: string | null
}

const STATUSES = ['draft', 'submitted', 'countered', 'accepted', 'rejected'] as const
type OfferStatus = (typeof STATUSES)[number]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  countered: 'Contraoferta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  withdrawn: 'Retirada',
}

const STATUS_ACCENT: Record<string, string> = {
  draft: 'border-l-steel',
  submitted: 'border-l-ink',
  countered: 'border-l-amber-mark',
  accepted: 'border-l-[#0A6B3D]',
  rejected: 'border-l-signal',
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
  })
}

export function OffersBoard({ offers }: { offers: OfferRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const byStatus: Record<string, OfferRow[]> = {}
  for (const s of STATUSES) {
    byStatus[s] = offers.filter((o) => o.status === s)
  }

  function handleStatusChange(offerId: string, newStatus: string) {
    startTransition(async () => {
      await updateOfferStatus(offerId, newStatus)
      router.refresh()
    })
  }

  return (
    <div className={`flex gap-3 overflow-x-auto pb-4 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {STATUSES.map((s) => (
        <div
          key={s}
          className={`flex w-72 shrink-0 flex-col rounded-[4px] border border-bone border-l-2 bg-bone/30 ${STATUS_ACCENT[s] ?? 'border-l-steel'}`}
        >
          <div className="flex items-center justify-between border-b border-bone px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              {STATUS_LABELS[s]}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-ink">
              {byStatus[s].length}
            </span>
          </div>
          <div className="flex-1 space-y-2 p-2">
            {byStatus[s].length === 0 ? (
              <p className="rounded-[4px] border border-dashed border-bone bg-paper/50 p-4 text-center font-mono text-[10px] uppercase tracking-wider text-steel">
                Vacío
              </p>
            ) : (
              byStatus[s].map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-[4px] border border-bone bg-paper p-3 hover:border-ink transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[14px] font-medium text-ink">
                      {formatPriceCompact(offer.amount)}
                    </span>
                    <span className="font-mono text-[10px] text-steel">
                      {offer.currency}
                    </span>
                  </div>
                  <Link
                    href={`/app/leads/${offer.lead_id}`}
                    className="mt-1 block text-[12px] text-steel hover:text-ink transition-colors truncate"
                  >
                    {offer.lead_name}
                  </Link>
                  <p className="font-mono text-[10px] text-steel truncate mt-0.5">
                    {offer.property_title}
                  </p>
                  {offer.conditions && (
                    <p className="mt-1 text-[11px] text-steel line-clamp-2">
                      {offer.conditions}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-steel">
                      {shortDate(offer.created_at)}
                    </span>
                    {(s === 'draft' || s === 'submitted' || s === 'countered') && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(offer.id, 'accepted')}
                          className="p-1 rounded text-steel hover:text-green-text hover:bg-green-bg transition-colors"
                          title="Aceptar"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(offer.id, 'countered')}
                          className="p-1 rounded text-steel hover:text-amber-text hover:bg-amber-bg transition-colors"
                          title="Contraoferta"
                        >
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(offer.id, 'rejected')}
                          className="p-1 rounded text-steel hover:text-signal hover:bg-signal-bg transition-colors"
                          title="Rechazar"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

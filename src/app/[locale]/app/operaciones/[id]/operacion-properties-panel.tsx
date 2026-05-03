'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, X, CheckCircle, Trash2 } from 'lucide-react'
import {
  addPropertyToDeal,
  markPropertyDescartada,
} from '../../deals/actions'

type ConsideredProperty = {
  leadPropertyId: string
  propertyId: string
  title: string
  price: number | null
  currency: string | null
  address: string | null
  status: string
  lostReason: string | null
  isWinning: boolean
}

type AvailableProperty = {
  id: string
  title: string
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  le_encanto: 'Le encantó',
  descartada: 'Descartada',
  oferta_hecha: 'Oferta hecha',
}

const STATUS_STYLE: Record<string, string> = {
  pendiente: 'bg-bone-soft text-steel',
  le_encanto: 'bg-amber-bg text-amber-text',
  descartada: 'bg-bone-soft text-steel-soft line-through',
  oferta_hecha: 'bg-green-bg text-green-text',
}

const LOST_REASONS = [
  'cliente eligió otra propiedad de nuestra cartera',
  'cliente eligió competencia',
  'fuera de presupuesto',
  'no le gustó al ver',
  'problemas de financiamiento',
  'cliente desistió',
] as const

function fmtMoney(amount: number | null, currency: string | null): string {
  if (amount == null) return ''
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function OperacionPropertiesPanel({
  dealId,
  properties,
  availableProperties,
  disabled,
}: {
  dealId: string
  properties: ConsideredProperty[]
  availableProperties: AvailableProperty[]
  disabled: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [discardingId, setDiscardingId] = useState<string | null>(null)
  const [discardReason, setDiscardReason] = useState<string>(LOST_REASONS[0])

  function handleAdd(propertyId: string) {
    startTransition(async () => {
      await addPropertyToDeal(dealId, propertyId)
      setShowPicker(false)
      setSearch('')
      router.refresh()
    })
  }

  function handleDiscard(leadPropertyId: string) {
    startTransition(async () => {
      await markPropertyDescartada(leadPropertyId, discardReason)
      setDiscardingId(null)
      router.refresh()
    })
  }

  const filtered = search
    ? availableProperties
        .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 8)
    : availableProperties.slice(0, 8)

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-bone-soft">
        <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
          Propiedades consideradas · {properties.length}
        </h3>
        {!disabled && !showPicker && (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1 text-[11px] text-steel hover:text-ink transition-colors"
          >
            <Plus className="h-[11px] w-[11px]" strokeWidth={1.5} />
            Agregar
          </button>
        )}
      </div>

      {showPicker && (
        <div className="px-4 py-3 border-b border-bone-soft bg-paper-warm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.8px] text-steel">
              Elegí propiedad
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPicker(false)
                setSearch('')
              }}
              className="text-steel hover:text-ink"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="relative mb-2">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              autoFocus
              className="h-9 w-full rounded-[6px] border border-bone bg-paper pl-8 pr-3 text-[12px] focus:border-ink focus:outline-none focus:ring-0"
            />
          </div>
          <div className="rounded-[6px] border border-bone bg-paper overflow-hidden divide-y divide-bone-soft max-h-[200px] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-steel">
                Sin propiedades disponibles.
              </p>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAdd(p.id)}
                disabled={pending}
                className="w-full text-left px-3 py-2 text-[12px] text-ink hover:bg-bone-soft disabled:opacity-50"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-bone-soft">
        {properties.length === 0 && !showPicker && (
          <p className="px-4 py-6 text-[12px] text-steel text-center">
            Sin propiedades aún.{' '}
            {!disabled && (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="text-ink underline underline-offset-2"
              >
                Agregar una
              </button>
            )}
          </p>
        )}
        {properties.map((p) => (
          <div key={p.leadPropertyId} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.isWinning && (
                    <CheckCircle
                      className="h-[13px] w-[13px] text-green-text shrink-0"
                      strokeWidth={2}
                    />
                  )}
                  <Link
                    href={`/app/properties/${p.propertyId}`}
                    className={`text-[13px] font-medium hover:underline underline-offset-2 truncate ${
                      p.status === 'descartada' ? 'text-steel-soft line-through' : 'text-ink'
                    }`}
                  >
                    {p.title}
                  </Link>
                  <span
                    className={`shrink-0 font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status] ?? STATUS_STYLE.pendiente}`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-steel">
                  {p.price && (
                    <span className="font-mono">{fmtMoney(p.price, p.currency)}</span>
                  )}
                  {p.address && <span>{p.address}</span>}
                </div>
                {p.lostReason && (
                  <p className="mt-1 text-[11px] text-steel italic">
                    Razón: {p.lostReason}
                  </p>
                )}
              </div>
              {!disabled && p.status !== 'descartada' && !p.isWinning && (
                <button
                  type="button"
                  onClick={() =>
                    setDiscardingId(
                      discardingId === p.leadPropertyId ? null : p.leadPropertyId,
                    )
                  }
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-[6px] border border-bone text-steel hover:text-signal-deep hover:border-signal/30 transition-colors text-[11px]"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  Descartar
                </button>
              )}
            </div>

            {discardingId === p.leadPropertyId && (
              <div className="mt-2 p-2 rounded-[6px] bg-paper-warm border border-bone">
                <label className="block text-[10px] uppercase tracking-[0.7px] text-steel font-mono mb-1">
                  Razón
                </label>
                <select
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                  className="h-8 w-full rounded-[6px] border border-bone bg-paper px-2 text-[12px] focus:border-ink focus:outline-none mb-2"
                >
                  {LOST_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDiscardingId(null)}
                    disabled={pending}
                    className="px-2 py-1 text-[11px] text-steel hover:text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscard(p.leadPropertyId)}
                    disabled={pending}
                    className="px-2 py-1 rounded-[4px] bg-signal text-white text-[11px] font-medium hover:bg-signal-deep transition-colors disabled:opacity-50"
                  >
                    Confirmar descarte
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

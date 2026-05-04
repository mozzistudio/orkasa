'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { markDealWon, markDealLost } from '../../deals/actions'

const LOST_REASONS = [
  'cliente eligió competencia',
  'fuera de presupuesto',
  'no califica financieramente',
  'cliente desistió',
  'sin respuesta del cliente',
  'documentación insuficiente',
] as const

function fmtMoney(amount: number | null, currency: string): string {
  if (amount == null) return ''
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function OperacionCloseActions({
  dealId,
  currency,
  currentAmount,
  properties,
}: {
  dealId: string
  currency: string
  currentAmount: number | null
  properties: Array<{ id: string; title: string; price: number | null }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<'won' | 'lost' | null>(null)
  const [winningPropertyId, setWinningPropertyId] = useState<string>(
    properties[0]?.id ?? '',
  )
  const [amount, setAmount] = useState<string>(
    currentAmount?.toString() ??
      properties[0]?.price?.toString() ??
      '',
  )
  const [lostReason, setLostReason] = useState<string>(LOST_REASONS[0])
  const [error, setError] = useState<string | null>(null)

  function handleWon() {
    setError(null)
    if (!winningPropertyId) {
      setError('Elegí cuál propiedad fue comprada')
      return
    }
    startTransition(async () => {
      const result = await markDealWon(
        dealId,
        winningPropertyId,
        amount ? Number(amount) : null,
      )
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
      setMode(null)
    })
  }

  function handleLost() {
    setError(null)
    startTransition(async () => {
      const result = await markDealLost(dealId, lostReason)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
      setMode(null)
    })
  }

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5">
        <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
          Cerrar operación
        </h3>
      </div>
      <div className="px-4 pb-3.5 space-y-2">
        {mode === null && (
          <button
            type="button"
            onClick={() => setMode('lost')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[6px] border border-bone text-steel hover:text-signal-deep hover:border-signal/30 text-[12px] transition-colors"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            Marcar perdida
          </button>
        )}

        {mode === 'won' && (
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.7px] text-steel font-mono">
              Propiedad comprada
            </label>
            <select
              value={winningPropertyId}
              onChange={(e) => {
                setWinningPropertyId(e.target.value)
                const prop = properties.find((p) => p.id === e.target.value)
                if (prop?.price) setAmount(String(prop.price))
              }}
              className="h-9 w-full rounded-[6px] border border-bone bg-paper px-2 text-[12px] focus:border-ink focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <label className="block text-[11px] uppercase tracking-[0.7px] text-steel font-mono mt-2">
              Monto final
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={fmtMoney(currentAmount, currency) || '450000'}
              className="h-9 w-full rounded-[6px] border border-bone bg-paper px-2 text-[12px] font-mono tabular-nums focus:border-ink focus:outline-none"
            />
            {error && (
              <p className="text-[11px] text-signal-deep">{error}</p>
            )}
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setMode(null)}
                disabled={pending}
                className="px-2 py-1.5 text-[11px] text-steel hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleWon}
                disabled={pending}
                className="px-3 py-1.5 rounded-[4px] bg-green-mark text-white text-[11px] font-medium hover:opacity-90 disabled:opacity-50"
              >
                {pending ? 'Cerrando…' : 'Confirmar ganada'}
              </button>
            </div>
          </div>
        )}

        {mode === 'lost' && (
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.7px] text-steel font-mono">
              Razón
            </label>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="h-9 w-full rounded-[6px] border border-bone bg-paper px-2 text-[12px] focus:border-ink focus:outline-none"
            >
              {LOST_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-[11px] text-signal-deep">{error}</p>
            )}
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setMode(null)}
                disabled={pending}
                className="px-2 py-1.5 text-[11px] text-steel hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLost}
                disabled={pending}
                className="px-3 py-1.5 rounded-[4px] bg-signal text-white text-[11px] font-medium hover:bg-signal-deep disabled:opacity-50"
              >
                {pending ? 'Cerrando…' : 'Confirmar perdida'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

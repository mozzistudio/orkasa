'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createOffer } from '@/app/[locale]/app/offers/actions'

type Props = {
  open: boolean
  onClose: () => void
  leadId: string
  propertyId?: string
}

export function OfferFormModal({ open, onClose, leadId, propertyId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('lead_id', leadId)
    if (propertyId) fd.set('property_id', propertyId)

    startTransition(async () => {
      const result = await createOffer(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar oferta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Monto (USD)
            </label>
            <input
              type="number"
              name="amount"
              required
              min={1}
              step={0.01}
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink font-mono focus:border-ink focus:outline-none"
              placeholder="150,000"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Moneda
            </label>
            <select
              name="currency"
              defaultValue="USD"
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
            >
              <option value="USD">USD</option>
              <option value="PAB">PAB</option>
              <option value="MXN">MXN</option>
              <option value="COP">COP</option>
              <option value="CRC">CRC</option>
              <option value="DOP">DOP</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Condiciones
            </label>
            <textarea
              name="conditions"
              rows={2}
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none resize-none"
              placeholder="Sujeta a inspección, financiamiento aprobado..."
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Notas
            </label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none resize-none"
              placeholder="Comentarios internos..."
            />
          </div>

          {error && (
            <p className="text-[12px] text-signal">{error}</p>
          )}

          <DialogFooter>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-50"
            >
              {isPending ? 'Registrando...' : 'Registrar oferta'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

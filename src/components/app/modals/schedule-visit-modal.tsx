'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createViewing } from '@/app/[locale]/app/viewings/actions'

type Props = {
  open: boolean
  onClose: () => void
  leadId: string
  propertyId?: string
}

export function ScheduleVisitModal({ open, onClose, leadId, propertyId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('lead_id', leadId)
    if (propertyId) fd.set('property_id', propertyId)

    startTransition(async () => {
      const result = await createViewing(fd)
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
          <DialogTitle>Agendar visita</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              name="scheduled_at"
              required
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Duración (min)
            </label>
            <input
              type="number"
              name="duration_minutes"
              defaultValue={30}
              min={15}
              max={180}
              step={15}
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
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
              placeholder="Instrucciones, punto de encuentro..."
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
              {isPending ? 'Agendando...' : 'Agendar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { rejectDossier } from '@/app/[locale]/app/compliance/[id]/_actions'

export function RejectDealModal({
  checkId,
  onClose,
}: {
  checkId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const minLen = 30
  const valid = reason.trim().length >= minLen

  function handleSubmit() {
    if (!valid) return
    startTransition(async () => {
      const result = await rejectDossier(checkId, reason.trim())
      if (!result.error) onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-[10px] border border-bone bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-bone px-5 py-3">
          <div className="text-[14px] font-medium text-ink">Rechazar deal</div>
          <button
            type="button"
            onClick={onClose}
            className="text-steel hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-[13px] text-steel leading-relaxed">
            Vas a rechazar este deal. Esta acción cierra la verificación y queda
            registrada en el historial. La razón es obligatoria.
          </p>

          <div className="mt-4">
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
              Razón del rechazo · mín. {minLen} caracteres
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Explicá por qué se rechaza el deal — qué documento falta, qué revisión falló, qué se le dijo al cliente…"
              className="w-full rounded-[5px] border border-bone bg-paper-warm px-3 py-2 text-[13px] text-ink placeholder:text-steel-soft focus:border-steel focus:outline-none"
            />
            <div className="mt-1 text-right text-[10px] text-steel">
              {reason.trim().length} / {minLen}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-bone px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-[5px] border border-bone bg-paper px-3 py-1.5 text-[12px] font-medium text-ink hover:border-steel-soft disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!valid || pending}
            className="rounded-[5px] bg-signal px-3 py-1.5 text-[12px] font-medium text-white hover:bg-signal-deep disabled:opacity-50"
          >
            {pending ? 'Rechazando…' : 'Rechazar deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { rejectPepVerification } from '@/app/[locale]/app/compliance/[id]/_actions'

type Reason = 'pep' | 'sanctions' | 'both'

const REASON_LABELS: Record<Reason, string> = {
  pep: 'PEP — vínculo con cargos públicos',
  sanctions: 'Sanciones — match en lista oficial (OFAC / UN / EU)',
  both: 'Ambos — PEP y sanciones',
}

const MIN_LEN = 30

export function PepRejectionModal({
  taskId,
  onClose,
  onDone,
}: {
  taskId: string
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState<Reason | null>(null)
  const [justification, setJustification] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const valid = reason !== null && justification.trim().length >= MIN_LEN

  function submit() {
    if (!valid || !reason) return
    setError(null)
    startTransition(async () => {
      const res = await rejectPepVerification(taskId, reason, justification.trim())
      if (res.error) {
        setError(res.error)
        return
      }
      onDone()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-[10px] border border-bone bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-bone px-5 py-3">
          <div className="text-[14px] font-medium text-ink">
            Rechazar verificación de compliance
          </div>
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
          <p className="text-[13px] leading-relaxed text-steel">
            Al rechazar, vamos a marcar el dossier en{' '}
            <strong className="text-ink">flagged</strong>, crear una tarea para
            avisar al propietario y otra para cerrar la conversación con el
            cliente.
          </p>

          <div className="mt-4">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
              Motivo del rechazo
            </label>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(REASON_LABELS) as Reason[]).map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-start gap-2 rounded-[5px] border px-3 py-2 transition-colors ${
                    reason === r
                      ? 'border-signal bg-signal/5'
                      : 'border-bone bg-paper hover:border-steel-soft'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="mt-0.5 accent-signal"
                  />
                  <span className="text-[13px] text-ink">
                    {REASON_LABELS[r]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
              Justificación · qué encontraste
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              placeholder="Ej: el cliente declaró que su hermano es ministro. O: matchea con la lista OFAC, nombre completo coincide más fecha de nacimiento."
              className="w-full rounded-[5px] border border-bone bg-paper-warm px-3 py-2 text-[13px] text-ink placeholder:text-steel-soft focus:border-steel focus:outline-none"
            />
            <div className="mt-1 flex justify-between text-[10px]">
              <span className="text-steel">
                Queda registrado en el audit log del dossier.
              </span>
              <span
                className={
                  justification.trim().length >= MIN_LEN
                    ? 'text-steel'
                    : 'text-signal-deep'
                }
              >
                {justification.trim().length} / {MIN_LEN}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-[5px] bg-signal/10 px-3 py-2 text-[12px] text-signal-deep">
              {error}
            </div>
          )}
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
            onClick={submit}
            disabled={!valid || pending}
            className="rounded-[5px] bg-signal px-3 py-1.5 text-[12px] font-medium text-white hover:bg-signal-deep disabled:opacity-50"
          >
            {pending ? 'Guardando…' : 'Confirmar rechazo'}
          </button>
        </div>
      </div>
    </div>
  )
}

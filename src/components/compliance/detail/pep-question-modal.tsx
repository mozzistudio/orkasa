'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { clearFlag } from '@/app/[locale]/app/compliance/[id]/_actions'

export function PepQuestionModal({
  checkId,
  flagType,
  clientName,
  onClose,
}: {
  checkId: string
  flagType: 'pep' | 'high_amount' | 'ubo'
  clientName: string
  onClose: () => void
}) {
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null)
  const [justification, setJustification] = useState('')
  const [pending, startTransition] = useTransition()

  const minLen = 30
  const valid = answer !== null && justification.trim().length >= minLen

  const questionByType = {
    pep: `¿${clientName} tiene parientes en cargos de gobierno?`,
    high_amount: '¿Confirmás que la operación cumple los requisitos para reportar?',
    ubo: '¿Tenés la información del beneficiario final?',
  }

  function handleSubmit() {
    if (!valid || !answer) return
    startTransition(async () => {
      const result = await clearFlag(checkId, flagType, answer, justification.trim())
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
          <div className="text-[14px] font-medium text-ink">Aclarar pregunta</div>
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
          <p className="text-[14px] font-medium text-ink">
            {questionByType[flagType]}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setAnswer('no')}
              className={`flex-1 rounded-[5px] border px-3 py-2 text-[13px] font-medium transition-colors ${
                answer === 'no'
                  ? 'border-green-mark bg-green-bg text-green-text'
                  : 'border-bone bg-paper text-ink hover:border-steel-soft'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setAnswer('yes')}
              className={`flex-1 rounded-[5px] border px-3 py-2 text-[13px] font-medium transition-colors ${
                answer === 'yes'
                  ? 'border-amber-mark bg-amber-bg text-amber-text'
                  : 'border-bone bg-paper text-ink hover:border-steel-soft'
              }`}
            >
              Sí
            </button>
          </div>

          {answer && (
            <div className="mt-4">
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
                {answer === 'no'
                  ? 'Justificación · cómo lo sabés'
                  : 'Detalles del pariente y cargo'}
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                placeholder={
                  answer === 'no'
                    ? 'Lo confirmé directamente con el cliente, lo conozco hace 5 años, etc.'
                    : 'Nombre del pariente, cargo que ocupa, relación familiar…'
                }
                className="w-full rounded-[5px] border border-bone bg-paper-warm px-3 py-2 text-[13px] text-ink placeholder:text-steel-soft focus:border-steel focus:outline-none"
              />
              <div className="mt-1 text-right text-[10px] text-steel">
                {justification.trim().length} / {minLen}
              </div>

              {answer === 'yes' && (
                <p className="mt-3 rounded-[5px] bg-amber-bg p-3 text-[12px] text-amber-text">
                  <strong className="font-medium">Nota:</strong> Vamos a agregar una
                  declaración firmada en la lista de documentos pendientes.
                </p>
              )}
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
            onClick={handleSubmit}
            disabled={!valid || pending}
            className="rounded-[5px] bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-coal disabled:opacity-50"
          >
            {pending ? 'Guardando…' : 'Marcar como aclarado'}
          </button>
        </div>
      </div>
    </div>
  )
}

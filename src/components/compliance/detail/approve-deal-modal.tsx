'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export function ApproveDealModal({
  dealValue,
  requireJustification,
  onCancel,
  onConfirm,
  pending,
}: {
  dealValue: number
  requireJustification: boolean
  onCancel: () => void
  onConfirm: (justification: string) => void
  pending: boolean
}) {
  const [text, setText] = useState('')
  const minLen = 50
  const valid = !requireJustification || text.trim().length >= minLen

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[480px] rounded-[10px] border border-bone bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-bone px-5 py-3">
          <div className="text-[14px] font-medium text-ink">
            Aprobar y firmar
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-steel hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-[13px] text-steel leading-relaxed">
            Vas a aprobar el deal por{' '}
            <strong className="font-medium text-ink">
              {formatPrice(dealValue)}
            </strong>
            . Esta acción cierra la verificación y permite firmar el contrato.
          </p>

          {requireJustification && (
            <div className="mt-4">
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
                Justificación obligatoria · mín. {minLen} caracteres
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Por qué aprobás este deal a pesar del flag, qué verificaste manualmente, con quién lo confirmaste…"
                className="w-full rounded-[5px] border border-bone bg-paper-warm px-3 py-2 text-[13px] text-ink placeholder:text-steel-soft focus:border-steel focus:outline-none"
              />
              <div className="mt-1 text-right text-[10px] text-steel">
                {text.trim().length} / {minLen}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-bone px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-[5px] border border-bone bg-paper px-3 py-1.5 text-[12px] font-medium text-ink hover:border-steel-soft disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(text.trim())}
            disabled={!valid || pending}
            className="rounded-[5px] bg-green-mark px-3 py-1.5 text-[12px] font-medium text-white hover:bg-green-text disabled:opacity-50"
          >
            {pending ? 'Aprobando…' : 'Confirmar aprobación'}
          </button>
        </div>
      </div>
    </div>
  )
}

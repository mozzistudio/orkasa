'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { setDocumentStatus } from '@/app/[locale]/app/compliance/actions'
import type { Database } from '@/lib/database.types'

type DocStatus = Database['public']['Enums']['compliance_doc_status']

const STATUS_LABEL: Record<DocStatus, string> = {
  pending: 'Pendiente',
  uploaded: 'Por revisar',
  verified: 'Verificado',
  rejected: 'Rechazado',
  expired: 'Vencido',
}

/**
 * Compliance officer review actions for a single document.
 *
 * Two main paths:
 * - Validar → status='verified' (no note required)
 * - Rechazar → opens an inline reason field, then status='rejected' with
 *   the note attached so the agent knows why
 *
 * Also surfaces "Mark expired" + "Reset to pending" for edge cases. The
 * actions write to compliance_audit_log via the server action.
 */
export function DocumentReviewActions({
  documentId,
  initialStatus,
  initialNotes,
  hasFile,
}: {
  documentId: string
  /** Reserved — currently the actions only need the document id, but the
   *  validation page passes checkId for future workflow that triggers
   *  parent-check status changes (e.g. auto-advance when all docs verified). */
  checkId?: string
  initialStatus: DocStatus
  initialNotes: string
  hasFile: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<DocStatus>(initialStatus)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState(initialNotes)
  const [error, setError] = useState<string | null>(null)

  function decide(next: DocStatus, note?: string) {
    setError(null)
    startTransition(async () => {
      const result = await setDocumentStatus(documentId, next, note)
      if (result.error) {
        setError(result.error)
        return
      }
      setStatus(next)
      setShowRejectForm(false)
      router.refresh()
    })
  }

  function submitRejection() {
    if (!rejectNote.trim()) {
      setError('Indicá el motivo del rechazo para que el agente sepa qué pedir.')
      return
    }
    decide('rejected', rejectNote.trim())
  }

  if (!hasFile) {
    return (
      <div className="rounded-[4px] border border-dashed border-bone bg-paper p-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
          Esperando archivo
        </p>
        <p className="mt-2 text-[12px] text-steel">
          Subí el documento desde el expediente para habilitar la revisión.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[4px] border border-bone bg-paper p-4">
      <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        Decisión
      </h3>

      <div className="space-y-2">
        {/* Validar */}
        {status !== 'verified' && (
          <button
            type="button"
            onClick={() => decide('verified')}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#0A6B3D] bg-[#0A6B3D]/10 px-4 py-2.5 text-[13px] font-medium text-[#0A6B3D] transition-colors hover:bg-[#0A6B3D] hover:text-paper disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
            ) : (
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            Validar documento
          </button>
        )}

        {/* Rechazar (toggle reason) */}
        {status !== 'rejected' && (
          <>
            <button
              type="button"
              onClick={() => setShowRejectForm((v) => !v)}
              disabled={pending}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-[4px] border px-4 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-60 ${
                showRejectForm
                  ? 'border-signal bg-signal text-paper'
                  : 'border-signal bg-signal/10 text-signal hover:bg-signal hover:text-paper'
              }`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Rechazar
            </button>
            {showRejectForm && (
              <div className="space-y-2 rounded-[4px] border border-signal/30 bg-signal-soft p-3">
                <label className="font-mono text-[10px] uppercase tracking-wider text-signal">
                  Motivo del rechazo
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder="Ej: cédula vencida · pedir copia actualizada"
                  className="w-full rounded-[4px] border border-signal/30 bg-paper px-3 py-2 text-[12px] leading-relaxed focus:border-signal focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 rounded-[4px] border border-bone bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:border-ink hover:text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={submitRejection}
                    disabled={pending}
                    className="flex-1 rounded-[4px] bg-signal px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-paper transition-colors hover:bg-signal/90 disabled:opacity-60"
                  >
                    {pending ? 'Enviando…' : 'Confirmar rechazo'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reset to pending — useful after a wrong decision */}
        {(status === 'verified' || status === 'rejected') && (
          <button
            type="button"
            onClick={() => decide('uploaded')}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-bone bg-paper px-4 py-2 text-[12px] text-steel transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
          >
            <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
            Reabrir revisión
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 inline-flex items-start gap-1.5 font-mono text-[11px] text-signal">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.5} />
          {error}
        </p>
      )}

      {/* Current state badge */}
      <div className="mt-4 border-t border-bone pt-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
          Estado actual
        </p>
        <p className="mt-1 text-[13px] font-medium text-ink">
          {STATUS_LABEL[status]}
        </p>
      </div>
    </div>
  )
}

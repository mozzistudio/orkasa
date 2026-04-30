'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  Save,
} from 'lucide-react'
import {
  updateComplianceStatus,
  updateComplianceNotes,
  rerunScreening,
} from '../actions'
import type { Database } from '@/lib/database.types'

type Status = Database['public']['Enums']['compliance_status']
type Risk = Database['public']['Enums']['compliance_risk']

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pendiente',
  in_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  requires_action: 'Acción requerida',
}

const RISK_LABEL: Record<Risk, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico',
}

export function ComplianceWorkflow({
  checkId,
  initialStatus,
  initialRisk,
  initialNotes,
  sanctionsMatch,
  pepMatch,
}: {
  checkId: string
  initialStatus: Status
  initialRisk: Risk | null
  initialNotes: string
  sanctionsMatch: boolean
  pepMatch: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<Status>(initialStatus)
  const [risk, setRisk] = useState<Risk | ''>(initialRisk ?? '')
  const [notes, setNotes] = useState(initialNotes)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [screeningPending, startScreeningTransition] = useTransition()

  const isDirty =
    status !== initialStatus ||
    (risk || null) !== initialRisk ||
    notes !== initialNotes

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const statusResult = await updateComplianceStatus(
        checkId,
        status,
        risk === '' ? null : risk,
      )
      if (statusResult.error) {
        setError(statusResult.error)
        return
      }
      if (notes !== initialNotes) {
        const notesResult = await updateComplianceNotes(checkId, notes)
        if (notesResult.error) {
          setError(notesResult.error)
          return
        }
      }
      setSavedAt(new Date())
      router.refresh()
    })
  }

  function handleQuickDecision(nextStatus: Status, nextRisk?: Risk) {
    setError(null)
    setStatus(nextStatus)
    if (nextRisk) setRisk(nextRisk)
    startTransition(async () => {
      const result = await updateComplianceStatus(
        checkId,
        nextStatus,
        nextRisk ?? (risk === '' ? null : risk),
      )
      if (result.error) {
        setError(result.error)
        return
      }
      setSavedAt(new Date())
      router.refresh()
    })
  }

  function handleRerunScreening() {
    setError(null)
    startScreeningTransition(async () => {
      const result = await rerunScreening(checkId)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="rounded-[4px] border border-bone bg-paper p-5">
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        Decisión
      </h2>

      {/* Quick action buttons */}
      <div className="mb-5 grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => handleQuickDecision('approved', risk === '' ? 'low' : (risk as Risk))}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#0A6B3D] bg-[#0A6B3D]/10 px-4 py-2.5 text-[13px] font-medium text-[#0A6B3D] transition-colors hover:bg-[#0A6B3D] hover:text-paper disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
          Aprobar verificación
        </button>
        <button
          type="button"
          onClick={() => handleQuickDecision('rejected')}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-signal bg-signal/10 px-4 py-2.5 text-[13px] font-medium text-signal transition-colors hover:bg-signal hover:text-paper disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          Rechazar
        </button>
        <button
          type="button"
          onClick={() => handleQuickDecision('requires_action')}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-bone px-4 py-2.5 text-[13px] text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          Pedir acción al cliente
        </button>
        <button
          type="button"
          onClick={() => handleQuickDecision('in_review')}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-bone px-4 py-2.5 text-[13px] text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          Tomar en revisión
        </button>
      </div>

      {/* Manual fine-grained controls */}
      <div className="space-y-4 border-t border-bone pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="h-9 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
            >
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Nivel de riesgo
            </label>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value as Risk | '')}
              className="h-9 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
            >
              <option value="">— sin clasificar —</option>
              {(Object.keys(RISK_LABEL) as Risk[]).map((r) => (
                <option key={r} value={r}>
                  {RISK_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Notas internas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Observaciones del compliance officer, alertas, próximos pasos…"
            className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] leading-relaxed focus:border-ink focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={handleRerunScreening}
            disabled={screeningPending}
            className="inline-flex items-center gap-2 text-[12px] text-steel transition-colors hover:text-ink disabled:opacity-60"
          >
            {screeningPending ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
            ) : (
              <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
            )}
            Re-ejecutar screening
            {(sanctionsMatch || pepMatch) && (
              <span className="ml-1 rounded-[3px] bg-signal px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper">
                Match actual
              </span>
            )}
          </button>

          <div className="flex items-center gap-3">
            {savedAt && !isDirty && (
              <span className="font-mono text-[11px] text-[#0A6B3D]">
                Guardado · {savedAt.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || !isDirty}
              className="inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
              ) : (
                <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

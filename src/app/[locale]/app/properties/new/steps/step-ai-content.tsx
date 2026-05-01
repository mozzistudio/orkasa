'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, RefreshCw, Sparkles, AlertCircle } from 'lucide-react'
import { generateTitleAndDescription } from '../../ai-actions'
import { updatePropertyDraft } from '../../actions'

export function StepAIContent({
  propertyId,
  title: initialTitle,
  description: initialDescription,
  onConfirm,
  onBack,
}: {
  propertyId: string
  title: string
  description: string
  onConfirm: (title: string, description: string) => void
  onBack: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    initialTitle ? 'ready' : 'idle',
  )
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  function generate() {
    setStatus('loading')
    setError(null)
    startTransition(async () => {
      const result = await generateTitleAndDescription(propertyId)
      if ('error' in result) {
        setStatus('error')
        setError(result.error)
        return
      }
      setTitle(result.title)
      setDescription(result.description)
      setStatus('ready')
    })
  }

  useEffect(() => {
    if (status === 'idle' && !initialTitle) {
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleConfirm() {
    startTransition(async () => {
      const result = await updatePropertyDraft(propertyId, { title, description })
      if (!result.ok) {
        setError(result.error ?? 'Error guardando')
        return
      }
      onConfirm(title, description)
    })
  }

  function handleSkip() {
    setEditing(true)
    setStatus('ready')
    if (!title) setTitle('')
    if (!description) setDescription('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-bone">
          <Sparkles className="h-5 w-5 text-steel" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-[15px] font-medium text-ink">
            Título y descripción
          </h2>
          <p className="font-mono text-[11px] text-steel">
            La IA genera el contenido a partir de tus datos y fotos.
          </p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="rounded-[4px] border border-bone bg-paper p-6 space-y-4">
          <div className="h-6 w-2/3 animate-pulse rounded-[2px] bg-bone" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-[2px] bg-bone/60" />
            <div className="h-4 w-full animate-pulse rounded-[2px] bg-bone/60" />
            <div className="h-4 w-5/6 animate-pulse rounded-[2px] bg-bone/60" />
            <div className="h-4 w-4/6 animate-pulse rounded-[2px] bg-bone/60" />
          </div>
          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-steel">
            Generando con IA…
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-[4px] border border-signal/30 bg-signal-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-signal" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-[13px] text-signal">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={generate}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-signal px-3 py-1.5 text-[12px] text-signal hover:bg-signal hover:text-paper transition-colors"
                >
                  <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone px-3 py-1.5 text-[12px] text-steel hover:border-ink hover:text-ink transition-colors"
                >
                  Escribir manualmente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="rounded-[4px] border border-bone bg-paper p-4 md:p-6 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="font-mono text-[10px] uppercase tracking-wider text-steel">
                Título
              </label>
              <span className="font-mono text-[11px] tabular-nums text-steel">
                {title.length} / 120
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setEditing(true)
              }}
              maxLength={200}
              className="h-11 w-full rounded-[4px] border border-bone bg-paper px-3 text-[14px] font-medium text-ink focus:border-ink focus:outline-none md:h-9 md:text-[13px]"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="font-mono text-[10px] uppercase tracking-wider text-steel">
                Descripción
              </label>
              <span className="font-mono text-[11px] tabular-nums text-steel">
                {description.length} / 5000
              </span>
            </div>
            <textarea
              rows={8}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setEditing(true)
              }}
              maxLength={5000}
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] leading-relaxed text-ink focus:border-ink focus:outline-none"
            />
          </div>

          {!editing && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generate}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone px-3 py-1.5 text-[12px] text-steel hover:border-ink hover:text-ink transition-colors"
              >
                <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                Regenerar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Desktop footer */}
      <div className="hidden md:flex items-center justify-between border-t border-bone pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-steel hover:text-ink transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Volver
        </button>
        <div className="flex items-center gap-3">
          {status !== 'ready' && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-[13px] text-steel hover:text-ink transition-colors"
            >
              Saltar IA
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!title || pending}
            className="rounded-[4px] bg-ink px-5 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
          >
            {pending ? '…' : 'Confirmar'}
          </button>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="h-24 md:hidden" />
      <div
        className="fixed inset-x-0 z-20 flex items-center gap-2 border-t border-bone bg-paper px-4 py-3 md:hidden"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="rounded-[4px] border border-ink px-3 py-2.5 text-[13px] text-ink transition-colors active:bg-bone/30"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!title || pending}
          className="flex-1 rounded-[4px] bg-ink px-3 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-coal disabled:opacity-60"
        >
          {pending ? '…' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

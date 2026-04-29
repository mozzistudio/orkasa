'use client'

import { useState, useTransition } from 'react'
import { Sparkles, RefreshCw, Check } from 'lucide-react'
import {
  generateDescription,
  type GenerateDescriptionInput,
} from '@/app/[locale]/app/properties/ai-actions'

export function AIDescriptionButton({
  formId,
  onApply,
}: {
  formId?: string
  onApply: (text: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [hint, setHint] = useState('')

  function readFormFields(): GenerateDescriptionInput | null {
    const form = formId
      ? (document.getElementById(formId) as HTMLFormElement | null)
      : (document.querySelector('form') as HTMLFormElement | null)
    if (!form) return null

    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''

    const title = get('title').trim()
    if (!title) return null

    const numericOrNull = (s: string) => {
      const n = Number(s)
      return s.trim() === '' || Number.isNaN(n) ? null : n
    }

    return {
      title,
      property_type: get('property_type') || 'apartment',
      listing_type: get('listing_type') || 'sale',
      bedrooms: numericOrNull(get('bedrooms')),
      bathrooms: numericOrNull(get('bathrooms')),
      area_m2: numericOrNull(get('area_m2')),
      price: numericOrNull(get('price')),
      currency: get('currency') || 'USD',
      neighborhood: get('neighborhood').trim() || null,
      city: get('city').trim() || null,
      hint: hint.trim() || null,
    }
  }

  function handleGenerate() {
    setError(null)
    const input = readFormFields()
    if (!input) {
      setError('Completá al menos el título antes de generar.')
      setOpen(true)
      return
    }
    setOpen(true)
    startTransition(async () => {
      const result = await generateDescription(input)
      if ('error' in result) {
        setError(result.error)
        setGenerated(null)
      } else {
        setGenerated(result.description)
      }
    })
  }

  function handleApply() {
    if (!generated) return
    onApply(generated)
    setOpen(false)
    setGenerated(null)
    setHint('')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-[4px] bg-signal px-3 py-1.5 text-[12px] font-medium text-paper transition-colors hover:bg-signal/90 disabled:opacity-60"
      >
        <Sparkles className="h-3 w-3" strokeWidth={1.5} />
        {pending ? 'Generando…' : 'Generar con IA'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[4px] border border-bone bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-bone px-5 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-signal" strokeWidth={1.5} />
                <h3 className="text-[15px] font-medium text-ink">
                  AI Listing Studio
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                claude-opus-4-7
              </span>
            </div>

            <div className="px-5 py-4">
              {error ? (
                <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
                  {error}
                </p>
              ) : pending ? (
                <div className="space-y-2">
                  <div className="h-3 animate-pulse rounded-[2px] bg-bone" />
                  <div className="h-3 w-11/12 animate-pulse rounded-[2px] bg-bone" />
                  <div className="h-3 w-10/12 animate-pulse rounded-[2px] bg-bone" />
                  <div className="h-3 w-9/12 animate-pulse rounded-[2px] bg-bone" />
                  <div className="h-3 w-8/12 animate-pulse rounded-[2px] bg-bone" />
                </div>
              ) : generated ? (
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap rounded-[4px] border border-bone bg-bone/30 p-4 text-[14px] leading-relaxed text-ink">
                    {generated}
                  </p>
                  <p className="font-mono text-[11px] text-steel">
                    {generated.split(/\s+/).length} palabras · {generated.length} caracteres
                  </p>
                </div>
              ) : null}

              {/* Hint input shown when result is ready or empty (not while pending) */}
              {!pending && (
                <div className="mt-4 space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-steel">
                    Notas para la IA (opcional)
                  </label>
                  <input
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Ej: Resaltar el balcón con vista al mar"
                    className="h-9 w-full rounded-[4px] border border-bone px-3 text-[13px] focus:border-ink focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-bone bg-paper px-5 py-3">
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="text-[13px] text-steel hover:text-ink transition-colors"
              >
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink px-3 py-1.5 text-[13px] text-ink hover:bg-bone/50 transition-colors disabled:opacity-60"
                >
                  <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                  Regenerar
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!generated || pending}
                  className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-1.5 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60"
                >
                  <Check className="h-3 w-3" strokeWidth={1.5} />
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

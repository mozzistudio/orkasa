'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { generateDemoDocument } from '@/app/[locale]/app/compliance/actions'

/**
 * One-click generation of a realistic demo document via Gemini, using the
 * real lead name + property data injected into the prompt. Replaces the
 * synthetic `compliance-demo/...` placeholder with an actual image stored in
 * the private bucket, then refreshes the page so the preview re-renders
 * with the signed URL.
 *
 * Each output carries a "MUESTRA · DEMO · ORKASA" watermark — guarded at
 * the prompt level so no Gemini call can produce a credible-looking
 * fraudulent document.
 */
export function GenerateDemoButton({
  documentId,
  variant = 'primary',
}: {
  documentId: string
  /** 'primary' renders as a filled signal-orange CTA; 'subtle' as a small text link. */
  variant?: 'primary' | 'subtle'
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await generateDemoDocument(documentId)
      if (!result.ok) {
        setError(result.error ?? 'Error desconocido')
        return
      }
      router.refresh()
    })
  }

  if (variant === 'subtle') {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:text-signal disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
          ) : (
            <Sparkles className="h-3 w-3" strokeWidth={1.5} />
          )}
          {pending ? 'Generando…' : 'Regenerar con IA'}
        </button>
        {error && (
          <p className="font-mono text-[10px] text-signal">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-[4px] bg-signal px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
        )}
        {pending ? 'Generando con Gemini…' : 'Generar muestra realista con IA'}
      </button>
      <p className="max-w-xs text-center font-mono text-[10px] uppercase tracking-wider text-paper/70">
        gemini-2.5-flash-image · 5-10 segundos
      </p>
      {error && (
        <p className="inline-flex items-center gap-1 rounded-[3px] bg-paper px-2 py-1 font-mono text-[11px] text-signal">
          <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
          {error}
        </p>
      )}
    </div>
  )
}

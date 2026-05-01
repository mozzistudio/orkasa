'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { ChevronLeft, Sparkles, AlertCircle } from 'lucide-react'
import type { StoredImage } from '@/components/app/image-upload'
import { autoEnhanceImage } from '../../enhance-actions'
import { updatePropertyDraft } from '../../actions'

type EnhancedState = {
  original: StoredImage
  enhanced: StoredImage | null
  status: 'idle' | 'loading' | 'done' | 'error'
  error?: string
  useEnhanced: boolean
}

export function StepAIPhotos({
  propertyId,
  images,
  onConfirm,
  onBack,
}: {
  propertyId: string
  images: StoredImage[]
  onConfirm: (images: StoredImage[]) => void
  onBack: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [items, setItems] = useState<EnhancedState[]>(() =>
    images.map((img) => ({
      original: img,
      enhanced: null,
      status: 'idle' as const,
      useEnhanced: false,
    })),
  )

  useEffect(() => {
    items.forEach((item, i) => {
      if (item.status !== 'idle') return
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, status: 'loading' } : it,
        ),
      )
      autoEnhanceImage(item.original.url).then((result) => {
        setItems((prev) =>
          prev.map((it, idx) => {
            if (idx !== i) return it
            if (result.ok) {
              return {
                ...it,
                enhanced: { path: result.path, url: result.url },
                status: 'done',
                useEnhanced: true,
              }
            }
            return { ...it, status: 'error', error: result.error }
          }),
        )
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allDone = items.every(
    (it) => it.status === 'done' || it.status === 'error',
  )
  const anyLoading = items.some((it) => it.status === 'loading')

  function toggleUse(index: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, useEnhanced: !it.useEnhanced } : it,
      ),
    )
  }

  function handleConfirm() {
    const finalImages = items.map((it) =>
      it.useEnhanced && it.enhanced ? it.enhanced : it.original,
    )
    startTransition(async () => {
      await updatePropertyDraft(propertyId, { images: finalImages })
      onConfirm(finalImages)
    })
  }

  function handleSkip() {
    onConfirm(images)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-bone">
          <Sparkles className="h-5 w-5 text-steel" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-[15px] font-medium text-ink">
            Fotos mejoradas
          </h2>
          <p className="font-mono text-[11px] text-steel">
            {anyLoading
              ? 'Mejorando fotos con IA…'
              : 'Elegí la versión que preferís para cada foto.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item, i) => (
          <div
            key={item.original.path}
            className="rounded-[4px] border border-bone bg-paper p-3"
          >
            {item.status === 'loading' && (
              <div className="space-y-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-bone">
                  <Image
                    src={item.original.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles
                      className="h-6 w-6 animate-pulse text-signal"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <p className="text-center font-mono text-[10px] uppercase tracking-wider text-steel">
                  Mejorando foto {i + 1}…
                </p>
              </div>
            )}

            {item.status === 'error' && (
              <div className="space-y-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
                  <Image
                    src={item.original.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-signal">
                  <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
                  Se usará la original
                </div>
              </div>
            )}

            {item.status === 'done' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, useEnhanced: false } : it,
                        ),
                      )
                    }
                    className={`relative aspect-[4/3] overflow-hidden rounded-[3px] border-2 transition-colors ${
                      !item.useEnhanced ? 'border-ink' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={item.original.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 left-1 rounded-[3px] bg-coal/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-paper">
                      Original
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleUse(i)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-[3px] border-2 transition-colors ${
                      item.useEnhanced ? 'border-ink' : 'border-transparent'
                    }`}
                  >
                    {item.enhanced && (
                      <Image
                        src={item.enhanced.url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    )}
                    <span className="absolute bottom-1 left-1 rounded-[3px] bg-signal/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-paper">
                      Mejorada
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
          <button
            type="button"
            onClick={handleSkip}
            className="text-[13px] text-steel hover:text-ink transition-colors"
          >
            Saltar mejoras
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allDone || pending}
            className="rounded-[4px] bg-ink px-5 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
          >
            {pending ? '…' : 'Confirmar fotos'}
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
          onClick={handleSkip}
          className="rounded-[4px] border border-bone px-3 py-2.5 text-[13px] text-steel transition-colors active:bg-bone/30"
        >
          Saltar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!allDone || pending}
          className="flex-1 rounded-[4px] bg-ink px-3 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-coal disabled:opacity-60"
        >
          {pending ? '…' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

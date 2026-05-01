'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { ChevronLeft, Sparkles, AlertCircle, Check } from 'lucide-react'
import type { StoredImage } from '@/components/app/image-upload'
import { BeforeAfterSlider } from '@/components/app/before-after-slider'
import { autoEnhanceImage } from '../../enhance-actions'
import { updatePropertyDraft } from '../../actions'

type EnhancedState = {
  original: StoredImage
  enhanced: StoredImage | null
  status: 'idle' | 'loading' | 'done' | 'error'
  error?: string
  useEnhanced: boolean
  applied?: string[]
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
                applied: result.applied,
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

      <div className="space-y-5">
        {items.map((item, i) => (
          <div
            key={item.original.path}
            className="rounded-[4px] border border-bone bg-paper p-3 md:p-4"
          >
            {item.status === 'loading' && (
              <div className="space-y-3">
                <div className="relative aspect-[3/2] overflow-hidden rounded-[3px] bg-bone">
                  <Image
                    src={item.original.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles
                      className="h-7 w-7 animate-pulse text-signal"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <p className="text-center font-mono text-[11px] uppercase tracking-wider text-steel">
                  Mejorando foto {i + 1}…
                </p>
              </div>
            )}

            {item.status === 'error' && (
              <div className="space-y-3">
                <div className="relative aspect-[3/2] overflow-hidden rounded-[3px]">
                  <Image
                    src={item.original.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-signal">
                  <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  No pude mejorar esta foto — se usará la original
                </div>
              </div>
            )}

            {item.status === 'done' && item.enhanced && (
              <div className="space-y-3">
                <BeforeAfterSlider
                  beforeUrl={item.original.url}
                  afterUrl={item.enhanced.url}
                  beforeLabel="Original"
                  afterLabel="Mejorada"
                  aspect="aspect-[3/2]"
                />

                {item.applied && item.applied.length > 0 && (
                  <div className="rounded-[3px] border border-bone bg-bone/30 px-3 py-2.5">
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                      Cambios aplicados
                    </p>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                      {item.applied.map((change) => (
                        <li
                          key={change}
                          className="flex items-center gap-1.5 text-[12px] text-ink"
                        >
                          <Check
                            className="h-3 w-3 text-signal"
                            strokeWidth={2}
                          />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-1 rounded-[4px] border border-bone bg-bone/30 p-1 font-mono text-[11px] uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, useEnhanced: false } : it,
                        ),
                      )
                    }
                    className={`flex-1 rounded-[3px] px-3 py-2 transition-colors ${
                      !item.useEnhanced
                        ? 'bg-ink text-paper'
                        : 'text-steel hover:text-ink'
                    }`}
                  >
                    Usar original
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, useEnhanced: true } : it,
                        ),
                      )
                    }
                    className={`flex-1 rounded-[3px] px-3 py-2 transition-colors ${
                      item.useEnhanced
                        ? 'bg-signal text-paper'
                        : 'text-steel hover:text-ink'
                    }`}
                  >
                    Usar mejorada
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

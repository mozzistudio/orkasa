'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Sparkles, RefreshCw, Check, X, Star, Wand2 } from 'lucide-react'
import {
  reviewListing,
  type ReviewListingInput,
  type TextVariant,
  type PhotoReview,
} from '@/app/[locale]/app/properties/ai-actions'
import { enhanceImage } from '@/app/[locale]/app/properties/enhance-actions'
import { ENHANCEMENTS, type EnhancementType } from '@/lib/gemini'
import type { StoredImage } from '@/components/app/image-upload'

type ReviewState =
  | { stage: 'idle' }
  | { stage: 'loading' }
  | { stage: 'error'; message: string }
  | {
      stage: 'ready'
      textVariants: TextVariant[]
      photoReview: PhotoReview[]
    }

const TONE_LABEL: Record<TextVariant['tone'], string> = {
  formal: 'Portal · formal',
  social: 'Social · conversacional',
  concise: 'Móvil · breve',
}

const TONE_HINT: Record<TextVariant['tone'], string> = {
  formal: 'Para portales (E24, Inmuebles24, etc.)',
  social: 'Para Facebook, WhatsApp, email',
  concise: 'Para Instagram, mobile-first',
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-[#0A6B3D]'
  if (score >= 65) return 'text-ink'
  if (score >= 50) return 'text-steel'
  return 'text-signal'
}

// State for the per-photo enhancement sub-modal
type EnhanceModalState =
  | { stage: 'closed' }
  | { stage: 'choose'; image: StoredImage; index: number }
  | {
      stage: 'comparing'
      image: StoredImage
      index: number
      type: EnhancementType
      enhancedUrl: string
      enhancedPath: string
    }
  | { stage: 'loading'; image: StoredImage; index: number; type: EnhancementType }
  | { stage: 'error'; image: StoredImage; index: number; message: string }

export function AIListingReview({
  formId = 'property-form',
  images,
  onApplyText,
  onImagesChange,
}: {
  formId?: string
  images: StoredImage[]
  onApplyText: (text: string) => void
  /** Called whenever the modal needs to update the image list (reorder, swap) */
  onImagesChange: (next: StoredImage[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ReviewState>({ stage: 'idle' })
  const [pending, startTransition] = useTransition()
  const [appliedTone, setAppliedTone] = useState<TextVariant['tone'] | null>(
    null,
  )
  const [enhanceModal, setEnhanceModal] = useState<EnhanceModalState>({
    stage: 'closed',
  })

  function readForm(): ReviewListingInput | null {
    const form = document.getElementById(formId) as HTMLFormElement | null
    if (!form) return null

    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''

    const title = get('title').trim()
    if (!title) return null

    const num = (s: string) => {
      const n = Number(s)
      return s.trim() === '' || Number.isNaN(n) ? null : n
    }

    return {
      title,
      description: get('description').trim() || null,
      property_type: get('property_type') || 'apartment',
      listing_type: get('listing_type') || 'sale',
      bedrooms: num(get('bedrooms')),
      bathrooms: num(get('bathrooms')),
      area_m2: num(get('area_m2')),
      price: num(get('price')),
      currency: get('currency') || 'USD',
      neighborhood: get('neighborhood').trim() || null,
      city: get('city').trim() || null,
      imageUrls: images.map((i) => i.url),
    }
  }

  function handleReview() {
    const input = readForm()
    if (!input) {
      setState({ stage: 'error', message: 'Completá al menos el título.' })
      setOpen(true)
      return
    }
    if (input.imageUrls.length === 0) {
      setState({
        stage: 'error',
        message: 'Subí al menos una foto antes de revisar con IA.',
      })
      setOpen(true)
      return
    }

    setOpen(true)
    setAppliedTone(null)
    setState({ stage: 'loading' })

    startTransition(async () => {
      const result = await reviewListing(input)
      if ('error' in result) {
        setState({ stage: 'error', message: result.error })
        return
      }
      setState({
        stage: 'ready',
        textVariants: result.textVariants,
        photoReview: result.photoReview,
      })
    })
  }

  function handleApplyText(variant: TextVariant) {
    onApplyText(variant.description)
    setAppliedTone(variant.tone)
  }

  function handleApplyOrder(review: PhotoReview[]) {
    // Sort images by suggestedOrder using the index map from the review
    const sorted = [...images]
    const orderByPath = new Map<string, number>()
    review.forEach((r) => {
      const img = images[r.index]
      if (img) orderByPath.set(img.path, r.suggestedOrder)
    })
    sorted.sort((a, b) => {
      const oa = orderByPath.get(a.path) ?? 999
      const ob = orderByPath.get(b.path) ?? 999
      return oa - ob
    })
    onImagesChange(sorted)
  }

  function startEnhancement(image: StoredImage, index: number) {
    setEnhanceModal({ stage: 'choose', image, index })
  }

  function runEnhancement(
    image: StoredImage,
    index: number,
    type: EnhancementType,
  ) {
    setEnhanceModal({ stage: 'loading', image, index, type })
    startTransition(async () => {
      const result = await enhanceImage(image.url, type)
      if (!result.ok) {
        setEnhanceModal({ stage: 'error', image, index, message: result.error })
        return
      }
      setEnhanceModal({
        stage: 'comparing',
        image,
        index,
        type,
        enhancedUrl: result.url,
        enhancedPath: result.path,
      })
    })
  }

  function applyEnhancement() {
    if (enhanceModal.stage !== 'comparing') return
    const { index, enhancedPath, enhancedUrl } = enhanceModal
    const next = [...images]
    next[index] = { path: enhancedPath, url: enhancedUrl }
    onImagesChange(next)
    setEnhanceModal({ stage: 'closed' })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleReview}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-[4px] bg-signal px-3 py-1.5 text-[12px] font-medium text-paper transition-colors hover:bg-signal/90 disabled:opacity-60"
      >
        <Sparkles className="h-3 w-3" strokeWidth={1.5} />
        {pending ? 'Revisando…' : 'Revisar con IA'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 p-4 overflow-y-auto"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="my-8 w-full max-w-4xl rounded-[4px] border border-bone bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bone px-6 py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-signal" strokeWidth={1.5} />
                <h3 className="text-[16px] font-medium text-ink">
                  Revisión con IA
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                  claude-opus-4-7
                </span>
              </div>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="text-steel hover:text-ink transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {state.stage === 'loading' && (
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 h-3 w-48 animate-pulse rounded-[2px] bg-bone" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-20 animate-pulse rounded-[4px] bg-bone/50"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 h-3 w-48 animate-pulse rounded-[2px] bg-bone" />
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                      {Array.from({
                        length: Math.min(images.length, 4),
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square animate-pulse rounded-[4px] bg-bone/50"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-center font-mono text-[11px] uppercase tracking-wider text-steel">
                    Analizando fotos y generando texto…
                  </p>
                </div>
              )}

              {state.stage === 'error' && (
                <div className="rounded-[4px] border border-signal/30 bg-signal-soft px-4 py-3">
                  <p className="text-[13px] text-signal">{state.message}</p>
                  <button
                    type="button"
                    onClick={handleReview}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-signal hover:text-signal/80"
                  >
                    <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                    Reintentar
                  </button>
                </div>
              )}

              {state.stage === 'ready' && (
                <div className="space-y-8">
                  {/* Text variants */}
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                        Sugerencias de descripción
                      </h4>
                      <button
                        type="button"
                        onClick={handleReview}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-steel hover:text-signal"
                      >
                        <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                        Regenerar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {state.textVariants.map((variant) => {
                        const isApplied = appliedTone === variant.tone
                        const wordCount = variant.description.trim().split(/\s+/).length
                        return (
                          <div
                            key={variant.tone}
                            className={`rounded-[4px] border bg-paper p-4 transition-colors ${
                              isApplied ? 'border-ink' : 'border-bone'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div>
                                <span className="text-[13px] font-medium text-ink">
                                  {TONE_LABEL[variant.tone]}
                                </span>
                                <span className="ml-2 font-mono text-[11px] text-steel">
                                  {wordCount} palabras
                                </span>
                              </div>
                              <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                                {TONE_HINT[variant.tone]}
                              </p>
                            </div>
                            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                              {variant.description}
                            </p>
                            <div className="mt-3 flex items-center justify-end gap-2 border-t border-bone pt-3">
                              {isApplied ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[#0A6B3D]">
                                  <Check className="h-3 w-3" strokeWidth={1.5} />
                                  Aplicado
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApplyText(variant)}
                                  className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-coal transition-colors"
                                >
                                  <Check className="h-3 w-3" strokeWidth={1.5} />
                                  Validar
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  {/* Photo review */}
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                        Revisión de fotos
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleApplyOrder(state.photoReview)}
                        className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink px-3 py-1.5 text-[12px] text-ink hover:bg-bone/50 transition-colors"
                      >
                        <Star className="h-3 w-3" strokeWidth={1.5} />
                        Aplicar orden sugerido
                      </button>
                    </div>
                    <div className="space-y-3">
                      {state.photoReview
                        .slice()
                        .sort((a, b) => a.index - b.index)
                        .map((review) => {
                          const img = images[review.index]
                          if (!img) return null
                          return (
                            <div
                              key={img.path}
                              className="flex gap-4 rounded-[4px] border border-bone bg-paper p-3"
                            >
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[4px] border border-bone bg-coal">
                                <Image
                                  src={img.url}
                                  alt=""
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-mono text-[18px] font-medium tabular-nums ${scoreColor(review.score)}`}
                                  >
                                    {review.score}
                                  </span>
                                  <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                                    score
                                  </span>
                                  {review.suggestedOrder === 0 && (
                                    <span className="rounded-[4px] bg-signal-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-signal">
                                      Hero sugerido
                                    </span>
                                  )}
                                  {review.suggestedOrder > 0 && (
                                    <span className="font-mono text-[10px] text-steel">
                                      → posición {review.suggestedOrder + 1}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-[12px] leading-relaxed text-ink">
                                  {review.critique}
                                </p>
                                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                                  Alt
                                </p>
                                <p className="text-[11px] italic text-steel line-clamp-2">
                                  {review.altText}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => startEnhancement(img, review.index)}
                                className="self-start inline-flex items-center gap-1.5 rounded-[4px] border border-bone px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-steel hover:border-signal hover:text-signal transition-colors"
                              >
                                <Wand2 className="h-3 w-3" strokeWidth={1.5} />
                                Mejorar
                              </button>
                            </div>
                          )
                        })}
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* Footer */}
            {state.stage === 'ready' && (
              <div className="flex items-center justify-between border-t border-bone px-6 py-3">
                <p className="font-mono text-[11px] text-steel">
                  Validá las sugerencias que querés aplicar al formulario.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Per-photo enhancement sub-modal (Gemini Flash Image) */}
      {enhanceModal.stage !== 'closed' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4"
          onClick={() =>
            enhanceModal.stage !== 'loading' &&
            setEnhanceModal({ stage: 'closed' })
          }
        >
          <div
            className="w-full max-w-3xl rounded-[4px] border border-bone bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-bone px-5 py-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-signal" strokeWidth={1.5} />
                <h3 className="text-[15px] font-medium text-ink">
                  Mejorar foto con IA
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                  gemini-2.5-flash-image
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  enhanceModal.stage !== 'loading' &&
                  setEnhanceModal({ stage: 'closed' })
                }
                className="text-steel hover:text-ink transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-5 py-5">
              {/* Stage: choose enhancement type */}
              {enhanceModal.stage === 'choose' && (
                <>
                  <div className="mb-4 flex gap-3">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[4px] border border-bone bg-coal">
                      <Image
                        src={enhanceModal.image.url}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <p className="text-[13px] leading-relaxed text-steel">
                      Elegí qué tipo de mejora aplicar. Vas a poder comparar
                      antes/después y aceptar o reintentar.
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {ENHANCEMENTS.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() =>
                          runEnhancement(
                            enhanceModal.image,
                            enhanceModal.index,
                            e.id,
                          )
                        }
                        className="group rounded-[4px] border border-bone bg-paper p-3 text-left transition-colors hover:border-ink"
                      >
                        <h4 className="text-[13px] font-medium text-ink group-hover:text-signal">
                          {e.label}
                        </h4>
                        <p className="mt-1 text-[12px] leading-relaxed text-steel">
                          {e.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Stage: loading */}
              {enhanceModal.stage === 'loading' && (
                <div className="space-y-4 py-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-steel">
                        Antes
                      </p>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-bone bg-coal">
                        <Image
                          src={enhanceModal.image.url}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-steel">
                        Después
                      </p>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-dashed border-bone bg-bone/30">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="space-y-2 text-center">
                            <Wand2
                              className="mx-auto h-5 w-5 animate-pulse text-signal"
                              strokeWidth={1.5}
                            />
                            <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                              Generando…
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center font-mono text-[11px] text-steel">
                    Esto toma 5-10 segundos. Gemini está editando la foto.
                  </p>
                </div>
              )}

              {/* Stage: error */}
              {enhanceModal.stage === 'error' && (
                <div className="space-y-3">
                  <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
                    {enhanceModal.message}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setEnhanceModal({
                        stage: 'choose',
                        image: enhanceModal.image,
                        index: enhanceModal.index,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink px-3 py-1.5 text-[13px] text-ink hover:bg-bone/50 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                    Volver
                  </button>
                </div>
              )}

              {/* Stage: comparing — before/after */}
              {enhanceModal.stage === 'comparing' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-steel">
                        Antes
                      </p>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-bone bg-coal">
                        <Image
                          src={enhanceModal.image.url}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-signal">
                          Después
                        </p>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                          {enhanceModal.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-ink bg-coal">
                        <Image
                          src={enhanceModal.enhancedUrl}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            {enhanceModal.stage === 'comparing' && (
              <div className="flex items-center justify-between border-t border-bone bg-paper px-5 py-3">
                <button
                  type="button"
                  onClick={() => setEnhanceModal({ stage: 'closed' })}
                  className="text-[13px] text-steel hover:text-ink transition-colors"
                >
                  Cancelar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      runEnhancement(
                        enhanceModal.image,
                        enhanceModal.index,
                        enhanceModal.type,
                      )
                    }
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink px-3 py-1.5 text-[13px] text-ink hover:bg-bone/50 transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                    Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={applyEnhancement}
                    className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-4 py-1.5 text-[13px] font-medium text-paper hover:bg-coal transition-colors"
                  >
                    <Check className="h-3 w-3" strokeWidth={1.5} />
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

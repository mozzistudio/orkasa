'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Check,
  RefreshCw,
  Send,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react'
import {
  adaptPropertyForPortal,
  savePublicationDraft,
  publishToPortals,
} from './actions'
import type {
  IntegrationProvider,
  IntegrationProviderMeta,
} from '@/lib/integrations'
import type { StoredImage } from '@/components/app/image-upload'
import type { Database } from '@/lib/database.types'

type Publication = Database['public']['Tables']['property_publications']['Row']

type PropertyShort = {
  id: string
  title: string
  description: string
  currency: string
  price: number | null
  neighborhood: string | null
  city: string | null
}

type Adapted = {
  title: string
  description: string
  titleMax: number
  descriptionMax: number
  validated: boolean
  loading: boolean
  error: string | null
}

type Stage = 'select' | 'review' | 'publish'

export function PublishWizard({
  property,
  images,
  providers,
  existingPublications,
}: {
  property: PropertyShort
  images: StoredImage[]
  providers: IntegrationProviderMeta[]
  existingPublications: Publication[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Stage state
  const [stage, setStage] = useState<Stage>('select')

  // Selected providers for this run (default = none, user opts in)
  const [selected, setSelected] = useState<Set<IntegrationProvider>>(() => {
    // Pre-select any provider that already has a draft/validated publication
    return new Set(existingPublications.map((p) => p.provider))
  })

  // Per-provider adapted state (loaded on stage transition into 'review')
  const [adapted, setAdapted] = useState<Record<string, Adapted>>(() => {
    const init: Record<string, Adapted> = {}
    for (const pub of existingPublications) {
      init[pub.provider] = {
        title: pub.adapted_title ?? '',
        description: pub.adapted_description ?? '',
        titleMax: providers.find((p) => p.id === pub.provider)?.adapter
          ?.titleMax ?? 0,
        descriptionMax:
          providers.find((p) => p.id === pub.provider)?.adapter
            ?.descriptionMax ?? 0,
        validated: pub.status === 'validated' || pub.status === 'published',
        loading: false,
        error: null,
      }
    }
    return init
  })

  // Currently focused provider in review stage (carousel-like)
  const [focusedProvider, setFocusedProvider] =
    useState<IntegrationProvider | null>(null)

  // Final publication summary
  const [publishResult, setPublishResult] = useState<{
    published: number
    error: string | null
  } | null>(null)

  function toggleProvider(id: IntegrationProvider) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function generateForProvider(id: IntegrationProvider) {
    setAdapted((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {
          title: '',
          description: '',
          titleMax: 0,
          descriptionMax: 0,
          validated: false,
        }),
        loading: true,
        error: null,
      },
    }))

    startTransition(async () => {
      const result = await adaptPropertyForPortal(property.id, id)
      if (!result.ok) {
        setAdapted((prev) => ({
          ...prev,
          [id]: {
            ...(prev[id] ?? {
              title: '',
              description: '',
              titleMax: 0,
              descriptionMax: 0,
            }),
            loading: false,
            validated: false,
            error: result.error,
          },
        }))
        return
      }
      setAdapted((prev) => ({
        ...prev,
        [id]: {
          title: result.title,
          description: result.description,
          titleMax: result.titleMax,
          descriptionMax: result.descriptionMax,
          loading: false,
          validated: false,
          error: null,
        },
      }))
    })
  }

  function validateProvider(id: IntegrationProvider) {
    const a = adapted[id]
    if (!a) return
    startTransition(async () => {
      const result = await savePublicationDraft(property.id, id, {
        title: a.title,
        description: a.description,
        imagePaths: images.map((i) => i.path),
      })
      if (!result.ok) {
        setAdapted((prev) => ({
          ...prev,
          [id]: { ...a, error: result.error ?? 'Error guardando' },
        }))
        return
      }
      setAdapted((prev) => ({
        ...prev,
        [id]: { ...a, validated: true, error: null },
      }))
    })
  }

  // When entering review stage for the first time, auto-generate for any
  // selected provider that doesn't have data yet.
  useEffect(() => {
    if (stage !== 'review') return
    for (const id of selected) {
      if (!adapted[id] || (!adapted[id].title && !adapted[id].description && !adapted[id].loading && !adapted[id].error)) {
        generateForProvider(id)
      }
    }
    if (!focusedProvider && selected.size > 0) {
      setFocusedProvider(Array.from(selected)[0]!)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  function handlePublish() {
    setStage('publish')
    startTransition(async () => {
      const result = await publishToPortals(property.id)
      setPublishResult({
        published: result.published,
        error: result.error ?? null,
      })
      router.refresh()
    })
  }

  const validatedCount = Array.from(selected).filter(
    (id) => adapted[id]?.validated,
  ).length

  return (
    <div>
      {/* Stage indicator */}
      <div className="mb-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[1.5px]">
        <StageStep
          label="01 · Seleccionar"
          active={stage === 'select'}
          done={stage !== 'select'}
        />
        <ChevronRight className="h-3 w-3 text-steel" strokeWidth={1.5} />
        <StageStep
          label="02 · Revisar"
          active={stage === 'review'}
          done={stage === 'publish'}
        />
        <ChevronRight className="h-3 w-3 text-steel" strokeWidth={1.5} />
        <StageStep label="03 · Publicar" active={stage === 'publish'} done={false} />
      </div>

      {/* Stage 1: select platforms */}
      {stage === 'select' && (
        <div>
          <p className="mb-4 text-[13px] text-steel">
            Elegí en qué plataformas querés publicar este listing.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {providers.map((p) => {
              const isSelected = selected.has(p.id)
              const existing = existingPublications.find(
                (pub) => pub.provider === p.id,
              )
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProvider(p.id)}
                  className={`flex items-start gap-3 rounded-[4px] border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-ink bg-bone/30'
                      : 'border-bone hover:border-ink'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[13px] font-medium text-ink">
                    {p.shortLabel}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-medium text-ink">
                        {p.label}
                      </h3>
                      {existing?.status === 'published' && (
                        <span className="rounded-[4px] bg-[#0A6B3D]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#0A6B3D]">
                          publicado
                        </span>
                      )}
                      {existing?.status === 'validated' && (
                        <span className="rounded-[4px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink">
                          validado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                      {p.adapter?.titleMax
                        ? `título ${p.adapter.titleMax} · `
                        : ''}
                      desc {p.adapter?.descriptionMax} · tono{' '}
                      {p.adapter?.tone}
                    </p>
                  </div>
                  <div
                    className={`mt-1 h-4 w-4 shrink-0 rounded-[2px] border ${
                      isSelected
                        ? 'border-ink bg-ink text-paper'
                        : 'border-bone'
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-bone pt-4">
            <p className="font-mono text-[11px] text-steel">
              {selected.size} plataforma{selected.size !== 1 ? 's' : ''}{' '}
              seleccionada{selected.size !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={() => setStage('review')}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              Generar adaptaciones IA
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: review per platform */}
      {stage === 'review' && (
        <div>
          <div className="mb-6 flex items-center gap-2">
            {Array.from(selected).map((id) => {
              const meta = providers.find((p) => p.id === id)
              if (!meta) return null
              const a = adapted[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFocusedProvider(id)}
                  className={`relative inline-flex items-center gap-2 rounded-[4px] border px-3 py-2 transition-colors ${
                    focusedProvider === id
                      ? 'border-ink bg-bone/30'
                      : 'border-bone hover:border-ink'
                  }`}
                >
                  <span className="font-mono text-[10px] font-medium text-ink">
                    {meta.shortLabel}
                  </span>
                  <span className="text-[12px] text-ink">{meta.label}</span>
                  {a?.validated && (
                    <Check
                      className="h-3 w-3 text-[#0A6B3D]"
                      strokeWidth={2.5}
                    />
                  )}
                  {a?.loading && (
                    <Sparkles
                      className="h-3 w-3 animate-pulse text-signal"
                      strokeWidth={1.5}
                    />
                  )}
                  {a?.error && (
                    <AlertCircle
                      className="h-3 w-3 text-signal"
                      strokeWidth={1.5}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {focusedProvider &&
            (() => {
              const meta = providers.find((p) => p.id === focusedProvider)
              if (!meta) return null
              const a = adapted[focusedProvider]
              return (
                <ProviderReviewCard
                  meta={meta}
                  adapted={a}
                  images={images}
                  onTitleChange={(title) =>
                    setAdapted((prev) => ({
                      ...prev,
                      [focusedProvider]: {
                        ...(prev[focusedProvider] ?? {
                          title: '',
                          description: '',
                          titleMax: meta.adapter?.titleMax ?? 0,
                          descriptionMax: meta.adapter?.descriptionMax ?? 0,
                          validated: false,
                          loading: false,
                          error: null,
                        }),
                        title,
                        validated: false,
                      },
                    }))
                  }
                  onDescriptionChange={(description) =>
                    setAdapted((prev) => ({
                      ...prev,
                      [focusedProvider]: {
                        ...(prev[focusedProvider] ?? {
                          title: '',
                          description: '',
                          titleMax: meta.adapter?.titleMax ?? 0,
                          descriptionMax: meta.adapter?.descriptionMax ?? 0,
                          validated: false,
                          loading: false,
                          error: null,
                        }),
                        description,
                        validated: false,
                      },
                    }))
                  }
                  onRegenerate={() => generateForProvider(focusedProvider)}
                  onValidate={() => validateProvider(focusedProvider)}
                />
              )
            })()}

          <div className="mt-8 flex items-center justify-between border-t border-bone pt-4">
            <button
              type="button"
              onClick={() => setStage('select')}
              className="inline-flex items-center gap-1.5 text-[13px] text-steel hover:text-ink transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              Volver
            </button>
            <div className="flex items-center gap-3">
              <p className="font-mono text-[11px] text-steel">
                {validatedCount}/{selected.size} validadas
              </p>
              <button
                type="button"
                onClick={handlePublish}
                disabled={validatedCount === 0 || pending}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-signal px-4 py-2 text-[13px] font-medium text-paper hover:bg-signal/90 transition-colors disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                Publicar {validatedCount > 0 ? `(${validatedCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: publish result */}
      {stage === 'publish' && (
        <div className="rounded-[4px] border border-bone bg-paper p-8 text-center">
          {pending ? (
            <div className="space-y-3">
              <Sparkles
                className="mx-auto h-6 w-6 animate-pulse text-signal"
                strokeWidth={1.5}
              />
              <p className="font-mono text-[11px] uppercase tracking-wider text-steel">
                Publicando…
              </p>
            </div>
          ) : publishResult?.error ? (
            <div className="space-y-3">
              <AlertCircle
                className="mx-auto h-6 w-6 text-signal"
                strokeWidth={1.5}
              />
              <p className="text-[14px] font-medium text-ink">Error</p>
              <p className="text-[13px] text-signal">{publishResult.error}</p>
              <button
                type="button"
                onClick={() => setStage('review')}
                className="mt-2 inline-flex items-center gap-1.5 rounded-[4px] border border-ink px-3 py-1.5 text-[13px] text-ink hover:bg-bone/50 transition-colors"
              >
                Volver
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#0A6B3D]/10">
                <Check
                  className="h-6 w-6 text-[#0A6B3D]"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <p className="text-[16px] font-medium text-ink">
                  Publicación enviada
                </p>
                <p className="mt-1 text-[13px] text-steel">
                  {publishResult?.published} plataforma
                  {publishResult?.published !== 1 ? 's' : ''} marcada
                  {publishResult?.published !== 1 ? 's' : ''} como publicada
                  {publishResult?.published !== 1 ? 's' : ''}.
                </p>
                <p className="mx-auto mt-3 max-w-md font-mono text-[11px] text-steel">
                  Nota: las integraciones reales (OAuth + sync engine por
                  portal) están en roadmap. Por ahora se registra el intento
                  de publicación con preview URL en Orkasa.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => router.push(`/app/properties/${property.id}`)}
                  className="rounded-[4px] border border-ink px-4 py-2 text-[13px] text-ink hover:bg-bone/50 transition-colors"
                >
                  Volver a la propiedad
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StageStep({
  label,
  active,
  done,
}: {
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <span
      className={`${
        active
          ? 'text-ink'
          : done
            ? 'text-[#0A6B3D]'
            : 'text-steel'
      }`}
    >
      {label}
    </span>
  )
}

function ProviderReviewCard({
  meta,
  adapted,
  images,
  onTitleChange,
  onDescriptionChange,
  onRegenerate,
  onValidate,
}: {
  meta: IntegrationProviderMeta
  adapted: Adapted | undefined
  images: StoredImage[]
  onTitleChange: (s: string) => void
  onDescriptionChange: (s: string) => void
  onRegenerate: () => void
  onValidate: () => void
}) {
  if (!adapted || adapted.loading) {
    return (
      <div className="rounded-[4px] border border-bone bg-paper p-6">
        <div className="space-y-3">
          <div className="h-5 w-1/3 animate-pulse rounded-[2px] bg-bone" />
          <div className="h-9 w-full animate-pulse rounded-[2px] bg-bone/60" />
          <div className="h-32 w-full animate-pulse rounded-[2px] bg-bone/60" />
        </div>
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-wider text-steel">
          Adaptando para {meta.label}…
        </p>
      </div>
    )
  }

  if (adapted.error) {
    return (
      <div className="rounded-[4px] border border-signal/30 bg-signal-soft p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-signal" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-[13px] text-signal">{adapted.error}</p>
            <button
              type="button"
              onClick={onRegenerate}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] border border-signal px-3 py-1.5 text-[12px] text-signal hover:bg-signal hover:text-paper transition-colors"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const titleOver = meta.adapter && adapted.title.length > meta.adapter.titleMax
  const descOver =
    meta.adapter && adapted.description.length > meta.adapter.descriptionMax

  return (
    <div className="rounded-[4px] border border-bone bg-paper p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-bone font-mono text-[13px] font-medium text-ink">
            {meta.shortLabel}
          </div>
          <div>
            <h3 className="text-[15px] font-medium text-ink">{meta.label}</h3>
            <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
              tono {meta.adapter?.tone} · {meta.adapter?.appendsCta ? 'con CTA' : 'sin CTA'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone px-3 py-1.5 text-[12px] text-steel hover:border-ink hover:text-ink transition-colors"
        >
          <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
          Regenerar
        </button>
      </div>

      {/* Title field (only for platforms that have a title) */}
      {meta.adapter && meta.adapter.titleMax > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-mono text-[10px] uppercase tracking-wider text-steel">
              Título
            </label>
            <span
              className={`font-mono text-[11px] tabular-nums ${
                titleOver ? 'text-signal' : 'text-steel'
              }`}
            >
              {adapted.title.length} / {meta.adapter.titleMax}
            </span>
          </div>
          <input
            type="text"
            value={adapted.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={`h-9 w-full rounded-[4px] border bg-paper px-3 text-[13px] focus:outline-none ${
              titleOver
                ? 'border-signal focus:border-signal'
                : 'border-bone focus:border-ink'
            }`}
          />
        </div>
      )}

      {/* Description field */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="font-mono text-[10px] uppercase tracking-wider text-steel">
            Descripción
          </label>
          <span
            className={`font-mono text-[11px] tabular-nums ${
              descOver ? 'text-signal' : 'text-steel'
            }`}
          >
            {adapted.description.length} / {meta.adapter?.descriptionMax ?? 0}
          </span>
        </div>
        <textarea
          rows={meta.adapter?.tone === 'concise' ? 4 : 8}
          value={adapted.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className={`w-full rounded-[4px] border bg-paper px-3 py-2 font-sans text-[13px] leading-relaxed focus:outline-none ${
            descOver
              ? 'border-signal focus:border-signal'
              : 'border-bone focus:border-ink'
          }`}
        />
      </div>

      {/* Image preview (first 4) */}
      {images.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-steel">
            Fotos a publicar ({images.length})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {images.slice(0, 4).map((img, i) => (
              <div
                key={img.path}
                className="relative aspect-square overflow-hidden rounded-[4px] border border-bone bg-coal"
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded-[3px] bg-signal px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-paper">
                    Hero
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-bone pt-4">
        {adapted.validated ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#0A6B3D]">
            <Check className="h-3 w-3" strokeWidth={1.5} />
            Validado
          </span>
        ) : (
          <button
            type="button"
            onClick={onValidate}
            disabled={titleOver || descOver}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-1.5 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60"
          >
            <Check className="h-3 w-3" strokeWidth={1.5} />
            Validar para esta plataforma
          </button>
        )}
      </div>
    </div>
  )
}

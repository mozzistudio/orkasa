'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Check,
  Send,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import {
  adaptPropertyForPortal,
  savePublicationDraft,
  publishOnePortal,
} from './actions'
import {
  type IntegrationProvider,
  type IntegrationProviderMeta,
} from '@/lib/integrations'
import type { StoredImage } from '@/components/app/image-upload'
import type { Database } from '@/lib/database.types'
import { PlatformLogo } from '@/components/app/platform-logo'
import {
  StageStep,
  ChannelStatusChip,
  ProviderReviewCard,
  type Adapted,
  type PerChannelStatus,
} from '@/components/app/publish-shared'

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

  const [channelStatus, setChannelStatus] = useState<
    Record<string, PerChannelStatus>
  >({})

  // Final publication summary
  const [publishResult, setPublishResult] = useState<{
    published: number
    failed: number
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

  /**
   * Publish to each validated channel sequentially, updating per-channel
   * status as we go. This drives the live progress bar in stage 3 — the user
   * sees each chip flip from publishing→published in real time instead of
   * a single spinner-then-done.
   */
  function handlePublish() {
    setStage('publish')
    const queue = Array.from(selected).filter(
      (id) => adapted[id]?.validated,
    )

    // Initialize all to idle
    const initial: Record<string, PerChannelStatus> = {}
    for (const id of queue) initial[id] = { stage: 'idle' }
    setChannelStatus(initial)

    startTransition(async () => {
      let published = 0
      let failed = 0
      for (const provider of queue) {
        setChannelStatus((prev) => ({
          ...prev,
          [provider]: { stage: 'publishing' },
        }))
        const result = await publishOnePortal(property.id, provider)
        if (result.ok) {
          published++
          setChannelStatus((prev) => ({
            ...prev,
            [provider]: { stage: 'published', externalUrl: result.externalUrl },
          }))
        } else {
          failed++
          setChannelStatus((prev) => ({
            ...prev,
            [provider]: { stage: 'failed', error: result.error },
          }))
        }
      }
      setPublishResult({ published, failed })
      router.refresh()
    })
  }

  const validatedCount = Array.from(selected).filter(
    (id) => adapted[id]?.validated,
  ).length

  return (
    <div>
      {/* Stage indicator — horizontal scroll on mobile, wraps on desktop */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap font-mono text-[10px] uppercase tracking-[1.5px] scrollbar-hide md:mb-8">
        <StageStep
          label="01 · Seleccionar"
          active={stage === 'select'}
          done={stage !== 'select'}
        />
        <ChevronRight className="h-3 w-3 shrink-0 text-steel" strokeWidth={1.5} />
        <StageStep
          label="02 · Revisar"
          active={stage === 'review'}
          done={stage === 'publish'}
        />
        <ChevronRight className="h-3 w-3 shrink-0 text-steel" strokeWidth={1.5} />
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
                  <PlatformLogo provider={p} size={40} />
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

          <div className="mt-6 flex flex-col gap-3 border-t border-bone pt-4 md:mt-8 md:flex-row md:items-center md:justify-between">
            <p className="font-mono text-[11px] text-steel">
              {selected.size} plataforma{selected.size !== 1 ? 's' : ''}{' '}
              seleccionada{selected.size !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={() => setStage('review')}
              disabled={selected.size === 0}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-ink px-4 py-2.5 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60 md:w-auto md:py-2"
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
          {/* Provider tabs — horizontal scroll on mobile */}
          <div className="-mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {Array.from(selected).map((id) => {
              const meta = providers.find((p) => p.id === id)
              if (!meta) return null
              const a = adapted[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFocusedProvider(id)}
                  className={`relative inline-flex shrink-0 items-center gap-2 rounded-[4px] border px-3 py-2 transition-colors ${
                    focusedProvider === id
                      ? 'border-ink bg-bone/30'
                      : 'border-bone hover:border-ink'
                  }`}
                >
                  <PlatformLogo provider={meta} size={20} />
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

          <div className="mt-6 flex flex-col gap-3 border-t border-bone pt-4 md:mt-8 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={() => setStage('select')}
              className="inline-flex items-center gap-1.5 text-[13px] text-steel hover:text-ink transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              Volver
            </button>
            <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3">
              <p className="text-center font-mono text-[11px] text-steel md:text-left">
                {validatedCount}/{selected.size} validadas
              </p>
              <button
                type="button"
                onClick={handlePublish}
                disabled={validatedCount === 0 || pending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-signal px-4 py-2.5 text-[13px] font-medium text-paper hover:bg-signal/90 transition-colors disabled:opacity-60 md:w-auto md:py-2"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                Publicar {validatedCount > 0 ? `(${validatedCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: live per-channel publishing feed */}
      {stage === 'publish' && (
        <div>
          <div className="mb-6 flex items-center gap-3">
            {pending ? (
              <Loader2
                className="h-5 w-5 animate-spin text-signal"
                strokeWidth={1.5}
              />
            ) : publishResult && publishResult.failed === 0 ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#0A6B3D]/10">
                <Check
                  className="h-4 w-4 text-[#0A6B3D]"
                  strokeWidth={2}
                />
              </div>
            ) : publishResult ? (
              <AlertCircle
                className="h-5 w-5 text-signal"
                strokeWidth={1.5}
              />
            ) : null}
            <h2 className="text-[18px] font-medium tracking-[-0.3px] text-ink md:text-[20px]">
              {pending
                ? 'Publicando en paralelo…'
                : publishResult
                  ? publishResult.failed === 0
                    ? `${publishResult.published} canal${publishResult.published !== 1 ? 'es' : ''} publicado${publishResult.published !== 1 ? 's' : ''}`
                    : `${publishResult.published} OK · ${publishResult.failed} con error`
                  : 'Listo para publicar'}
            </h2>
          </div>

          <ul className="divide-y divide-bone overflow-hidden rounded-[4px] border border-bone bg-paper">
            {Object.entries(channelStatus).map(([providerId, st]) => {
              const meta = providers.find((p) => p.id === providerId)
              if (!meta) return null
              return (
                <li
                  key={providerId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <PlatformLogo provider={meta} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {meta.label}
                    </p>
                    {st.stage === 'failed' && (
                      <p className="truncate font-mono text-[11px] text-signal">
                        {st.error}
                      </p>
                    )}
                    {st.stage === 'published' && (
                      <a
                        href={st.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 truncate font-mono text-[11px] text-steel transition-colors hover:text-signal"
                      >
                        Ver preview <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.5} />
                      </a>
                    )}
                    {st.stage === 'idle' && (
                      <p className="font-mono text-[11px] text-steel">
                        En cola…
                      </p>
                    )}
                    {st.stage === 'publishing' && (
                      <p className="font-mono text-[11px] text-signal">
                        Publicando…
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <ChannelStatusChip status={st.stage} />
                  </div>
                </li>
              )
            })}
          </ul>

          {!pending && publishResult && (
            <>
              <p className="mt-6 max-w-2xl font-mono text-[11px] text-steel">
                Nota: las integraciones reales (OAuth + sync engine por portal)
                están en roadmap. Por ahora cada canal queda registrado con
                preview URL en Orkasa.
              </p>
              <div className="mt-6 flex flex-col gap-3 border-t border-bone pt-4 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => setStage('review')}
                  className="inline-flex items-center gap-1.5 text-[13px] text-steel transition-colors hover:text-ink"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Volver al review
                </button>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/app/properties/${property.id}`)
                  }
                  className="rounded-[4px] bg-ink px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-coal md:py-2"
                >
                  Volver a la propiedad
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}


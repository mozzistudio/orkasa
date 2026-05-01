'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Check,
  ChevronLeft,
  Send,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import {
  adaptPropertyForPortal,
  savePublicationDraft,
} from '../../../properties/[id]/publish/actions'
import type {
  IntegrationProvider,
  IntegrationProviderMeta,
} from '@/lib/integrations'
import type { StoredImage } from '@/components/app/image-upload'
import {
  ProviderReviewCard,
  type Adapted,
} from '@/components/app/publish-shared'

export function StepPlatformContent({
  propertyId,
  images,
  providers,
  onPublish,
  onBack,
}: {
  propertyId: string
  images: StoredImage[]
  providers: IntegrationProviderMeta[]
  onPublish: () => void
  onBack: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [selected] = useState<IntegrationProvider[]>(() =>
    providers.map((p) => p.id),
  )
  const [adapted, setAdapted] = useState<Record<string, Adapted>>({})
  const [focusedProvider, setFocusedProvider] =
    useState<IntegrationProvider | null>(null)

  function generateForProvider(id: IntegrationProvider) {
    const meta = providers.find((p) => p.id === id)
    setAdapted((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {
          title: '',
          description: '',
          titleMax: meta?.adapter?.titleMax ?? 0,
          descriptionMax: meta?.adapter?.descriptionMax ?? 0,
          validated: false,
        }),
        loading: true,
        error: null,
      },
    }))

    startTransition(async () => {
      const result = await adaptPropertyForPortal(propertyId, id)
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
      const result = await savePublicationDraft(propertyId, id, {
        title: a.title,
        description: a.description,
        imagePaths: images.map((img) => img.path),
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

  useEffect(() => {
    for (const id of selected) {
      if (!adapted[id]) {
        generateForProvider(id)
      }
    }
    if (!focusedProvider && selected.length > 0) {
      setFocusedProvider(selected[0]!)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validatedCount = selected.filter(
    (id) => adapted[id]?.validated,
  ).length

  return (
    <div>
      {/* Provider tabs */}
      <div className="-mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {selected.map((id) => {
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
              <span className="font-mono text-[10px] font-medium text-ink">
                {meta.shortLabel}
              </span>
              <span className="text-[12px] text-ink">{meta.label}</span>
              {a?.validated && (
                <Check className="h-3 w-3 text-[#0A6B3D]" strokeWidth={2.5} />
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

      {/* Desktop footer */}
      <div className="mt-6 hidden md:flex items-center justify-between border-t border-bone pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-steel hover:text-ink transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[11px] text-steel">
            {validatedCount}/{selected.length} validadas
          </p>
          <button
            type="button"
            onClick={onPublish}
            disabled={validatedCount === 0 || pending}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-signal px-4 py-2 text-[13px] font-medium text-paper hover:bg-signal/90 transition-colors disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            Publicar ({validatedCount})
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
          onClick={onPublish}
          disabled={validatedCount === 0 || pending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-signal px-3 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-signal/80 disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          Publicar ({validatedCount})
        </button>
      </div>
    </div>
  )
}

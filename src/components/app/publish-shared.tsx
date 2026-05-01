'use client'

import Image from 'next/image'
import {
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  aspectClass,
  aspectLabel,
  type IntegrationProviderMeta,
} from '@/lib/integrations'
import type { StoredImage } from '@/components/app/image-upload'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Adapted = {
  title: string
  description: string
  titleMax: number
  descriptionMax: number
  validated: boolean
  loading: boolean
  error: string | null
}

export type PerChannelStatus =
  | { stage: 'idle' }
  | { stage: 'publishing' }
  | { stage: 'published'; externalUrl: string }
  | { stage: 'failed'; error: string }

// ─── StageStep ───────────────────────────────────────────────────────────────

export function StageStep({
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

// ─── ChannelStatusChip ───────────────────────────────────────────────────────

export function ChannelStatusChip({
  status,
}: {
  status: 'idle' | 'publishing' | 'published' | 'failed'
}) {
  if (status === 'idle') {
    return (
      <span className="rounded-[4px] bg-bone px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
        En cola
      </span>
    )
  }
  if (status === 'publishing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-[4px] bg-signal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
        Pub.
      </span>
    )
  }
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#0A6B3D]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#0A6B3D]">
        <Check className="h-3 w-3" strokeWidth={2} />
        OK
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[4px] bg-signal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal">
      <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
      Error
    </span>
  )
}

// ─── ProviderReviewCard ──────────────────────────────────────────────────────

export function ProviderReviewCard({
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
    <div className="rounded-[4px] border border-bone bg-paper p-4 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[13px] font-medium text-ink">
            {meta.shortLabel}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-medium text-ink">{meta.label}</h3>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-steel">
              tono {meta.adapter?.tone}
              {meta.adapter ? ` · foto ${aspectLabel(meta.adapter.imageAspect)}` : ''}
              {meta.adapter?.allowsHashtags ? ' · #hashtags' : ''}
              {meta.adapter?.appendsCta ? ' · con CTA' : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-bone px-2 py-1.5 text-[12px] text-steel hover:border-ink hover:text-ink transition-colors md:px-3"
          aria-label="Regenerar"
        >
          <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
          <span className="hidden md:inline">Regenerar</span>
        </button>
      </div>

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

      {images.length > 0 && meta.adapter && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
              Fotos · cropeadas a {aspectLabel(meta.adapter.imageAspect)}
              {meta.adapter.maxImages
                ? ` · max ${meta.adapter.maxImages}`
                : ''}
            </p>
            <p className="font-mono text-[10px] tabular-nums text-steel">
              {Math.min(images.length, meta.adapter.maxImages ?? images.length)}
              {' '}/ {images.length}
            </p>
          </div>
          {(() => {
            const cap = meta.adapter!.maxImages ?? images.length
            const visible = images.slice(0, Math.min(cap, 4))
            const aspect = aspectClass(meta.adapter!.imageAspect)
            const isVertical =
              meta.adapter!.imageAspect === 'vertical' ||
              meta.adapter!.imageAspect === 'portrait'
            return (
              <div
                className={`grid gap-2 ${isVertical ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}
              >
                {visible.map((img, i) => (
                  <div
                    key={img.path}
                    className={`relative overflow-hidden rounded-[4px] border border-bone bg-coal ${aspect}`}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 200px"
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
            )
          })()}
        </div>
      )}

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
            disabled={!!titleOver || !!descOver}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-ink px-3 py-2.5 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60 md:w-auto md:py-1.5"
          >
            <Check className="h-3 w-3" strokeWidth={1.5} />
            Validar para esta plataforma
          </button>
        )}
      </div>
    </div>
  )
}

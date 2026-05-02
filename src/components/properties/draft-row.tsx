'use client'

import { Link } from '@/i18n/navigation'
import { Image as ImageIcon } from 'lucide-react'
import { formatPriceCompact } from '@/lib/utils'
import { summarizeMissing } from '@/lib/properties/completion'
import { hasBlockingError } from '@/lib/properties/anomalies'
import type { DraftProperty } from '@/lib/queries/properties'
import type { StoredImage } from '@/lib/properties/types'
import { CompletionBar } from './completion-bar'

const FALLBACK_GRADIENTS = [
  'from-[#8B7355] to-[#5C4A35]',
  'from-[#5D7A8C] to-[#2E4A5C]',
  'from-[#A89074] to-[#6B5440]',
  'from-[#7C8B6F] to-[#4A5C42]',
]

function coverUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images[0] as StoredImage | undefined
  return first?.url ?? null
}

export function DraftRow({
  draft,
  fallbackIndex = 0,
}: {
  draft: DraftProperty
  fallbackIndex?: number
}) {
  const cover = coverUrl(draft.images)
  const error = draft.anomalies.find((a) => a.level === 'error')
  const isError = hasBlockingError(draft.anomalies)
  const noTitleAnomaly = draft.anomalies.find(
    (a) => a.field === 'title' && a.level === 'warn',
  )
  const showPlaceholderTitle =
    !!noTitleAnomaly || !draft.title || draft.title.trim().length === 0

  return (
    <Link
      href={`/app/properties/${draft.id}`}
      className={`grid cursor-pointer grid-cols-[56px_1fr_180px_110px_auto] items-center gap-[14px] border-b border-bone px-4 py-3 transition-colors last:border-b-0 hover:bg-paper-warm ${
        isError ? 'bg-signal-bg/40' : ''
      }`}
    >
      {/* Thumb */}
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className="h-[42px] w-[56px] rounded-[5px] border border-bone object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={`flex h-[42px] w-[56px] items-center justify-center rounded-[5px] border border-bone bg-gradient-to-br ${FALLBACK_GRADIENTS[fallbackIndex % FALLBACK_GRADIENTS.length]}`}
        >
          <ImageIcon className="h-3 w-3 text-paper/60" strokeWidth={1.5} />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">
          {showPlaceholderTitle ? (
            <span className="italic font-normal text-steel-soft">
              (Sin título)
            </span>
          ) : (
            draft.title
          )}
          {draft.property_type && (
            <span className="text-steel"> · {draft.property_type}</span>
          )}
        </div>
        <div
          className={`mt-[2px] truncate text-[11px] ${
            isError
              ? 'font-medium text-signal-deep'
              : 'text-steel'
          }`}
        >
          {isError && error
            ? `⚠ ${error.message}`
            : [draft.neighborhood, draft.city].filter(Boolean).join(' · ') ||
              '—'}
        </div>
      </div>

      {/* Completion */}
      <CompletionBar
        pct={draft.completion.percentage}
        tone={draft.completion.tone}
        label={summarizeMissing(draft.completion)}
      />

      {/* Price */}
      <div className="text-right">
        <div
          className={`font-mono text-[12px] ${
            isError ? 'font-medium text-signal-deep' : 'text-ink'
          }`}
        >
          {draft.price ? formatPriceCompact(draft.price) : '—'}
        </div>
        <div
          className={`mt-[2px] text-[10px] ${
            isError ? 'font-medium text-signal-deep' : 'text-steel'
          }`}
        >
          {error?.suggestion ??
            (draft.listing_type === 'sale' ? 'Venta' : 'Mensual')}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className={`rounded-[5px] border px-3 py-[6px] text-[12px] font-medium whitespace-nowrap transition-colors ${
          isError
            ? 'border-signal bg-signal text-white hover:bg-signal-deep'
            : draft.completion.isPublishable
              ? 'border-green-mark bg-green-mark text-white hover:opacity-90'
              : 'border-bone bg-paper text-ink hover:border-steel-soft'
        }`}
      >
        {isError
          ? 'Corregir'
          : draft.completion.isPublishable
            ? 'Publicar'
            : 'Continuar'}
      </button>
    </Link>
  )
}

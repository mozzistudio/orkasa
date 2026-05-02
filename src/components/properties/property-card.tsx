'use client'

import { Link } from '@/i18n/navigation'
import { MoreHorizontal } from 'lucide-react'
import {
  ShareIcon,
  ArrowDownIcon,
  PeopleIcon,
  StarIcon,
} from '@/components/icons/icons'
import { formatPriceCompact } from '@/lib/utils'
import {
  computePropertyAlert,
  computePropertyStatus,
} from '@/lib/properties/computed-status'
import type {
  AlertActionType,
  PropertyWithMetrics,
  StoredImage,
} from '@/lib/properties/types'
import { PropertyStatusTag, ListingTypeTag } from './property-status-tag'
import { PropertyAlert } from './property-alert'
import { PropertyMetrics } from './property-metrics'

const FALLBACK_GRADIENTS = [
  'from-[#5D7A8C] to-[#2E4A5C]',
  'from-[#7C8B6F] to-[#4A5C42]',
  'from-[#8B7355] to-[#5C4A35]',
  'from-[#A89074] to-[#6B5440]',
  'from-[#6F7C8B] to-[#424B5C]',
]

const ACTION_STYLES: Record<AlertActionType, string> = {
  primary:
    'border-ink bg-ink text-white hover:bg-coal',
  signal:
    'border-signal bg-signal text-white hover:bg-signal-deep hover:border-signal-deep',
  amber:
    'border-amber-mark bg-amber-mark text-white hover:opacity-90',
  success:
    'border-green-mark bg-green-mark text-white hover:opacity-90',
  default:
    'border-bone bg-paper text-ink hover:border-steel-soft',
}

function coverUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images[0] as StoredImage | undefined
  return first?.url ?? null
}

function MiniBtnIcon({ tag }: { tag: string }) {
  switch (tag) {
    case 'caliente':
      return <ShareIcon size={13} />
    case 'atencion':
      return <ArrowDownIcon size={13} />
    case 'estancada':
      return <MoreHorizontal className="h-[13px] w-[13px]" strokeWidth={1.5} />
    case 'vence_pronto':
      return <PeopleIcon size={13} />
    case 'oportunidad':
      return <StarIcon size={13} />
    default:
      return <ShareIcon size={13} />
  }
}

export function PropertyCard({
  property,
  fallbackIndex = 0,
}: {
  property: PropertyWithMetrics
  fallbackIndex?: number
}) {
  const status = computePropertyStatus(property)
  const alert = computePropertyAlert(property)
  const cover = coverUrl(property.images)
  const gradient = FALLBACK_GRADIENTS[fallbackIndex % FALLBACK_GRADIENTS.length]
  const m = property.metrics

  return (
    <Link
      href={`/app/properties/${property.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[10px] border border-bone bg-paper transition-all duration-100 hover:-translate-y-px hover:border-steel-soft hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
    >
      {/* Photo */}
      <div className="relative h-[150px] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradient}`}
            aria-hidden
          />
        )}
        <div className="absolute left-[10px] top-[10px] flex flex-wrap gap-[5px]">
          <PropertyStatusTag status={status} />
          <ListingTypeTag listingType={property.listing_type} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-[14px] pt-[14px]">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-medium leading-tight text-ink truncate">
              {property.title}
            </div>
            <div className="mt-[2px] truncate text-[11px] text-steel">
              {[property.neighborhood, property.city]
                .filter(Boolean)
                .join(' · ') || '—'}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="font-mono text-[14px] font-medium text-ink whitespace-nowrap">
              {property.price ? formatPriceCompact(property.price) : '—'}
            </div>
            {m.previousPrice && m.recentPriceDrop ? (
              <div className="mt-[2px] font-mono text-[9px] uppercase tracking-[0.6px] text-green-text">
                ↓ desde {formatPriceCompact(m.previousPrice)}
              </div>
            ) : (
              <div className="mt-[2px] font-mono text-[9px] uppercase tracking-[0.6px] text-steel-soft">
                {property.listing_type === 'sale' ? 'Venta' : 'Mensual'}
              </div>
            )}
          </div>
        </div>

        <PropertyMetrics
          metrics={[
            {
              value: m.totalLeads,
              label: 'leads',
              tone:
                m.totalLeads === 0 ? 'warn' : m.recentLeads7d >= 3 ? 'good' : 'default',
            },
            {
              value: m.visitsCount,
              label: 'visitas',
              tone:
                m.totalLeads >= 5 && m.visitsCount === 0 ? 'warn' : 'default',
            },
            (() => {
              const created = property.created_at
                ? Math.floor(
                    (Date.now() - new Date(property.created_at).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                : 0
              return {
                value: `${created}d`,
                label: 'publicada',
                tone: created > 14 && m.totalLeads === 0 ? 'warn' : 'default',
              }
            })(),
          ]}
        />

        <PropertyAlert tone={alert.tone} message={alert.message} />

        <div className="mt-auto flex items-center gap-[6px]">
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className={`flex-1 inline-flex items-center justify-center gap-[5px] rounded-[5px] border px-[11px] py-[6px] text-[12px] font-medium whitespace-nowrap transition-colors ${ACTION_STYLES[alert.action.type]}`}
          >
            {alert.action.label}
          </button>
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[5px] border border-bone bg-paper-warm text-steel transition-colors hover:border-steel-soft hover:bg-paper hover:text-ink"
            title="Más acciones"
          >
            <MiniBtnIcon tag={status.tag} />
          </button>
        </div>
      </div>
    </Link>
  )
}

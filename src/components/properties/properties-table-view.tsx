'use client'

import { Link } from '@/i18n/navigation'
import { MoreHorizontal } from 'lucide-react'
import { formatPriceCompact } from '@/lib/utils'
import { formatRelativeEs } from '@/lib/compliance-copy'
import {
  computePropertyStatus,
  getStatusLabel,
} from '@/lib/properties/computed-status'
import type {
  ArchivedProperty,
  DraftProperty,
} from '@/lib/queries/properties'
import type {
  PropertyWithMetrics,
  StoredImage,
} from '@/lib/properties/types'
import { CompletionBar } from './completion-bar'
import { summarizeMissing } from '@/lib/properties/completion'

function coverUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images[0] as StoredImage | undefined
  return first?.url ?? null
}

const STATUS_TONE: Record<string, string> = {
  signal: 'bg-signal-bg text-signal-deep',
  amber: 'bg-amber-bg text-amber-text',
  green: 'bg-green-bg text-green-text',
  neutral: 'bg-bone-soft text-steel',
}

export function PropertiesTableView({
  active,
  drafts,
  archived,
}: {
  active: PropertyWithMetrics[]
  drafts: DraftProperty[]
  archived: ArchivedProperty[]
}) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-bone bg-paper">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b border-bone bg-paper-warm">
            <Th className="w-[36px] pl-[18px]" />
            <Th className="w-[60px]">Thumb</Th>
            <Th>Título</Th>
            <Th className="w-[100px]">Tipo</Th>
            <Th className="w-[120px]">Status</Th>
            <Th className="w-[120px]">Leads / Visitas</Th>
            <Th className="w-[110px] text-right">Precio</Th>
            <Th className="w-[120px]">Estado / Vence</Th>
            <Th className="w-[36px] pr-[18px]" />
          </tr>
        </thead>
        <tbody>
          {active.length > 0 && (
            <>
              <GroupHeader label={`🟢 Activas · ${active.length}`} />
              {active.map((p) => (
                <ActiveRow key={p.id} property={p} />
              ))}
            </>
          )}
          {drafts.length > 0 && (
            <>
              <GroupHeader label={`📝 En proceso · ${drafts.length}`} />
              {drafts.map((d) => (
                <DraftTableRow key={d.id} draft={d} />
              ))}
            </>
          )}
          {archived.length > 0 && (
            <>
              <GroupHeader label={`📦 Archivo · ${archived.length}`} />
              {archived.map((p) => (
                <ArchivedTableRow key={p.id} archived={p} />
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Th({
  children,
  className = '',
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={`px-3 py-[10px] font-mono text-[10px] uppercase tracking-[1.5px] text-steel font-normal ${className}`}
    >
      {children}
    </th>
  )
}

function GroupHeader({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={9}
        className="border-b border-bone bg-bone-soft/40 px-[18px] py-2 font-mono text-[10px] uppercase tracking-[1.4px] text-steel"
      >
        {label}
      </td>
    </tr>
  )
}

function ThumbCell({ images }: { images: unknown }) {
  const url = coverUrl(images)
  if (!url) {
    return <div className="h-[32px] w-[44px] rounded-[4px] border border-bone bg-bone-soft" />
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="h-[32px] w-[44px] rounded-[4px] border border-bone object-cover"
      loading="lazy"
    />
  )
}

function ActiveRow({ property }: { property: PropertyWithMetrics }) {
  const status = computePropertyStatus(property)
  const m = property.metrics
  return (
    <tr className="border-b border-bone last:border-b-0 hover:bg-paper-warm">
      <td className="pl-[18px]" />
      <td className="px-3 py-[10px]">
        <Link href={`/app/properties/${property.id}`}>
          <ThumbCell images={property.images} />
        </Link>
      </td>
      <td className="px-3 py-[10px]">
        <Link
          href={`/app/properties/${property.id}`}
          className="block min-w-0"
        >
          <div className="text-[13px] font-medium text-ink truncate max-w-[260px]">
            {property.title}
          </div>
          <div className="font-mono text-[11px] text-steel truncate max-w-[260px]">
            {[property.neighborhood, property.city].filter(Boolean).join(' · ') ||
              '—'}
          </div>
        </Link>
      </td>
      <td className="px-3 py-[10px] text-[12px] text-steel capitalize">
        {property.property_type}
      </td>
      <td className="px-3 py-[10px]">
        <span
          className={`inline-block rounded-[3px] px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.8px] ${STATUS_TONE[status.tone]}`}
        >
          {getStatusLabel(status.tag)}
        </span>
      </td>
      <td className="px-3 py-[10px] font-mono text-[12px] text-ink">
        {m.totalLeads} / {m.visitsCount}
      </td>
      <td className="px-3 py-[10px] text-right font-mono text-[12px] text-ink">
        {property.price ? formatPriceCompact(property.price) : '—'}
      </td>
      <td className="px-3 py-[10px] font-mono text-[11px] text-steel">
        {property.listing_expires_at
          ? `Vence ${formatRelativeEs(property.listing_expires_at)}`
          : 'Sin vencimiento'}
      </td>
      <td className="pr-[18px] text-right">
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="rounded-[4px] p-1 text-steel hover:bg-bone-soft hover:text-ink"
          title="Más acciones"
        >
          <MoreHorizontal className="h-3 w-3" strokeWidth={1.5} />
        </button>
      </td>
    </tr>
  )
}

function DraftTableRow({ draft }: { draft: DraftProperty }) {
  const error = draft.anomalies.find((a) => a.level === 'error')
  return (
    <tr
      className={`border-b border-bone last:border-b-0 hover:bg-paper-warm ${
        error ? 'bg-signal-bg/40' : ''
      }`}
    >
      <td className="pl-[18px]" />
      <td className="px-3 py-[10px]">
        <Link href={`/app/properties/${draft.id}`}>
          <ThumbCell images={draft.images} />
        </Link>
      </td>
      <td className="px-3 py-[10px]">
        <Link href={`/app/properties/${draft.id}`} className="block min-w-0">
          <div className="text-[13px] font-medium text-ink truncate max-w-[260px]">
            {draft.title || (
              <span className="italic font-normal text-steel-soft">
                (Sin título)
              </span>
            )}
          </div>
          <div
            className={`font-mono text-[11px] truncate max-w-[260px] ${
              error ? 'font-medium text-signal-deep' : 'text-steel'
            }`}
          >
            {error
              ? `⚠ ${error.message}`
              : [draft.neighborhood, draft.city].filter(Boolean).join(' · ') ||
                '—'}
          </div>
        </Link>
      </td>
      <td className="px-3 py-[10px] text-[12px] text-steel capitalize">
        {draft.property_type}
      </td>
      <td className="px-3 py-[10px]">
        <span className="inline-block rounded-[3px] bg-bone-soft px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.8px] text-steel">
          Borrador
        </span>
      </td>
      <td className="px-3 py-[10px] min-w-[140px]">
        <CompletionBar
          pct={draft.completion.percentage}
          tone={draft.completion.tone}
          label={summarizeMissing(draft.completion)}
        />
      </td>
      <td className="px-3 py-[10px] text-right font-mono text-[12px]">
        <span className={error ? 'font-medium text-signal-deep' : 'text-ink'}>
          {draft.price ? formatPriceCompact(draft.price) : '—'}
        </span>
      </td>
      <td className="px-3 py-[10px] font-mono text-[11px] text-steel">
        {error?.suggestion ?? '—'}
      </td>
      <td className="pr-[18px]" />
    </tr>
  )
}

function ArchivedTableRow({ archived }: { archived: ArchivedProperty }) {
  return (
    <tr className="border-b border-bone last:border-b-0 hover:bg-paper-warm">
      <td className="pl-[18px]" />
      <td className="px-3 py-[10px]">
        <Link href={`/app/properties/${archived.id}`}>
          <ThumbCell images={archived.images} />
        </Link>
      </td>
      <td className="px-3 py-[10px]">
        <Link
          href={`/app/properties/${archived.id}`}
          className="block min-w-0"
        >
          <div className="text-[13px] font-medium text-ink truncate max-w-[260px]">
            {archived.title}
          </div>
          <div className="font-mono text-[11px] text-steel truncate max-w-[260px]">
            {[archived.neighborhood, archived.city].filter(Boolean).join(' · ') ||
              '—'}
          </div>
        </Link>
      </td>
      <td className="px-3 py-[10px] text-[12px] text-steel capitalize">
        {archived.property_type}
      </td>
      <td className="px-3 py-[10px]">
        <span className="inline-block rounded-[3px] bg-bone-soft px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.8px] text-steel">
          {archived.status === 'sold'
            ? 'Vendida'
            : archived.status === 'rented'
              ? 'Alquilada'
              : 'Archivada'}
        </span>
      </td>
      <td className="px-3 py-[10px] font-mono text-[11px] text-steel">—</td>
      <td className="px-3 py-[10px] text-right font-mono text-[12px] text-ink">
        {archived.price ? formatPriceCompact(archived.price) : '—'}
      </td>
      <td className="px-3 py-[10px] font-mono text-[11px] text-steel">
        {archived.closedAt ? formatRelativeEs(archived.closedAt) : '—'}
      </td>
      <td className="pr-[18px]" />
    </tr>
  )
}

'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Archive, ChevronDown, ChevronRight } from 'lucide-react'
import { formatPriceCompact } from '@/lib/utils'
import { formatRelativeEs } from '@/lib/compliance-copy'
import type { ArchivedProperty } from '@/lib/queries/properties'

export function ArchiveFold({ items }: { items: ArchivedProperty[] }) {
  const [open, setOpen] = useState(false)

  if (items.length === 0) return null

  const sold = items.filter((p) => p.status === 'sold').length
  const rented = items.filter((p) => p.status === 'rented').length
  const archived = items.filter((p) => p.status === 'archived').length

  const summaryParts: string[] = []
  if (sold > 0) summaryParts.push(`${sold} vendida${sold > 1 ? 's' : ''}`)
  if (rented > 0) summaryParts.push(`${rented} alquilada${rented > 1 ? 's' : ''}`)
  if (archived > 0) summaryParts.push(`${archived} archivada${archived > 1 ? 's' : ''}`)

  return (
    <div className="rounded-[10px] border border-dashed border-bone bg-paper-warm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-[18px] py-[14px] text-left transition-colors hover:bg-bone-soft/40"
      >
        <div className="flex items-center gap-[10px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-bone bg-paper text-steel">
            <Archive className="h-[13px] w-[13px]" strokeWidth={1.5} />
          </span>
          <span className="text-[12px] text-steel">
            <span className="font-medium text-ink">
              {items.length} propiedad{items.length > 1 ? 'es' : ''} archivada
              {items.length > 1 ? 's' : ''}
            </span>
            {summaryParts.length > 0 && ` · ${summaryParts.join(', ')}`}
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-3 w-3 text-steel-soft" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="h-3 w-3 text-steel-soft" strokeWidth={1.5} />
        )}
      </button>

      {open && (
        <div className="border-t border-dashed border-bone">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/app/properties/${p.id}`}
              className="grid grid-cols-[1fr_auto_120px] items-center gap-3 border-b border-bone/50 px-[18px] py-[10px] text-[12px] transition-colors last:border-b-0 hover:bg-paper"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-ink">{p.title}</div>
                <div className="truncate text-[10px] text-steel">
                  {[p.neighborhood, p.city].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <div className="font-mono text-[11px] text-steel">
                {p.status === 'sold'
                  ? 'Vendida'
                  : p.status === 'rented'
                    ? 'Alquilada'
                    : 'Archivada'}{' '}
                {p.closedAt ? formatRelativeEs(p.closedAt) : ''}
              </div>
              <div className="text-right font-mono text-[12px] text-ink">
                {p.price ? formatPriceCompact(p.price) : '—'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import type { OfferRow } from './page'

type OfferRowEnriched = OfferRow & {
  property_price: number | null
  property_currency: string | null
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  countered: 'Contraoferta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  withdrawn: 'Retirada',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-bone-soft text-steel',
  submitted: 'bg-amber-bg text-amber-text',
  countered: 'bg-amber-bg text-amber-text',
  accepted: 'bg-green-bg text-green-text',
  rejected: 'bg-signal-bg text-signal-deep',
  expired: 'bg-bone-soft text-steel',
  withdrawn: 'bg-bone-soft text-steel',
}

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-steel-soft',
  submitted: 'bg-amber-mark',
  countered: 'bg-amber-mark',
  accepted: 'bg-green-mark',
  rejected: 'bg-signal',
  expired: 'bg-steel-soft',
  withdrawn: 'bg-steel-soft',
}

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'closed', label: 'Cerradas' },
] as const

function fmtMoney(amount: number | null, currency: string | null): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days}d`
  if (days < 30) return `hace ${Math.floor(days / 7)}sem`
  return new Date(iso).toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })
}

export function OffersTable({ rows }: { rows: OfferRowEnriched[] }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('active')
  const [search, setSearch] = useState('')

  const filtered = rows.filter((row) => {
    const isClosed = ['accepted', 'rejected', 'expired', 'withdrawn'].includes(row.status)
    if (filter === 'active' && isClosed) return false
    if (filter === 'closed' && !isClosed) return false
    if (search) {
      const q = search.toLowerCase()
      const haystack = [row.lead_name, row.property_title, row.agent_name ?? '']
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  return (
    <div>
      {/* Filters + search */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <div className="inline-flex rounded-[8px] border border-bone bg-paper p-0.5 shadow-xs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-[12px] rounded-[6px] transition-colors ${
                filter === f.key
                  ? 'bg-ink text-white'
                  : 'text-steel hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-[280px]">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, propiedad..."
            className="h-8 w-full rounded-[8px] border border-bone bg-paper pl-8 pr-3 text-[12px] placeholder:text-steel-soft focus:border-ink focus:outline-none focus:ring-0"
          />
        </div>
        <span className="ml-auto font-mono text-[10px] tracking-[0.8px] uppercase text-steel">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[12px] border border-bone bg-paper shadow-xs">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-bone bg-paper-warm">
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Cliente
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Propiedad
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Monto
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Status
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Agente
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Creada
              </th>
              <th className="px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[12px] text-steel">
                  Sin ofertas que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filtered.map((row) => {
              const diff =
                row.property_price != null
                  ? row.amount - row.property_price
                  : null
              const diffPct =
                row.property_price != null && row.property_price > 0
                  ? (row.amount / row.property_price - 1) * 100
                  : null
              return (
                <tr
                  key={row.id}
                  className="border-b border-bone-soft last:border-b-0 hover:bg-bone-soft/40 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/offers/${row.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 shrink-0 rounded-full bg-bone-soft flex items-center justify-center text-[11px] font-medium text-steel">
                          {row.lead_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] text-ink font-medium truncate max-w-[180px]">
                            {row.lead_name}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/offers/${row.id}`}
                      className="block text-[12px] text-ink truncate max-w-[200px]"
                    >
                      {row.property_title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/offers/${row.id}`}
                      className="block"
                    >
                      <div className="font-mono text-[13px] font-medium tabular-nums text-ink">
                        {fmtMoney(row.amount, row.currency)}
                      </div>
                      {diff != null && diffPct != null && (
                        <div
                          className={`font-mono text-[10px] mt-0.5 ${
                            diff < 0 ? 'text-signal-deep' : 'text-green-text'
                          }`}
                        >
                          {diff >= 0 ? '+' : ''}
                          {diffPct.toFixed(1)}%
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/offers/${row.id}`}
                      className="block"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.8px] uppercase px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[row.status] ?? STATUS_STYLE.draft}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[row.status] ?? 'bg-steel-soft'}`}
                        />
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-steel">
                    <Link
                      href={`/app/offers/${row.id}`}
                      className="block truncate max-w-[120px]"
                    >
                      {row.agent_name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-steel">
                    <Link
                      href={`/app/offers/${row.id}`}
                      className="block"
                    >
                      {relativeDate(row.created_at)}
                    </Link>
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      href={`/app/offers/${row.id}`}
                      className="block text-steel-soft group-hover:text-ink transition-colors"
                    >
                      <ChevronRight
                        className="h-4 w-4"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Stage = Database['public']['Enums']['deal_stage']

export type OperacionRow = {
  id: string
  lead_id: string
  lead_name: string
  title: string | null
  stage: Stage
  amount: number | null
  currency: string
  property_count: number
  property_titles: string[]
  winning_property_title: string | null
  agent_name: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

const STAGE_LABEL: Record<Stage, string> = {
  contacto_inicial: 'Contacto inicial',
  visitas: 'Visitas',
  negociacion: 'Negociación',
  promesa_firmada: 'Promesa firmada',
  tramite_bancario: 'Trámite bancario',
  escritura_publica: 'Escritura pública',
  entrega_llaves: 'Entrega de llaves',
  post_cierre: 'Post cierre',
  closed_won: 'Cerrada · Ganada',
  closed_lost: 'Cerrada · Perdida',
}

const STAGE_STYLE: Record<Stage, string> = {
  contacto_inicial: 'bg-bone-soft text-steel',
  visitas: 'bg-amber-bg text-amber-text',
  negociacion: 'bg-amber-bg text-amber-text',
  promesa_firmada: 'bg-amber-bg text-amber-text',
  tramite_bancario: 'bg-amber-bg text-amber-text',
  escritura_publica: 'bg-amber-bg text-amber-text',
  entrega_llaves: 'bg-amber-bg text-amber-text',
  post_cierre: 'bg-green-bg text-green-text',
  closed_won: 'bg-green-bg text-green-text',
  closed_lost: 'bg-signal-bg text-signal-deep',
}

const STAGE_DOT: Record<Stage, string> = {
  contacto_inicial: 'bg-steel-soft',
  visitas: 'bg-amber-mark',
  negociacion: 'bg-amber-mark',
  promesa_firmada: 'bg-amber-mark',
  tramite_bancario: 'bg-amber-mark',
  escritura_publica: 'bg-amber-mark',
  entrega_llaves: 'bg-amber-mark',
  post_cierre: 'bg-green-mark',
  closed_won: 'bg-green-mark',
  closed_lost: 'bg-signal',
}

const STAGE_FILTERS: Array<{ key: 'all' | 'active' | 'closed' | Stage; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'closed', label: 'Cerradas' },
]

function fmtMoney(amount: number | null, currency: string): string {
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

export function OperacionesTable({ rows }: { rows: OperacionRow[] }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('active')
  const [search, setSearch] = useState('')

  const filtered = rows.filter((row) => {
    if (filter === 'active' && (row.stage === 'closed_won' || row.stage === 'closed_lost')) {
      return false
    }
    if (filter === 'closed' && row.stage !== 'closed_won' && row.stage !== 'closed_lost') {
      return false
    }
    if (search) {
      const q = search.toLowerCase()
      const haystack = [
        row.lead_name,
        row.title ?? '',
        ...row.property_titles,
        row.agent_name ?? '',
      ]
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
          {STAGE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key as 'all' | 'active' | 'closed')}
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
                Propiedades
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Stage
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Monto
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Agente
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[1.2px] uppercase text-steel font-medium">
                Última act.
              </th>
              <th className="px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[12px] text-steel">
                  Sin operaciones que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-bone-soft last:border-b-0 hover:bg-bone-soft/40 transition-colors group"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/app/operaciones/${row.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-bone-soft flex items-center justify-center text-[11px] font-medium text-steel">
                        {row.lead_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] text-ink font-medium truncate max-w-[200px]">
                          {row.lead_name}
                        </div>
                        {row.title && (
                          <div className="text-[11px] text-steel truncate max-w-[200px]">
                            {row.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-[12px] text-steel">
                  <Link
                    href={`/app/operaciones/${row.id}`}
                    className="block"
                  >
                    {row.winning_property_title ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.7px] text-green-text bg-green-bg px-1.5 py-0.5 rounded-full font-medium">
                          ✓
                        </span>
                        <span className="text-ink truncate max-w-[200px]">
                          {row.winning_property_title}
                        </span>
                      </div>
                    ) : row.property_count === 0 ? (
                      <span className="text-steel-soft italic">
                        sin propiedades
                      </span>
                    ) : row.property_count === 1 ? (
                      <span className="truncate max-w-[200px] block">
                        {row.property_titles[0] ?? '—'}
                      </span>
                    ) : (
                      <span>
                        <strong className="text-ink font-medium">
                          {row.property_count}
                        </strong>{' '}
                        propiedades consideradas
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/app/operaciones/${row.id}`}
                    className="block"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.8px] uppercase px-2 py-0.5 rounded-full font-medium ${STAGE_STYLE[row.stage]}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[row.stage]}`}
                      />
                      {STAGE_LABEL[row.stage]}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/app/operaciones/${row.id}`}
                    className="block"
                  >
                    <span
                      className={`font-mono text-[12px] tabular-nums ${
                        row.amount ? 'text-ink' : 'text-steel-soft'
                      }`}
                    >
                      {fmtMoney(row.amount, row.currency)}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-[12px] text-steel">
                  <Link
                    href={`/app/operaciones/${row.id}`}
                    className="block truncate max-w-[120px]"
                  >
                    {row.agent_name ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-steel">
                  <Link
                    href={`/app/operaciones/${row.id}`}
                    className="block"
                  >
                    {relativeDate(row.updated_at)}
                  </Link>
                </td>
                <td className="px-2 py-3">
                  <Link
                    href={`/app/operaciones/${row.id}`}
                    className="block text-steel-soft group-hover:text-ink transition-colors"
                  >
                    <ChevronRight
                      className="h-4 w-4"
                      strokeWidth={1.5}
                    />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

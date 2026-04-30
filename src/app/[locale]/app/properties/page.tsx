import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Database } from '@/lib/database.types'
import { PropertiesFilters } from './filters'

type PropertyRow = Pick<
  Database['public']['Tables']['properties']['Row'],
  | 'id'
  | 'title'
  | 'property_type'
  | 'listing_type'
  | 'status'
  | 'price'
  | 'currency'
  | 'ai_score'
  | 'updated_at'
  | 'neighborhood'
  | 'city'
>

const STATUS_COLOR: Record<string, string> = {
  active: 'text-[#0A6B3D]',
  draft: 'text-steel',
  pending: 'text-ink',
  sold: 'text-steel',
  rented: 'text-steel',
  archived: 'text-steel',
}

const PAGE_SIZE = 25

const KNOWN_STATUSES = [
  'draft',
  'active',
  'pending',
  'sold',
  'rented',
  'archived',
] as const
const KNOWN_TYPES = [
  'apartment',
  'house',
  'condo',
  'land',
  'commercial',
] as const
type KnownStatus = (typeof KNOWN_STATUSES)[number]
type KnownType = (typeof KNOWN_TYPES)[number]

function shortDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

export default async function PropertiesListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    status?: string
    type?: string
    page?: string
  }>
}) {
  const t = await getTranslations('properties')
  const supabase = await createClient()
  const params = await searchParams

  const q = params.q?.trim() ?? ''
  const status = (
    KNOWN_STATUSES as readonly string[]
  ).includes(params.status ?? '')
    ? (params.status as KnownStatus)
    : null
  const propertyType = (KNOWN_TYPES as readonly string[]).includes(
    params.type ?? '',
  )
    ? (params.type as KnownType)
    : null
  const page = Math.max(1, Number(params.page ?? '1') || 1)

  let query = supabase
    .from('properties')
    .select(
      'id, title, property_type, listing_type, status, price, currency, ai_score, updated_at, neighborhood, city',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (propertyType) query = query.eq('property_type', propertyType)

  if (q.length > 0) {
    // Full-text-ish search: title, neighborhood, city, external_id
    const escaped = q.replace(/[%_]/g, '\\$&')
    query = query.or(
      [
        `title.ilike.%${escaped}%`,
        `neighborhood.ilike.%${escaped}%`,
        `city.ilike.%${escaped}%`,
        `external_id.ilike.%${escaped}%`,
      ].join(','),
    )
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data: properties, count } = await query.returns<PropertyRow[]>()
  const rows = properties ?? []
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Helper to build URL with merged params
  const buildPageHref = (newPage: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (propertyType) sp.set('type', propertyType)
    if (newPage > 1) sp.set('page', String(newPage))
    const qs = sp.toString()
    return `/app/properties${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          {t('title')}
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {totalCount}
          </span>
        </h1>
        <Link
          href="/app/properties/new"
          className="inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t('new')}
        </Link>
      </div>

      <div className="mb-4">
        <PropertiesFilters
          q={q}
          status={status}
          type={propertyType}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-12 text-center">
          <p className="text-[13px] text-steel">
            {q || status || propertyType
              ? 'Sin resultados con esos filtros.'
              : t('empty')}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {rows.map((p) => (
              <Link
                key={p.id}
                href={`/app/properties/${p.id}`}
                className="block rounded-[4px] border border-bone bg-paper p-4 active:bg-bone/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-ink line-clamp-1">
                      {p.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-steel line-clamp-1">
                      {[p.neighborhood, p.city].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  {p.ai_score && (
                    <span className="font-mono text-[15px] tabular-nums text-signal">
                      {p.ai_score}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider ${
                        STATUS_COLOR[p.status ?? 'draft'] ?? 'text-steel'
                      }`}
                    >
                      {t(`status.${p.status ?? 'draft'}`)}
                    </span>
                    <span className="font-mono text-[10px] text-steel">·</span>
                    <span className="text-[12px] text-steel">
                      {t(`type.${p.property_type}`)}
                    </span>
                    <span className="font-mono text-[10px] text-steel">·</span>
                    <span className="text-[12px] text-steel">
                      {t(`listingType.${p.listing_type}`)}
                    </span>
                  </div>
                  <span className="font-mono text-[14px] tabular-nums font-medium text-ink">
                    {p.price ? formatPrice(Number(p.price)) : '—'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block rounded-[4px] border border-bone bg-paper">
            <Table>
              <TableHeader>
                <TableRow className="border-bone hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {t('table.title')}
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {t('table.type')}
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {t('table.listing')}
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {t('table.status')}
                  </TableHead>
                  <TableHead className="text-right font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {t('table.price')}
                  </TableHead>
                  <TableHead className="text-right font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {t('table.score')}
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {t('table.updated')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow
                    key={p.id}
                    className="border-bone hover:bg-bone/30 cursor-pointer"
                  >
                    <TableCell>
                      <Link href={`/app/properties/${p.id}`} className="block">
                        <span className="text-[13px] font-medium text-ink">
                          {p.title}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-steel">
                          {[p.neighborhood, p.city].filter(Boolean).join(' · ') ||
                            '—'}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-[13px] text-steel">
                      {t(`type.${p.property_type}`)}
                    </TableCell>
                    <TableCell className="text-[13px] text-steel">
                      {t(`listingType.${p.listing_type}`)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono text-[11px] uppercase tracking-wider ${
                          STATUS_COLOR[p.status ?? 'draft'] ?? 'text-steel'
                        }`}
                      >
                        {t(`status.${p.status ?? 'draft'}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-ink">
                      {p.price ? formatPrice(Number(p.price)) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-signal">
                      {p.ai_score ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-steel">
                      {shortDate(p.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="font-mono text-[11px] text-steel">
                {from + 1}–{Math.min(to + 1, totalCount)} de {totalCount}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildPageHref(page - 1)}
                    className="rounded-[4px] border border-bone px-3 py-1.5 font-mono text-[11px] text-ink hover:border-ink transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                <span className="font-mono text-[11px] text-steel">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildPageHref(page + 1)}
                    className="rounded-[4px] border border-bone px-3 py-1.5 font-mono text-[11px] text-ink hover:border-ink transition-colors"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

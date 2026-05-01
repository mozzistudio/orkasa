'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import Link from 'next/link'

const STATUSES = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'negotiating',
  'closed_won',
  'closed_lost',
] as const

export function LeadsFilters({
  q,
  status,
}: {
  q: string
  status: string | null
}) {
  const t = useTranslations('leads')
  const router = useRouter()
  const sp = useSearchParams()
  const [, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(q)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushParam('q', searchValue)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  function pushParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString())
    if (value && value.length > 0) next.set(key, value)
    else next.delete(key)
    startTransition(() => {
      router.push(`/app/leads?${next.toString()}`)
    })
  }

  function buildStatusHref(value: string | null) {
    const next = new URLSearchParams(sp.toString())
    if (value) next.set('status', value)
    else next.delete('status')
    next.delete('q')
    if (searchValue) next.set('q', searchValue)
    const qs = next.toString()
    return `/app/leads${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel"
          strokeWidth={1.5}
        />
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono…"
          className="h-11 w-full rounded-[4px] border border-bone bg-paper pl-9 pr-9 text-[13px] text-ink placeholder:text-steel focus:border-ink focus:outline-none md:h-9"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-steel hover:text-ink"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        <Link
          href={buildStatusHref(null)}
          className={`shrink-0 rounded-[4px] border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
            !status
              ? 'border-ink bg-ink text-paper'
              : 'border-bone text-steel active:bg-bone/30'
          }`}
        >
          Todos
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={buildStatusHref(s)}
            className={`shrink-0 rounded-[4px] border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              status === s
                ? 'border-ink bg-ink text-paper'
                : 'border-bone text-steel active:bg-bone/30'
            }`}
          >
            {t(`status.${s}`)}
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'

const STATUSES = [
  'active',
  'draft',
  'pending',
  'sold',
  'rented',
  'archived',
] as const
const TYPES = ['apartment', 'house', 'condo', 'land', 'commercial'] as const

export function PropertiesFilters({
  q,
  status,
  type,
}: {
  q: string
  status: string | null
  type: string | null
}) {
  const t = useTranslations('properties')
  const router = useRouter()
  const sp = useSearchParams()
  const [, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(q)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search push
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
    next.delete('page') // reset pagination when filtering
    startTransition(() => {
      router.push(`/app/properties?${next.toString()}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[240px]">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel"
          strokeWidth={1.5}
        />
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="h-9 w-full rounded-[4px] border border-bone bg-paper pl-9 pr-9 text-[13px] text-ink placeholder:text-steel focus:border-ink focus:outline-none"
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

      {/* Status filter */}
      <FilterPill
        label={t('form.status')}
        value={status}
        options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
        onChange={(v) => pushParam('status', v)}
      />

      {/* Type filter */}
      <FilterPill
        label={t('form.propertyType')}
        value={type}
        options={TYPES.map((tp) => ({ value: tp, label: t(`type.${tp}`) }))}
        onChange={(v) => pushParam('type', v)}
      />

      {(q || status || type) && (
        <button
          type="button"
          onClick={() => {
            setSearchValue('')
            startTransition(() => {
              router.push('/app/properties')
            })
          }}
          className="font-mono text-[11px] uppercase tracking-wider text-steel hover:text-signal transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  )
}

function FilterPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: Array<{ value: string; label: string }>
  onChange: (v: string | null) => void
}) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 appearance-none rounded-[4px] border border-bone bg-paper pl-3 pr-7 text-[13px] text-ink focus:border-ink focus:outline-none"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

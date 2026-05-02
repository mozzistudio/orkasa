'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import {
  SearchIcon,
  SlidersIcon,
  GridViewIcon,
  ListViewIcon,
} from '@/components/icons/icons'
import type { CountsByListing, CountsByOwner } from '@/lib/queries/properties'

type Props = {
  basePath: string
  counts: { listing: CountsByListing; owner: CountsByOwner }
  q: string
  listing: 'all' | 'sale' | 'rent'
  owner: 'all' | 'mine' | 'team'
  view: 'cards' | 'table'
}

export function PropertiesControls({
  basePath,
  counts,
  q,
  listing,
  owner,
  view,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(q)

  useEffect(() => {
    setSearchValue(q)
  }, [q])

  function setParam(key: string, value: string | null) {
    const sp = new URLSearchParams(searchParams.toString())
    if (value === null || value === '' || value === 'all') sp.delete(key)
    else sp.set(key, value)
    const qs = sp.toString()
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    })
  }

  // Debounced search
  useEffect(() => {
    if (searchValue === q) return
    const t = setTimeout(() => setParam('q', searchValue.trim() || null), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1">
        <Pill
          active={listing === 'all'}
          count={counts.listing.all}
          onClick={() => setParam('listing', null)}
        >
          Todas
        </Pill>
        <Pill
          active={listing === 'sale'}
          count={counts.listing.sale}
          onClick={() => setParam('listing', 'sale')}
        >
          Venta
        </Pill>
        <Pill
          active={listing === 'rent'}
          count={counts.listing.rent}
          onClick={() => setParam('listing', 'rent')}
        >
          Alquiler
        </Pill>

        <span className="mx-1 h-4 w-px bg-bone" />

        <Pill
          active={owner === 'mine'}
          count={counts.owner.mine}
          onClick={() => setParam('owner', owner === 'mine' ? null : 'mine')}
        >
          Mías
        </Pill>
        <Pill
          active={owner === 'team'}
          count={counts.owner.team}
          onClick={() => setParam('owner', owner === 'team' ? null : 'team')}
        >
          Mi equipo
        </Pill>
      </div>

      {/* Right: search + filters btn + view toggle */}
      <div className="flex items-center gap-[10px]">
        <div className="flex items-center gap-[6px] rounded-[5px] border border-bone bg-paper px-[10px] py-[6px] focus-within:border-steel-soft">
          <SearchIcon size={12} className="text-steel" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por título, barrio, ID..."
            className="w-[180px] border-none bg-transparent text-[12px] text-ink outline-none placeholder:text-steel-soft"
          />
        </div>

        <button
          type="button"
          disabled
          className="inline-flex items-center gap-[5px] rounded-[5px] border border-bone bg-paper px-[11px] py-[6px] text-[12px] text-ink opacity-60 cursor-not-allowed"
          title="Filtros avanzados (próximamente)"
        >
          <SlidersIcon size={12} />
          Filtros
        </button>

        <div className="flex items-center gap-0 rounded-[5px] border border-bone bg-paper-warm p-[2px]">
          <ViewBtn
            active={view === 'cards'}
            onClick={() => setParam('view', null)}
          >
            <GridViewIcon size={12} />
            Cards
          </ViewBtn>
          <ViewBtn
            active={view === 'table'}
            onClick={() => setParam('view', 'table')}
          >
            <ListViewIcon size={12} />
            Tabla
          </ViewBtn>
        </div>
      </div>

      {isPending && (
        <span className="absolute -mt-8 font-mono text-[10px] text-steel-soft">
          actualizando...
        </span>
      )}
    </div>
  )
}

function Pill({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean
  count: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-[7px] rounded-[5px] border px-3 py-[6px] text-[12px] transition-colors ${
        active
          ? 'border-ink bg-ink text-paper'
          : 'border-transparent text-steel hover:text-ink'
      }`}
    >
      {children}
      <span
        className={`font-mono text-[10px] ${active ? 'opacity-65' : 'opacity-65'}`}
      >
        {count}
      </span>
    </button>
  )
}

function ViewBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-[3px] px-[9px] py-[4px] text-[11px] transition-colors ${
        active
          ? 'bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
          : 'text-steel hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

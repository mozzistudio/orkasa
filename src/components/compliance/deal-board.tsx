'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { DealCard } from './deal-card'
import { DealListRow } from './deal-list-row'
import { DealBoardEmpty } from './deal-board-empty'
import type { DealCardData } from './types'

type OwnerFilter = 'todos' | 'mine' | 'team'
type ViewMode = 'kanban' | 'list'

const OWNER_FILTERS: { value: OwnerFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'mine', label: 'Míos' },
  { value: 'team', label: 'Mi equipo' },
]

export function DealBoard({
  blocked,
  waiting,
  ready,
  initialView,
  initialOwner,
  currentAgentId,
}: {
  blocked: DealCardData[]
  waiting: DealCardData[]
  ready: DealCardData[]
  initialView: ViewMode
  initialOwner: OwnerFilter
  currentAgentId: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const view = (searchParams.get('view') as ViewMode) ?? initialView
  const owner = (searchParams.get('owner') as OwnerFilter) ?? initialOwner

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const filterByOwner = useCallback(
    (deals: DealCardData[]) => {
      if (owner === 'mine')
        return deals.filter((d) => d.assignedAgentId === currentAgentId)
      if (owner === 'team')
        return deals.filter(
          (d) => d.assignedAgentId !== currentAgentId && d.assignedAgentId != null,
        )
      return deals
    },
    [owner, currentAgentId],
  )

  const fBlocked = useMemo(() => filterByOwner(blocked), [filterByOwner, blocked])
  const fWaiting = useMemo(() => filterByOwner(waiting), [filterByOwner, waiting])
  const fReady = useMemo(() => filterByOwner(ready), [filterByOwner, ready])
  const totalFiltered = fBlocked.length + fWaiting.length + fReady.length

  const ownerCounts = useMemo(() => {
    const all = [...blocked, ...waiting, ...ready]
    return {
      todos: all.length,
      mine: all.filter((d) => d.assignedAgentId === currentAgentId).length,
      team: all.filter(
        (d) => d.assignedAgentId !== currentAgentId && d.assignedAgentId != null,
      ).length,
    }
  }, [blocked, waiting, ready, currentAgentId])

  const MAX_VISIBLE_WAITING = 3
  const showWaitingCollapsed = fWaiting.length > MAX_VISIBLE_WAITING
  const visibleWaiting = showWaitingCollapsed
    ? fWaiting.slice(0, MAX_VISIBLE_WAITING)
    : fWaiting
  const hiddenWaitingCount = fWaiting.length - MAX_VISIBLE_WAITING

  return (
    <section>
      {/* Board header */}
      <div className="mb-[14px] flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
          Estado de mis deals · {totalFiltered} abiertos
        </h2>
        <div className="flex items-center gap-2.5">
          {/* Filter pills */}
          <div className="flex items-center gap-0.5">
            {OWNER_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => updateParam('owner', f.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[4px] border px-[11px] py-[5px] font-sans text-[12px]',
                  owner === f.value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-transparent text-steel hover:text-ink',
                )}
              >
                {f.label}
                <span className="font-mono text-[10px] opacity-70">
                  {ownerCounts[f.value]}
                </span>
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0 rounded-[5px] border border-bone bg-[#F5F4EE] p-0.5">
            <button
              type="button"
              onClick={() => updateParam('view', 'kanban')}
              className={cn(
                'inline-flex items-center gap-1 rounded-[3px] px-[9px] py-1 font-sans text-[11px]',
                view === 'kanban'
                  ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  : 'text-steel hover:text-ink',
              )}
            >
              <LayoutGrid className="h-3 w-3" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => updateParam('view', 'list')}
              className={cn(
                'inline-flex items-center gap-1 rounded-[3px] px-[9px] py-1 font-sans text-[11px]',
                view === 'list'
                  ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  : 'text-steel hover:text-ink',
              )}
            >
              <List className="h-3 w-3" />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-3">
          {/* Bloqueados */}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2 px-1 pb-1.5 font-mono text-[10px] uppercase tracking-[1.3px] text-steel">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-signal" />
              Bloqueados
              <span className="ml-auto font-medium text-ink">{fBlocked.length}</span>
            </div>
            {fBlocked.length === 0 ? (
              <DealBoardEmpty column="blocked" message="Nadie bloqueado — sos un crack" />
            ) : (
              fBlocked.map((d) => <DealCard key={d.leadId} deal={d} />)
            )}
          </div>

          {/* Avanzando */}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2 px-1 pb-1.5 font-mono text-[10px] uppercase tracking-[1.3px] text-steel">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#BA7517]" />
              Avanzando
              <span className="ml-auto font-medium text-ink">{fWaiting.length}</span>
            </div>
            {fWaiting.length === 0 ? (
              <DealBoardEmpty column="progressing" message="Sin deals en proceso" />
            ) : (
              <>
                {visibleWaiting.map((d) => (
                  <DealCard key={d.leadId} deal={d} />
                ))}
                {showWaitingCollapsed && (
                  <div className="rounded-[8px] border border-[#BA7517]/30 bg-paper px-[14px] py-2.5">
                    <div className="flex items-center justify-between gap-2.5">
                      <div>
                        <p className="text-[12px] font-medium text-ink">
                          + {hiddenWaitingCount} deals avanzando bien
                        </p>
                        <p className="mt-0.5 text-[11px] text-steel">
                          Sin acción urgente requerida
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-[4px] px-2 py-1 text-[11px] text-steel hover:bg-bone hover:text-ink"
                      >
                        Ver todos
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Listos para firmar */}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2 px-1 pb-1.5 font-mono text-[10px] uppercase tracking-[1.3px] text-steel">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#2E7D52]" />
              Listos para firmar
              <span className="ml-auto font-medium text-ink">{fReady.length}</span>
            </div>
            {fReady.length === 0 ? (
              <DealBoardEmpty column="ready" message="Ningún deal listo todavía" />
            ) : (
              fReady.map((d) => <DealCard key={d.leadId} deal={d} />)
            )}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <Table>
          <TableHeader>
            <TableRow className="border-bone">
              <TableHead className="text-[11px] font-medium text-steel">Cliente</TableHead>
              <TableHead className="text-[11px] font-medium text-steel">Propiedad</TableHead>
              <TableHead className="text-[11px] font-medium text-steel">Monto</TableHead>
              <TableHead className="text-[11px] font-medium text-steel">Estado</TableHead>
              <TableHead className="text-[11px] font-medium text-steel">Próxima acción</TableHead>
              <TableHead className="text-[11px] font-medium text-steel">Vence</TableHead>
              <TableHead className="text-[11px] font-medium text-steel">Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...fBlocked, ...fWaiting, ...fReady].map((d) => (
              <DealListRow key={d.leadId} deal={d} />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

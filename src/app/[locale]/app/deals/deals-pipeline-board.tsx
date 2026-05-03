'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { updateDealStage } from './actions'
import { formatPriceCompact } from '@/lib/utils'

export type DealRow = {
  id: string
  lead_id: string
  property_id: string | null
  brokerage_id: string
  agent_id: string | null
  amount: number | null
  currency: string
  stage: string
  closed_at: string | null
  created_at: string
  lead_name: string
  property_title: string | null
  agent_name: string | null
}

const STAGES = [
  'negociacion',
  'promesa_firmada',
  'tramite_bancario',
  'escritura_publica',
  'entrega_llaves',
  'post_cierre',
] as const
type Stage = (typeof STAGES)[number]

const STAGE_LABELS: Record<string, string> = {
  contacto_inicial: 'Contacto',
  visitas: 'Visitas',
  negociacion: 'Negociación',
  promesa_firmada: 'Promesa',
  tramite_bancario: 'Banco',
  escritura_publica: 'Escritura',
  entrega_llaves: 'Entrega',
  post_cierre: 'Post cierre',
  closed_won: 'Cerrado ✓',
  closed_lost: 'Perdido',
}

const STAGE_ACCENT: Record<string, string> = {
  negociacion: 'border-l-signal',
  promesa_firmada: 'border-l-amber-mark',
  tramite_bancario: 'border-l-ink',
  escritura_publica: 'border-l-ink',
  entrega_llaves: 'border-l-[#0A6B3D]',
  post_cierre: 'border-l-steel',
}

function daysInStage(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
}

export function DealsPipelineBoard({ deals }: { deals: DealRow[] }) {
  const router = useRouter()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )
  const [items, setItems] = useState(deals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const byStage: Record<string, DealRow[]> = {}
  for (const s of STAGES) {
    byStage[s] = items.filter((d) => d.stage === s)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const dealId = String(active.id)
    const newStage = String(over.id) as Stage
    const deal = items.find((d) => d.id === dealId)
    if (!deal || deal.stage === newStage) return

    setItems((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)),
    )

    startTransition(async () => {
      const result = await updateDealStage(dealId, newStage)
      if (result?.error) {
        setItems((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d)),
        )
      }
      router.refresh()
    })
  }

  const activeDeal = items.find((d) => d.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={`flex gap-3 overflow-x-auto pb-4 ${isPending ? 'opacity-60' : ''}`}>
        {STAGES.map((s) => (
          <StageColumn
            key={s}
            stage={s}
            label={STAGE_LABELS[s]}
            accent={STAGE_ACCENT[s] ?? 'border-l-steel'}
            deals={byStage[s]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function StageColumn({
  stage,
  label,
  accent,
  deals,
}: {
  stage: string
  label: string
  accent: string
  deals: DealRow[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const totalValue = deals.reduce((sum, d) => sum + (d.amount ? Number(d.amount) : 0), 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-[4px] border border-bone border-l-2 bg-bone/30 transition-colors ${accent} ${
        isOver ? 'bg-bone/60' : ''
      }`}
    >
      <div className="border-b border-bone px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            {label}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-ink">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="font-mono text-[10px] text-steel mt-0.5">
            {formatPriceCompact(totalValue)}
          </p>
        )}
      </div>
      <div className="flex-1 space-y-2 p-2">
        {deals.length === 0 ? (
          <p className="rounded-[4px] border border-dashed border-bone bg-paper/50 p-4 text-center font-mono text-[10px] uppercase tracking-wider text-steel">
            Vacío
          </p>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  )
}

function DealCard({ deal, dragging }: { deal: DealRow; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-[4px] border border-bone bg-paper p-3 active:cursor-grabbing ${
        isDragging || dragging ? 'opacity-90 shadow-lg' : 'hover:border-ink'
      }`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/app/leads/${deal.lead_id}`}
          className="text-[13px] font-medium text-ink line-clamp-1 hover:underline"
        >
          {deal.lead_name}
        </Link>
        {deal.amount && (
          <span className="font-mono text-[12px] font-medium text-ink whitespace-nowrap">
            {formatPriceCompact(Number(deal.amount))}
          </span>
        )}
      </div>
      {deal.property_title && (
        <p className="mt-1 font-mono text-[10px] text-steel line-clamp-1">
          {deal.property_title}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-steel">
          {deal.agent_name ?? '—'}
        </span>
        <span className="font-mono text-[10px] text-steel">
          {daysInStage(deal.created_at)}d
        </span>
      </div>
    </div>
  )
}

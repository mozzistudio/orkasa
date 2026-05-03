'use client'

import { useState } from 'react'
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
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { updateLeadStatus } from '@/app/[locale]/app/leads/actions'

const STATUSES = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'negotiating',
  'closed_won',
  'closed_lost',
] as const
type Status = (typeof STATUSES)[number]

const COL_ACCENT: Record<Status, string> = {
  new: 'border-l-signal',
  contacted: 'border-l-ink',
  qualified: 'border-l-ink',
  viewing_scheduled: 'border-l-ink',
  negotiating: 'border-l-ink',
  closed_won: 'border-l-[#0A6B3D]',
  closed_lost: 'border-l-steel',
}

export type KanbanLead = {
  id: string
  full_name: string
  status: Status
  ai_score: number | null
  origin: string
  property_title: string | null
  assigned_name: string | null
}

export function LeadsKanban({ leads }: { leads: KanbanLead[] }) {
  const t = useTranslations('leads')
  const router = useRouter()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  // Optimistic local state — apply the new status immediately, revert on error
  const [items, setItems] = useState(leads)
  const [activeId, setActiveId] = useState<string | null>(null)

  const byStatus: Record<Status, KanbanLead[]> = STATUSES.reduce(
    (acc, s) => {
      acc[s] = items.filter((l) => l.status === s)
      return acc
    },
    {} as Record<Status, KanbanLead[]>,
  )

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const leadId = String(active.id)
    const newStatus = String(over.id) as Status
    const lead = items.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Optimistic update
    setItems((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    )

    const result = await updateLeadStatus(leadId, newStatus)
    if (result?.error) {
      // Revert
      setItems((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l)),
      )
    }
    router.refresh()
  }

  const activeLead = items.find((l) => l.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUSES.map((s) => (
          <Column
            key={s}
            status={s}
            label={t(`status.${s}`)}
            count={byStatus[s].length}
            accent={COL_ACCENT[s]}
          >
            {byStatus[s].map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
            {byStatus[s].length === 0 && (
              <p className="rounded-[4px] border border-dashed border-bone bg-paper/50 p-4 text-center font-mono text-[10px] uppercase tracking-wider text-steel">
                Vacío
              </p>
            )}
          </Column>
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  status,
  label,
  count,
  accent,
  children,
}: {
  status: Status
  label: string
  count: number
  accent: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-[4px] border border-bone border-l-2 bg-bone/30 transition-colors ${accent} ${
        isOver ? 'bg-bone/60' : ''
      }`}
    >
      <div className="flex items-center justify-between border-b border-bone px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
          {label}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-ink">
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-2 p-2">{children}</div>
    </div>
  )
}

function LeadCard({
  lead,
  dragging,
}: {
  lead: KanbanLead
  dragging?: boolean
}) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => { if (!isDragging) router.push(`/app/leads/${lead.id}`) }}
      className={`group cursor-grab rounded-[4px] border border-bone bg-paper p-3 active:cursor-grabbing ${
        isDragging || dragging
          ? 'opacity-90 shadow-lg'
          : 'hover:border-ink'
      }`}
      style={{
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium text-ink line-clamp-1">
          {lead.full_name}
        </span>
        {lead.ai_score !== null && (
          <span className="font-mono text-[11px] tabular-nums text-signal">
            {lead.ai_score}
          </span>
        )}
      </div>
      {lead.property_title && (
        <p className="mt-1 font-mono text-[10px] text-steel line-clamp-1">
          {lead.property_title}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
          {lead.origin.replace('_', ' ')}
        </span>
        <span className="font-mono text-[10px] text-steel">
          {lead.assigned_name ?? '—'}
        </span>
      </div>
    </div>
  )
}

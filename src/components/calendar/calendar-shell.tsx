'use client'

import { useMemo, useState, useTransition } from 'react'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, ChevronRight, Check, X, FileSearch } from 'lucide-react'
import { updateViewingStatus } from '@/app/[locale]/app/viewings/actions'

export type CalendarEvent = {
  id: string
  type: 'viewing'
  scheduledAt: string
  title: string
  subtitle: string
  leadId: string | null
  propertyId: string | null
  status: string
}

type View = 'month' | 'week' | 'day'

const DAY_MS = 86_400_000

const WEEK_DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d)
  const dow = (c.getDay() + 6) % 7 // Monday = 0
  c.setDate(c.getDate() - dow)
  return c
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

function addMonths(d: Date, n: number): Date {
  const c = new Date(d)
  c.setMonth(c.getMonth() + n)
  return c
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function periodLabel(view: View, date: Date): string {
  if (view === 'month') {
    return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
  }
  if (view === 'week') {
    const start = startOfWeek(date)
    const end = addDays(start, 6)
    const sameMonth = start.getMonth() === end.getMonth()
    return sameMonth
      ? `${start.getDate()} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()]} ${end.getFullYear()}`
      : `${start.getDate()} ${MONTH_LABELS[start.getMonth()]} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()]} ${end.getFullYear()}`
  }
  return date.toLocaleDateString('es-PA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function CalendarShell({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState<Date>(() => new Date())

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const k = dayKey(new Date(ev.scheduledAt))
      const arr = map.get(k) ?? []
      arr.push(ev)
      map.set(k, arr)
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime(),
      )
    }
    return map
  }, [events])

  function navigate(direction: 'prev' | 'next' | 'today') {
    if (direction === 'today') {
      setCursor(new Date())
      return
    }
    if (view === 'month') {
      setCursor(addMonths(cursor, direction === 'next' ? 1 : -1))
    } else if (view === 'week') {
      setCursor(addDays(cursor, direction === 'next' ? 7 : -7))
    } else {
      setCursor(addDays(cursor, direction === 'next' ? 1 : -1))
    }
  }

  return (
    <section className="rounded-[10px] border border-bone bg-paper overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bone px-[18px] py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[18px] font-medium text-ink">Calendario</h1>
          <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            {periodLabel(view, cursor)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Period switcher */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => navigate('prev')}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border border-bone bg-paper text-steel hover:border-steel-soft hover:text-ink"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-[13px] w-[13px]" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => navigate('today')}
              className="rounded-[5px] border border-bone bg-paper px-2.5 py-[5px] text-[12px] font-medium text-ink hover:border-steel-soft"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => navigate('next')}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border border-bone bg-paper text-steel hover:border-steel-soft hover:text-ink"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-[13px] w-[13px]" strokeWidth={1.6} />
            </button>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-0.5 rounded-[5px] border border-bone bg-paper p-0.5">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-[3px] px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  view === v
                    ? 'bg-ink text-paper'
                    : 'text-steel hover:text-ink'
                }`}
              >
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      {view === 'month' && (
        <MonthView cursor={cursor} eventsByDay={eventsByDay} />
      )}
      {view === 'week' && (
        <WeekView cursor={cursor} eventsByDay={eventsByDay} />
      )}
      {view === 'day' && (
        <DayView cursor={cursor} eventsByDay={eventsByDay} />
      )}
    </section>
  )
}

// ── Month view ─────────────────────────────────────────────────────

function MonthView({
  cursor,
  eventsByDay,
}: {
  cursor: Date
  eventsByDay: Map<string, CalendarEvent[]>
}) {
  const monthStart = startOfMonth(cursor)
  const gridStart = startOfWeek(monthStart)
  const today = startOfDay(new Date())

  // 6 weeks × 7 days = 42 cells
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i))

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-bone">
        {WEEK_DAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2.5 py-2 font-mono text-[10px] uppercase tracking-[1.2px] text-steel"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth()
          const isToday = isSameDay(d, today)
          const dayEvents = eventsByDay.get(dayKey(d)) ?? []
          const isLastRow = i >= 35

          return (
            <div
              key={i}
              className={`min-h-[96px] border-r border-bone px-2 py-1.5 ${isLastRow ? '' : 'border-b'} ${i % 7 === 6 ? 'border-r-0' : ''} ${inMonth ? 'bg-paper' : 'bg-paper-warm'}`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] ${
                    isToday
                      ? 'bg-signal font-medium text-paper'
                      : inMonth
                        ? 'text-ink'
                        : 'text-steel-soft'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventPill key={ev.id} event={ev} />
                ))}
                {dayEvents.length > 3 && (
                  <span className="px-1 text-[10px] font-mono text-steel">
                    +{dayEvents.length - 3} más
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week view ──────────────────────────────────────────────────────

function WeekView({
  cursor,
  eventsByDay,
}: {
  cursor: Date
  eventsByDay: Map<string, CalendarEvent[]>
}) {
  const weekStart = startOfWeek(cursor)
  const today = startOfDay(new Date())
  const days: Date[] = []
  for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i))

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-bone">
        {days.map((d) => {
          const isToday = isSameDay(d, today)
          return (
            <div
              key={d.toISOString()}
              className="border-r border-bone px-2.5 py-2 last:border-r-0"
            >
              <div className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
                {WEEK_DAY_LABELS[(d.getDay() + 6) % 7]}
              </div>
              <div
                className={`mt-0.5 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[13px] ${
                  isToday
                    ? 'bg-signal font-medium text-paper'
                    : 'text-ink'
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d) => {
          const dayEvents = eventsByDay.get(dayKey(d)) ?? []
          return (
            <div
              key={d.toISOString()}
              className="min-h-[260px] border-r border-bone p-2 last:border-r-0"
            >
              {dayEvents.length === 0 ? (
                <p className="pt-2 text-center text-[11px] text-steel-soft">
                  —
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {dayEvents.map((ev) => (
                    <EventCard key={ev.id} event={ev} compact />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Day view ───────────────────────────────────────────────────────

function DayView({
  cursor,
  eventsByDay,
}: {
  cursor: Date
  eventsByDay: Map<string, CalendarEvent[]>
}) {
  const today = startOfDay(new Date())
  const isToday = isSameDay(cursor, today)
  const dayEvents = eventsByDay.get(dayKey(cursor)) ?? []

  return (
    <div className="px-[18px] py-4">
      <div className="mb-3 flex items-baseline gap-2">
        <span
          className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-[14px] font-medium ${
            isToday ? 'bg-signal text-paper' : 'bg-bone-soft text-ink'
          }`}
        >
          {cursor.getDate()}
        </span>
        <span className="text-[14px] text-ink">
          {cursor.toLocaleDateString('es-PA', {
            weekday: 'long',
          })}
        </span>
      </div>

      {dayEvents.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-steel">
          Sin eventos programados para este día.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {dayEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Event renderers ────────────────────────────────────────────────

function eventColor(status: string) {
  if (status === 'completed')
    return {
      pill: 'bg-bone-soft text-steel',
      dot: 'bg-steel-soft',
      card: 'border-bone bg-paper-warm text-steel',
    }
  if (status === 'cancelled' || status === 'no_show')
    return {
      pill: 'bg-signal-bg text-signal-deep',
      dot: 'bg-signal',
      card: 'border-signal/30 bg-signal-bg text-signal-deep',
    }
  return {
    pill: 'bg-ink text-paper',
    dot: 'bg-ink',
    card: 'border-bone bg-paper text-ink',
  }
}

function EventPill({ event }: { event: CalendarEvent }) {
  const colors = eventColor(event.status)
  const time = fmtTime(event.scheduledAt)
  return (
    <Link
      href={
        event.leadId
          ? `/app/leads/${event.leadId}`
          : event.propertyId
            ? `/app/properties/${event.propertyId}`
            : '/app/calendar'
      }
      className={`flex items-center gap-1 truncate rounded-[3px] px-1.5 py-0.5 text-[10px] hover:opacity-80 ${colors.pill}`}
    >
      <span className="font-mono">{time}</span>
      <span className="truncate">{event.title}</span>
    </Link>
  )
}

function EventCard({
  event,
  compact = false,
}: {
  event: CalendarEvent
  compact?: boolean
}) {
  const colors = eventColor(event.status)
  const time = fmtTime(event.scheduledAt)
  const [pending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(event.status)
  const isPast = new Date(event.scheduledAt).getTime() < Date.now()
  const isOpen = optimisticStatus !== 'completed' && optimisticStatus !== 'cancelled' && optimisticStatus !== 'no_show'

  function setStatus(
    next: 'completed' | 'cancelled',
    metadata?: Record<string, unknown>,
  ) {
    setOptimisticStatus(next)
    startTransition(async () => {
      await updateViewingStatus(event.id, next, metadata)
    })
  }

  return (
    <div className={`rounded-[6px] border px-2.5 py-2 ${colors.card}`}>
      <Link
        href={
          event.leadId
            ? `/app/leads/${event.leadId}`
            : event.propertyId
              ? `/app/properties/${event.propertyId}`
              : '/app/calendar'
        }
        className="block transition-colors hover:opacity-80"
      >
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
          <span className="font-mono text-[11px]">{time}</span>
        </div>
        <div className={`mt-0.5 truncate text-[${compact ? '12' : '13'}px] font-medium`}>
          {event.title}
        </div>
        <div className="mt-0.5 truncate text-[11px] opacity-70">
          {event.subtitle}
        </div>
      </Link>
      {isOpen && isPast && (
        <div className="mt-1.5 flex flex-wrap gap-1 border-t border-current/10 pt-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation()
              setStatus('completed')
            }}
            className="inline-flex items-center gap-1 rounded-[3px] bg-ink/90 px-1.5 py-0.5 text-[10px] font-medium text-paper hover:bg-ink disabled:opacity-50"
          >
            <Check className="h-2.5 w-2.5" strokeWidth={2} />
            Completar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation()
              setStatus('completed', { viewingType: 'avaluo' })
            }}
            className="inline-flex items-center gap-1 rounded-[3px] border border-current/20 px-1.5 py-0.5 text-[10px] font-medium hover:bg-current/5 disabled:opacity-50"
          >
            <FileSearch className="h-2.5 w-2.5" strokeWidth={1.6} />
            Avalúo
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation()
              setStatus('cancelled')
            }}
            className="inline-flex items-center gap-1 rounded-[3px] border border-current/20 px-1.5 py-0.5 text-[10px] font-medium hover:bg-current/5 disabled:opacity-50"
          >
            <X className="h-2.5 w-2.5" strokeWidth={1.6} />
          </button>
        </div>
      )}
    </div>
  )
}

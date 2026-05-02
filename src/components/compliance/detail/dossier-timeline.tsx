import { formatRelativeEs } from '@/lib/compliance-copy'

export type TimelineEvent = {
  id: string
  text: string
  time: string | null
  variant: 'flagged' | 'uploaded' | 'verified' | 'requested' | 'created' | 'default'
}

const DOT_COLORS: Record<TimelineEvent['variant'], string> = {
  flagged: 'bg-amber-mark',
  uploaded: 'bg-whatsapp',
  verified: 'bg-green-mark',
  requested: 'bg-steel-soft',
  created: 'bg-ink',
  default: 'bg-bone',
}

export function DossierTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="rounded-[10px] border border-bone bg-paper">
        <div className="flex items-center justify-between px-[18px] pt-3.5 pb-2.5">
          <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
            Historia
          </div>
        </div>
        <div className="px-[18px] pb-4 text-[12px] text-steel">
          El expediente acaba de empezar — los eventos aparecerán aquí.
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[10px] border border-bone bg-paper overflow-hidden">
      <div className="flex items-center justify-between px-[18px] pt-3.5 pb-2.5">
        <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
          Historia
        </div>
        <button
          type="button"
          className="text-[11px] text-steel hover:text-ink"
        >
          Ver todo →
        </button>
      </div>

      <div className="px-[18px] pb-4">
        {events.map((evt, i) => {
          const isLast = i === events.length - 1
          return (
            <div key={evt.id} className="relative grid grid-cols-[16px_1fr] gap-2.5 py-2">
              {/* Connecting line */}
              {!isLast && (
                <span
                  className="absolute left-[7px] top-[18px] -bottom-2 w-px bg-bone"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 mt-1 ml-[3px] h-[9px] w-[9px] rounded-full border-[1.5px] border-paper ${DOT_COLORS[evt.variant]}`}
                style={{
                  boxShadow: `0 0 0 0.5px var(--bone)`,
                }}
              />
              <div className="min-w-0">
                <div
                  className="text-[12px] leading-snug text-ink"
                  dangerouslySetInnerHTML={{ __html: evt.text }}
                />
                <div className="mt-0.5 font-mono text-[10px] text-steel">
                  {formatRelativeEs(evt.time)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

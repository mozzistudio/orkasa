import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Calendar } from 'lucide-react'
import type { UpcomingViewing } from '@/lib/queries/dashboard'

export async function VisitsPanel({
  viewings,
}: {
  viewings: UpcomingViewing[]
}) {
  const t = await getTranslations('dashboard.visits')

  if (viewings.length === 0) {
    return (
      <section className="rounded-[10px] border border-bone bg-paper">
        <div className="border-b border-bone px-[18px] py-[14px]">
          <div className="flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-bone-soft text-steel">
              <Calendar className="h-3 w-3" strokeWidth={1.5} />
            </span>
            {t('title')}
          </div>
        </div>
        <div className="px-[18px] py-6 text-center text-[13px] text-steel">
          {t('empty')}
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[10px] border border-bone bg-paper">
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] py-[14px]">
        <div className="min-w-0">
          <div className="mb-[3px] flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-bone-soft text-steel">
              <Calendar className="h-3 w-3" strokeWidth={1.5} />
            </span>
            {t('title')}
          </div>
          <div className="text-[11px] text-steel">
            {t('subtitle', { count: viewings.length })}
          </div>
        </div>
        <Link
          href="/app/leads?status=viewing_scheduled"
          className="flex-shrink-0 whitespace-nowrap text-[11px] text-steel hover:text-ink"
        >
          {t('viewAll')} →
        </Link>
      </div>

      {viewings.map((v) => {
        const date = new Date(v.scheduledAt)
        const isToday =
          date.toDateString() === new Date().toDateString()
        const time = date.toLocaleTimeString('es-PA', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        const day = isToday
          ? 'Hoy'
          : date.toLocaleDateString('es-PA', { weekday: 'short', day: 'numeric' })

        return (
          <Link
            key={v.id}
            href={v.leadId ? `/app/leads/${v.leadId}` : '/app/leads'}
            className="grid grid-cols-[48px_1fr] items-center gap-3 border-b border-bone px-[18px] py-[13px] transition-colors last:border-b-0 hover:bg-paper-warm"
          >
            <div className="text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.8px] text-steel">
                {day}
              </div>
              <div className="text-[15px] font-medium text-ink">{time}</div>
            </div>
            <div className="min-w-0">
              <div className="mb-[2px] truncate text-[13px] font-medium text-ink">
                {v.leadName}
              </div>
              <div className="truncate text-[11px] text-steel">
                {v.propertyTitle}
              </div>
            </div>
          </Link>
        )
      })}
    </section>
  )
}

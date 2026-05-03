import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { DocumentIcon } from '@/components/icons/icons'
import type { PendingReminder } from '@/lib/queries/dashboard'
import { CurrentDealRow } from './current-deal-row'

export async function CurrentDealsPanel({
  reminders,
}: {
  reminders: PendingReminder[]
}) {
  const t = await getTranslations('dashboard.currentDeals')

  if (reminders.length === 0) {
    return (
      <section className="rounded-[10px] border border-bone bg-paper">
        <div className="border-b border-bone px-[18px] py-[14px]">
          <div className="flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-amber-50 text-amber-text">
              <DocumentIcon size={12} />
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
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-amber-50 text-amber-text">
              <DocumentIcon size={12} />
            </span>
            {t('title')}
          </div>
          <div className="text-[11px] text-steel">
            {t('subtitle', { count: reminders.length })}
          </div>
        </div>
        <Link
          href="/app/compliance"
          className="flex-shrink-0 whitespace-nowrap text-[11px] text-steel hover:text-ink"
        >
          {t('viewAll')} →
        </Link>
      </div>

      {reminders.map((r) => (
        <CurrentDealRow key={r.id} reminder={r} />
      ))}
    </section>
  )
}

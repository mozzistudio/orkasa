import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { CoolingLead } from '@/lib/queries/dashboard'
import { CoolingLeadRow } from './cooling-lead-row'

export async function CoolingLeadsPanel({ leads }: { leads: CoolingLead[] }) {
  const t = await getTranslations('dashboard.cooling')

  if (leads.length === 0) {
    return (
      <section className="rounded-[10px] border border-bone bg-paper">
        <div className="border-b border-bone px-[18px] py-[14px]">
          <div className="text-[14px] font-medium text-ink flex items-center gap-[7px]">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-signal-bg text-signal-deep">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v6M8 14v.5"/><path d="M3 6l5-4 5 4M3 10l5 4 5-4"/></svg>
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
    <section className="rounded-[10px] border border-bone bg-paper overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] py-[14px]">
        <div className="min-w-0">
          <div className="mb-[3px] flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-signal-bg text-signal-deep">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v6M8 14v.5"/><path d="M3 6l5-4 5 4M3 10l5 4 5-4"/></svg>
            </span>
            {t('title')}
          </div>
          <div className="text-[11px] text-steel">
            {t('subtitle', { count: leads.length })}
          </div>
        </div>
        <Link
          href="/app/leads"
          className="flex-shrink-0 whitespace-nowrap text-[11px] text-steel hover:text-ink"
        >
          {t('viewPipeline')} →
        </Link>
      </div>

      {leads.map((lead) => (
        <CoolingLeadRow key={lead.id} lead={lead} />
      ))}
    </section>
  )
}

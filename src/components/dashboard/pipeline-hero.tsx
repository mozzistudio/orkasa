import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { formatPriceCompact } from '@/lib/utils'
import type { PipelineSnapshot } from '@/lib/queries/dashboard'

export async function PipelineHero({ data }: { data: PipelineSnapshot }) {
  const t = await getTranslations('dashboard.pipeline')
  const monthName = new Date().toLocaleString('es-PA', { month: 'long' })
  const lastMonthName = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1,
  ).toLocaleString('es-PA', { month: 'long' })

  const closableCount = data.closableDeals.length
  const trendUp = data.trends.closedDelta > 0
  const trendDown = data.trends.closedDelta < 0

  return (
    <section className="mb-7 rounded-[10px] border border-bone bg-paper">
      {/* Hero numbers */}
      <div className="flex flex-col gap-5 border-b border-bone px-6 py-[22px] lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
              {t('label')} · {monthName}
            </div>
            {data.trends.closedDelta !== 0 && (
              <div
                className={`font-mono text-[10px] ${
                  trendUp ? 'text-green-text' : trendDown ? 'text-signal-deep' : 'text-steel'
                }`}
              >
                {trendUp ? '↑' : trendDown ? '↓' : '→'} {Math.abs(data.trends.closedDelta)}% {t('vsLastMonth', { period: lastMonthName })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {/* Earned */}
            <div>
              <div className="text-[28px] font-medium leading-none tracking-[-0.5px] text-ink">
                {formatPriceCompact(data.commissionEarned)}
              </div>
              <div className="mt-1 text-[12px] text-steel">
                {t('commissionEarned')}
              </div>
            </div>

            <ArrowRight
              className="hidden h-4 w-4 text-steel-soft md:inline"
              strokeWidth={1.5}
            />

            {/* Closable */}
            <div>
              <div
                className={`text-[28px] font-medium leading-none tracking-[-0.5px] ${
                  data.commissionClosable > 0 ? 'text-green-text' : 'text-steel'
                }`}
              >
                {formatPriceCompact(data.commissionClosable)}
              </div>
              <div className="mt-1 text-[12px] text-steel">
                {t('commissionClosable', { count: closableCount })}
              </div>
            </div>
          </div>
        </div>

        {/* Visits this week — secondary metric */}
        <div className="text-right">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[1.2px] text-steel">
            {t('visits7d')}
          </div>
          <div className="text-[18px] font-medium text-ink">
            {data.trends.visitsThisWeek}
          </div>
          <div
            className={`mt-0.5 font-mono text-[11px] ${
              data.trends.visitsDelta > 0
                ? 'text-green-text'
                : data.trends.visitsDelta < 0
                  ? 'text-signal-deep'
                  : 'text-steel'
            }`}
          >
            {data.trends.visitsDelta > 0 ? '↑' : data.trends.visitsDelta < 0 ? '↓' : '→'}{' '}
            {Math.abs(data.trends.visitsDelta)} {t('vsLastWeek')}
          </div>
        </div>
      </div>

      {/* Closable deals */}
      {closableCount > 0 ? (
        <div className="border-b border-bone px-6 py-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            {t('closableDealsTitle', { count: closableCount, amount: formatPriceCompact(data.commissionClosable) })}
          </div>
          <div className="flex flex-col gap-2">
            {data.closableDeals.map((deal) => (
              <Link
                key={deal.leadId}
                href={`/app/leads/${deal.leadId}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-[6px] border border-bone bg-paper-warm px-4 py-3 transition-colors hover:border-steel-soft hover:bg-paper"
              >
                <div className="min-w-0">
                  <div className="mb-[2px] truncate text-[14px] font-medium text-ink">
                    {deal.leadName}
                  </div>
                  <div className="truncate text-[11px] text-steel">
                    {deal.propertyTitle ?? '—'} ·{' '}
                    <span className="text-amber-text">
                      {t('inNegotiationDays', { days: deal.daysInStage })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] font-medium text-ink">
                    {formatPriceCompact(deal.price)}
                  </div>
                  <div className="font-mono text-[11px] text-green-text">
                    {formatPriceCompact(deal.commission)} {t('commission')}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-steel" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-b border-bone px-6 py-4 text-[12px] text-steel">
          {t('noClosableDeals')}
        </div>
      )}

      {/* Lead distribution footer */}
      <div className="px-6 py-3">
        <div className="font-mono text-[11px] text-steel">
          <span className="uppercase tracking-[1px] text-steel">{t('activePortfolio')}: </span>
          {data.stages
            .filter((s) => s.id !== 'closed_won' && s.count > 0)
            .map((s) => `${s.count} ${s.name.toLowerCase()}`)
            .join(' · ') || t('emptyPortfolio')}
        </div>
      </div>
    </section>
  )
}

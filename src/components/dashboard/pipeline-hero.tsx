import { getTranslations } from 'next-intl/server'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPriceCompact } from '@/lib/utils'
import type { PipelineSnapshot } from '@/lib/queries/dashboard'

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="h-3 w-3" strokeWidth={1.75} />
  if (delta < 0) return <TrendingDown className="h-3 w-3" strokeWidth={1.75} />
  return <Minus className="h-3 w-3" strokeWidth={1.75} />
}

export async function PipelineHero({ data }: { data: PipelineSnapshot }) {
  const t = await getTranslations('dashboard.pipeline')
  const monthName = new Date().toLocaleString('es-PA', { month: 'long' })
  const lastMonthName = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1,
  ).toLocaleString('es-PA', { month: 'long' })

  const closableCount = data.closableDeals.length
  const closedTrendColor =
    data.trends.closedDelta > 0
      ? 'text-green-text'
      : data.trends.closedDelta < 0
        ? 'text-signal-deep'
        : 'text-steel'
  const visitsTrendColor =
    data.trends.visitsDelta > 0
      ? 'text-green-text'
      : data.trends.visitsDelta < 0
        ? 'text-signal-deep'
        : 'text-steel'

  return (
    <section className="mb-7 rounded-[10px] border border-bone bg-paper">
      <div className="flex flex-col gap-6 px-6 py-[22px] lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
              {t('label')} · {monthName}
            </div>
            {data.trends.closedDelta !== 0 && (
              <div
                className={`inline-flex items-center gap-1 font-mono text-[10px] ${closedTrendColor}`}
              >
                <TrendIcon delta={data.trends.closedDelta} />
                {Math.abs(data.trends.closedDelta)}%{' '}
                {t('vsLastMonth', { period: lastMonthName })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
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

        <div className="text-right">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[1.2px] text-steel">
            {t('visits7d')}
          </div>
          <div className="text-[18px] font-medium text-ink">
            {data.trends.visitsThisWeek}
          </div>
          <div
            className={`mt-0.5 inline-flex items-center justify-end gap-1 font-mono text-[11px] ${visitsTrendColor}`}
          >
            <TrendIcon delta={data.trends.visitsDelta} />
            {Math.abs(data.trends.visitsDelta)} {t('vsLastWeek')}
          </div>
        </div>
      </div>

      <div className="border-t border-bone px-6 py-3">
        <div className="font-mono text-[11px] text-steel">
          <span className="uppercase tracking-[1px] text-steel">
            {t('activePortfolio')}:
          </span>{' '}
          {data.stages
            .filter((s) => s.id !== 'closed_won' && s.count > 0)
            .map((s) => `${s.count} ${s.name.toLowerCase()}`)
            .join(' · ') || t('emptyPortfolio')}
        </div>
      </div>
    </section>
  )
}

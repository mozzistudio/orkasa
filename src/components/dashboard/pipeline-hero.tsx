import { getTranslations } from 'next-intl/server'
import { formatPriceCompact } from '@/lib/utils'
import type { PipelineSnapshot } from '@/lib/queries/dashboard'
import { PipelineStageBar } from './pipeline-stage-bar'

const STAGE_COLORS = [
  'bg-[#DDD9CC]',
  'bg-[#C5B8A0]',
  'bg-amber-mark',
  'bg-signal',
  'bg-signal-deep',
  'bg-green-mark',
]

export async function PipelineHero({ data }: { data: PipelineSnapshot }) {
  const t = await getTranslations('dashboard.pipeline')

  const lastMonthName = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1,
  ).toLocaleString('es-PA', { month: 'long' })

  return (
    <section className="mb-7 rounded-[10px] border border-bone bg-paper px-6 py-[22px]">
      {/* Top row */}
      <div className="mb-[18px] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            {t('label')}
          </div>
          <div className="mb-1.5 text-[32px] font-medium leading-none tracking-[-1px] text-ink">
            {formatPriceCompact(data.totalValue)}
          </div>
          <div className="text-[13px] text-steel">
            <span className="font-medium text-green-text">
              {formatPriceCompact(data.readyToSign)} {t('readyToSign')}
            </span>
            {' · '}
            <span className="font-medium text-ink">
              {formatPriceCompact(data.closedThisMonth)} {t('closedAlready')}
            </span>
            {' · '}
            <span className="text-steel">
              {t('estimatedCommission')} {formatPriceCompact(data.estimatedCommission)}
            </span>
          </div>
        </div>

        <div className="flex w-full justify-between gap-6 lg:w-auto lg:justify-end">
          <TrendStat
            label={t('closedMonth')}
            value={formatPriceCompact(data.closedThisMonth)}
            delta={data.trends.closedDelta}
            suffix={`vs ${lastMonthName}`}
          />
          <TrendStat
            label={t('closeRate')}
            value={`${data.closeRate}%`}
            delta={data.trends.closeRateDelta}
            suffix={t('pts')}
          />
          <TrendStat
            label={t('visits7d')}
            value={String(data.trends.visitsThisWeek)}
            delta={data.trends.visitsDelta}
            suffix="vs sem. pasada"
          />
        </div>
      </div>

      {/* Stacked bar + stages */}
      <PipelineStageBar stages={data.stages} colors={STAGE_COLORS} />
    </section>
  )
}

function TrendStat({
  label,
  value,
  delta,
  suffix,
}: {
  label: string
  value: string
  delta: number
  suffix: string
}) {
  const isUp = delta > 0
  const isDown = delta < 0
  return (
    <div className="text-right">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[1.2px] text-steel">
        {label}
      </div>
      <div className="text-[18px] font-medium text-ink">{value}</div>
      <div
        className={`mt-0.5 font-mono text-[11px] ${
          isUp ? 'text-green-text' : isDown ? 'text-signal-deep' : 'text-steel'
        }`}
      >
        {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(delta)} {suffix}
      </div>
    </div>
  )
}

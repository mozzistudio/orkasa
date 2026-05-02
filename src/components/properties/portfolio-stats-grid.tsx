import { Minus } from 'lucide-react'
import { TrendingUpIcon, TrendingDownIcon } from '@/components/icons/icons'
import { formatPriceCompact } from '@/lib/utils'
import type { PortfolioSnapshot } from '@/lib/queries/properties'

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-steel">
        <Minus className="h-3 w-3" strokeWidth={1.75} />
        sin cambio
      </span>
    )
  }
  const Icon = delta > 0 ? TrendingUpIcon : TrendingDownIcon
  return (
    <span
      className={`inline-flex items-center gap-1 ${delta > 0 ? 'text-green-text' : 'text-signal-deep'} font-medium`}
    >
      <Icon size={12} />
      {delta > 0 ? '+' : ''}
      {delta} esta semana
    </span>
  )
}

export function PortfolioStatsGrid({ data }: { data: PortfolioSnapshot }) {
  return (
    <div className="mb-6 grid grid-cols-1 overflow-hidden rounded-[8px] border border-bone bg-paper md:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Valor portfolio"
        value={formatPriceCompact(data.totalValue)}
        meta={
          <>
            <span className="text-ink">{data.activeCount}</span> propiedades
            activas
          </>
        }
      />
      <Stat
        label="Leads activos"
        value={String(data.totalLeads)}
        meta={<DeltaPill delta={data.recentLeadsDelta} />}
      />
      <Stat
        label="Visitas agendadas"
        value={String(data.upcomingViewings)}
        meta="próximos 7 días"
      />
      <Stat
        label="Necesitan atención"
        value={String(data.needsAttentionCount)}
        valueClassName={
          data.needsAttentionCount > 0 ? 'text-signal-deep' : 'text-ink'
        }
        meta={
          data.needsAttentionCount > 0 ? (
            <span className="font-medium text-signal-deep">
              estancadas o por vencer
            </span>
          ) : (
            'todas en buena tracción'
          )
        }
      />
    </div>
  )
}

function Stat({
  label,
  value,
  meta,
  valueClassName,
}: {
  label: string
  value: string
  meta: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="border-b border-bone px-[18px] py-[14px] last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:border-r">
      <div className="mb-[6px] font-mono text-[9px] uppercase tracking-[1.2px] text-steel">
        {label}
      </div>
      <div
        className={`mb-1 text-[20px] font-medium leading-none tracking-[-0.5px] ${valueClassName ?? 'text-ink'}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-steel">{meta}</div>
    </div>
  )
}

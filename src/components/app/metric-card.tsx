import { cn } from '@/lib/utils'

export function MetricCard({
  label,
  value,
  change,
  trend,
}: {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-[4px] border border-bone bg-paper p-4">
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-[24px] font-medium tabular-nums text-ink">
          {value}
        </span>
        <span
          className={cn(
            'font-mono text-[12px] tabular-nums',
            trend === 'up' && 'text-[#0A6B3D]',
            trend === 'down' && 'text-signal',
            trend === 'neutral' && 'text-steel',
          )}
        >
          {change}
        </span>
      </div>
    </div>
  )
}

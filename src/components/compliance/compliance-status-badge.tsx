import { cn } from '@/lib/utils'

const VARIANT_CLASSES = {
  late: 'bg-signal-soft text-signal',
  soon: 'bg-[#FBF1DF] text-[#6B4419]',
  ok: 'bg-bone text-steel',
} as const

export function ComplianceStatusBadge({
  variant,
  children,
  className,
}: {
  variant: 'late' | 'soon' | 'ok'
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] uppercase leading-tight tracking-[0.8px]',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

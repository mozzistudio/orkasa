import type { CompletionTone } from '@/lib/properties/types'

const TONE_BG: Record<CompletionTone, string> = {
  low: 'bg-signal',
  mid: 'bg-amber-mark',
  high: 'bg-green-mark',
}

export function CompletionBar({
  pct,
  tone,
  label,
}: {
  pct: number
  tone: CompletionTone
  label: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1 overflow-hidden rounded-full bg-bone">
        <div
          className={`h-full rounded-full ${TONE_BG[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] text-steel">
        <span className={tone === 'high' ? 'text-green-text' : ''}>{label}</span>
        <span className="font-medium text-ink">{pct}%</span>
      </div>
    </div>
  )
}

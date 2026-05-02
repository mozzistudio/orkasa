type Metric = {
  value: string | number
  label: string
  tone?: 'default' | 'warn' | 'good'
}

const TONE_STYLES = {
  default: 'text-ink',
  warn: 'text-signal-deep',
  good: 'text-green-text',
}

export function PropertyMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="my-2 grid grid-cols-3 gap-2 border-y border-bone py-[10px]">
      {metrics.map((m, i) => (
        <div key={i} className="text-center">
          <div
            className={`mb-[3px] font-mono text-[14px] font-medium leading-none ${TONE_STYLES[m.tone ?? 'default']}`}
          >
            {m.value}
          </div>
          <div className="text-[10px] leading-tight text-steel">{m.label}</div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { Minus, Plus } from 'lucide-react'

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  label,
}: {
  value: number | null
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}) {
  const current = value ?? min

  return (
    <div className="space-y-1.5 md:space-y-2">
      {label && (
        <span className="block text-[13px] text-ink">{label}</span>
      )}
      <div className="flex items-center rounded-[4px] border border-bone">
        <button
          type="button"
          disabled={current <= min}
          onClick={() => onChange(Math.max(min, current - step))}
          className="flex h-11 w-11 items-center justify-center text-steel transition-colors hover:text-ink disabled:opacity-30 md:h-9 md:w-9"
        >
          <Minus className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="flex-1 text-center font-mono text-[14px] tabular-nums text-ink md:text-[13px]">
          {step < 1 ? current.toFixed(1) : current}
        </span>
        <button
          type="button"
          disabled={current >= max}
          onClick={() => onChange(Math.min(max, current + step))}
          className="flex h-11 w-11 items-center justify-center text-steel transition-colors hover:text-ink disabled:opacity-30 md:h-9 md:w-9"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

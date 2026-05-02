'use client'

import { useRouter } from '@/i18n/navigation'
import type { PipelineStage } from '@/lib/queries/dashboard'
import { cn } from '@/lib/utils'

export function PipelineStageBar({
  stages,
  colors,
}: {
  stages: PipelineStage[]
  colors: string[]
}) {
  const router = useRouter()
  const total = stages.reduce((s, st) => s + st.value, 0)

  function handleClick(stageId: string) {
    router.push(`/app/leads?status=${stageId}`)
  }

  return (
    <div className="mt-1">
      {/* Color bar */}
      <div className="mb-3 flex gap-1" style={{ height: 8 }}>
        {stages.map((stage, i) => {
          const flex = total > 0 ? stage.value / total : 1 / stages.length
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleClick(stage.id)}
              className={cn(
                'rounded-[3px] transition-opacity hover:opacity-75',
                colors[i] ?? 'bg-bone',
              )}
              style={{ flex }}
              title={`${stage.name}: ${stage.count} · $${Math.round(stage.value / 1000)}K`}
            />
          )
        })}
      </div>

      {/* Stage labels */}
      <div className="grid gap-1" style={{ gridTemplateColumns: stages.map((s) => {
        const flex = total > 0 ? s.value / total : 1 / stages.length
        return `${flex}fr`
      }).join(' ') }}>
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleClick(stage.id)}
              className="cursor-pointer px-0.5 text-left"
            >
              <div
                className={cn(
                  'mb-[3px] text-[11px] text-steel hover:text-ink',
                  isLast && 'text-green-text',
                )}
              >
                {stage.name}
              </div>
              <div
                className={cn(
                  'font-mono text-[12px] font-medium text-ink',
                  isLast && 'text-green-text',
                )}
              >
                ${Math.round(stage.value / 1000)}K
              </div>
              <div className="mt-[1px] text-[10px] text-steel-soft">
                {stage.count} {stage.count === 1 ? 'lead' : stage.id === 'closed_won' || stage.id === 'negotiating' || stage.id === 'viewing_scheduled' ? 'deals' : 'leads'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { Check, Circle, AlertTriangle, Minus } from 'lucide-react'
import { TASK_CATALOG } from '@/lib/tasks/task-catalog'
import type { TaskPhase, TaskContext } from '@/lib/tasks/types'

const PHASE_ORDER: TaskPhase[] = [
  'contacto_inicial',
  'visitas',
  'financiamiento',
  'negociacion',
  'cumplimiento',
  'cierre_legal',
  'tramite_bancario',
  'entrega',
  'post_cierre',
]

const PHASE_LABEL: Record<TaskPhase, string> = {
  contacto_inicial: 'Contacto inicial',
  visitas: 'Visitas',
  financiamiento: 'Financiamiento',
  negociacion: 'Negociacion',
  cumplimiento: 'Cumplimiento',
  cierre_legal: 'Cierre legal',
  tramite_bancario: 'Tramite bancario',
  entrega: 'Entrega',
  post_cierre: 'Post cierre',
}

const PHASE_IDX: Record<TaskPhase, number> = Object.fromEntries(
  PHASE_ORDER.map((p, i) => [p, i]),
) as Record<TaskPhase, number>

const MAX_PHASE_AT_STAGE: Record<string, number> = {
  contacto_inicial: 0,
  visitas: 2,
  negociacion: 3,
  promesa_firmada: 5,
  tramite_bancario: 6,
  escritura_publica: 6,
  entrega_llaves: 7,
  post_cierre: 8,
  closed_won: 8,
  closed_lost: 8,
}

const STATUS_PRIORITY: Record<string, number> = {
  escalated: 4,
  open: 3,
  done: 2,
  skipped: 1,
}

type TaskRow = { step_number: number; title: string; status: string }

type Props = {
  dealStage: string
  tasks: TaskRow[]
  leadFirstName: string
}

function bestTaskPerStep(tasks: TaskRow[]): Map<number, TaskRow> {
  const m = new Map<number, TaskRow>()
  for (const t of tasks) {
    const prev = m.get(t.step_number)
    if (!prev || (STATUS_PRIORITY[t.status] ?? 0) > (STATUS_PRIORITY[prev.status] ?? 0)) {
      m.set(t.step_number, t)
    }
  }
  return m
}

export function OperacionTaskPipeline({ dealStage, tasks, leadFirstName }: Props) {
  const taskMap = bestTaskPerStep(tasks)
  const maxPhase = MAX_PHASE_AT_STAGE[dealStage] ?? 0

  const ctx: TaskContext = {
    firstName: leadFirstName,
    leadName: leadFirstName,
  }

  const groups = PHASE_ORDER.map((phase) => {
    const reached = PHASE_IDX[phase] <= maxPhase
    const steps = TASK_CATALOG.filter((e) => e.phase === phase)
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((entry) => {
        const task = taskMap.get(entry.stepNumber)
        let title: string
        try {
          title = task?.title ?? entry.titleTemplate(ctx)
        } catch {
          title = entry.description
        }
        return {
          stepNumber: entry.stepNumber,
          title,
          status: (task?.status ?? 'future') as
            | 'done'
            | 'open'
            | 'escalated'
            | 'skipped'
            | 'future',
        }
      })

    const doneCount = steps.filter((s) => s.status === 'done').length

    return { phase, reached, steps, doneCount }
  })

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft">
        <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
          Pipeline
        </h3>
      </div>

      <div className="px-4 py-3 space-y-3">
        {groups.map(({ phase, reached, steps, doneCount }) => {
          const allDone = doneCount === steps.length && doneCount > 0

          return (
            <div key={phase} className={reached ? '' : 'opacity-30'}>
              {/* Phase header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] tracking-[1.2px] uppercase text-steel">
                  {PHASE_LABEL[phase]}
                </span>
                <span className="font-mono text-[10px] text-steel-soft tabular-nums">
                  {doneCount}/{steps.length}
                </span>
                {allDone && (
                  <Check
                    className="h-[10px] w-[10px] text-green-mark"
                    strokeWidth={2.5}
                  />
                )}
              </div>

              {/* Steps */}
              <ul className="space-y-px">
                {steps.map((step) => (
                  <li
                    key={step.stepNumber}
                    className="flex items-start gap-2 py-[3px]"
                  >
                    <StepDot status={step.status} />
                    <span
                      className={`text-[11px] leading-[15px] line-clamp-1 ${
                        step.status === 'done'
                          ? 'text-steel-soft'
                          : step.status === 'open' || step.status === 'escalated'
                            ? 'text-ink'
                            : 'text-steel-soft'
                      }`}
                    >
                      {step.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StepDot({ status }: { status: string }) {
  const base = 'mt-[2px] shrink-0'

  switch (status) {
    case 'done':
      return (
        <Check
          className={`h-[11px] w-[11px] text-green-mark ${base}`}
          strokeWidth={2.5}
        />
      )
    case 'open':
      return (
        <Circle
          className={`h-[11px] w-[11px] text-signal fill-signal ${base}`}
          strokeWidth={0}
        />
      )
    case 'escalated':
      return (
        <AlertTriangle
          className={`h-[11px] w-[11px] text-signal ${base}`}
          strokeWidth={2}
        />
      )
    case 'skipped':
      return (
        <Minus
          className={`h-[11px] w-[11px] text-steel-soft ${base}`}
          strokeWidth={2}
        />
      )
    default:
      return (
        <Circle
          className={`h-[11px] w-[11px] text-bone ${base}`}
          strokeWidth={1.5}
        />
      )
  }
}

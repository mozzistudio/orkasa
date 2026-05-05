'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Circle } from 'lucide-react'
import { TASK_CATALOG } from '@/lib/tasks/task-catalog'
import { updateDealStage } from '../../deals/actions'

const STAGES = [
  'contacto_inicial',
  'visitas',
  'negociacion',
  'promesa_firmada',
  'tramite_bancario',
  'escritura_publica',
  'entrega_llaves',
  'post_cierre',
] as const
type Stage = (typeof STAGES)[number]

const STAGE_LABEL: Record<Stage, string> = {
  contacto_inicial: 'Contacto',
  visitas: 'Visitas',
  negociacion: 'Negociación',
  promesa_firmada: 'Promesa',
  tramite_bancario: 'Banco',
  escritura_publica: 'Escritura',
  entrega_llaves: 'Entrega',
  post_cierre: 'Post cierre',
}

const STAGE_FULL_LABEL: Record<Stage, string> = {
  contacto_inicial: 'Contacto inicial',
  visitas: 'Visitas',
  negociacion: 'Negociación',
  promesa_firmada: 'Promesa firmada',
  tramite_bancario: 'Trámite bancario',
  escritura_publica: 'Escritura pública',
  entrega_llaves: 'Entrega de llaves',
  post_cierre: 'Post cierre',
}

const STAGE_STEPS: Record<Stage, number[]> = {
  contacto_inicial: [1, 2, 3, 4],
  visitas: [6, 7, 8, 9],
  negociacion: [10, 36, 35],
  promesa_firmada: [11, 16, 17, 18, 19],
  tramite_bancario: [20, 21, 22],
  escritura_publica: [23, 24, 25, 26],
  entrega_llaves: [27, 28],
  post_cierre: [29, 30, 31, 32, 33, 34],
}

// Short, broker-friendly labels used in the compact pipeline popups and the
// inline current-stage list. Names omit the lead's name and trim the verbose
// instructional text — keep around 3-5 words.
const STEP_SHORT_LABEL: Record<number, string> = {
  1: 'Primer mensaje',
  2: 'Llamada de calificación',
  3: 'Enviar 3 propiedades + visitas',
  4: 'Recordatorio 48h sin respuesta',
  6: 'Recordatorio de visita',
  7: 'Visita',
  8: 'Seguimiento post-visita',
  10: 'Registrar oferta verbal',
  11: 'Recolectar expediente compliance',
  16: 'Verificar PEP + sanciones',
  17: 'Notificar al abogado',
  18: 'Enviar borrador de promesa',
  19: 'Promesa firmada',
  20: 'Coordinar avalúo',
  21: 'Confirmar avalúo',
  22: 'Préstamo aprobado',
  23: 'Pedir documentos al vendedor',
  24: 'Verificar documentos del vendedor',
  25: 'Inspección final',
  26: 'Firma de escritura',
  27: 'Coordinar entrega de llaves',
  28: 'Firmar acta de entrega',
  29: 'Enviar copia de escritura',
  30: 'Seguimiento 1 mes',
  31: 'Seguimiento 3 meses + referidos',
  32: 'Encuesta 6 meses',
  33: 'Aniversario 1 año',
  34: 'Check-in anual',
  35: 'Transmitir oferta al propietario',
  36: 'Pedir carta de pre-aprobación',
  37: 'Avisar al propietario',
  38: 'Avisar al cliente',
}

type TaskRow = { step_number: number; status: string }

type Props = {
  dealId: string
  dealStage: string
  stageEnteredAt: string | null
  tasks: TaskRow[]
  isClosed?: boolean
}

function stageStatus(stage: Stage, currentStage: string): 'past' | 'current' | 'future' {
  const idx = STAGES.indexOf(stage)
  const curIdx = STAGES.indexOf(currentStage as Stage)

  if (currentStage === 'closed_won' || currentStage === 'closed_lost') return 'past'
  if (curIdx === -1) return 'future'

  if (idx < curIdx) return 'past'
  if (idx === curIdx) return 'current'
  return 'future'
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}


export function OperacionTaskPipeline({
  dealId,
  dealStage,
  stageEnteredAt,
  tasks,
  isClosed,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const taskByStep = new Map(tasks.map((t) => [t.step_number, t]))

  const days = daysSince(stageEnteredAt)
  const currentStage = STAGES.includes(dealStage as Stage)
    ? (dealStage as Stage)
    : null
  const currentStepNumbers = currentStage ? STAGE_STEPS[currentStage] : []
  const currentDoneCount = currentStepNumbers.filter(
    (n) => taskByStep.get(n)?.status === 'done',
  ).length

  function handleStageClick(stage: Stage) {
    if (isClosed || pending || stage === dealStage) return
    startTransition(async () => {
      const res = await updateDealStage(dealId, stage)
      if (!res?.error) router.refresh()
    })
  }

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-visible">
      <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft flex items-center justify-between">
        <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
          Pipeline
        </h3>
        {pending && (
          <span className="font-mono text-[10px] uppercase tracking-[1px] text-steel-soft">
            Actualizando…
          </span>
        )}
      </div>

      <div className={`px-4 py-5 ${pending ? 'opacity-60' : ''}`}>
        <div className="relative flex items-start min-w-[560px] sm:min-w-0 overflow-x-auto sm:overflow-visible">
          <div
            className="absolute top-[10px] h-px bg-bone pointer-events-none"
            style={{ left: 'calc(100% / 16)', right: 'calc(100% / 16)' }}
          />

          {STAGES.map((stage) => {
            const status = stageStatus(stage, dealStage)
            const stepNumbers = STAGE_STEPS[stage]
            const doneCount = stepNumbers.filter(
              (n) => taskByStep.get(n)?.status === 'done',
            ).length

            return (
              <StageCell
                key={stage}
                stage={stage}
                status={status}
                stepNumbers={stepNumbers}
                doneCount={doneCount}
                taskByStep={taskByStep}
                onClick={() => handleStageClick(stage)}
                disabled={isClosed || pending}
              />
            )
          })}
        </div>

        {currentStage && (
          <div className="mt-5 pt-4 border-t border-bone-soft">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="font-mono text-[10px] tracking-[1.2px] uppercase text-signal-deep">
                {STAGE_FULL_LABEL[currentStage]}
                {days != null && (
                  <span className="ml-2 text-steel-soft">· Día {days}</span>
                )}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-steel-soft">
                {currentDoneCount}/{currentStepNumbers.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {currentStepNumbers.map((n) => {
                const entry = TASK_CATALOG.find((e) => e.stepNumber === n)
                if (!entry) return null
                const taskStatus = taskByStep.get(n)?.status
                const isDone = taskStatus === 'done'
                const isActive =
                  taskStatus === 'open' || taskStatus === 'escalated'
                const title = STEP_SHORT_LABEL[n] ?? entry.description
                return (
                  <li
                    key={n}
                    className="flex items-start gap-2 text-[12px] leading-[16px]"
                  >
                    <StepIcon isDone={isDone} isActive={isActive} />
                    <span
                      className={
                        isDone
                          ? 'text-steel'
                          : isActive
                            ? 'text-ink font-medium'
                            : 'text-steel-soft'
                      }
                    >
                      {title}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function StageCell({
  stage,
  status,
  stepNumbers,
  doneCount,
  taskByStep,
  onClick,
  disabled,
}: {
  stage: Stage
  status: 'past' | 'current' | 'future'
  stepNumbers: number[]
  doneCount: number
  taskByStep: Map<number, TaskRow>
  onClick: () => void
  disabled: boolean
}) {
  const label = STAGE_LABEL[stage]
  const interactive = !disabled && status !== 'current'

  const cellClass = `flex-1 flex flex-col items-center min-w-0 relative z-10 group ${
    interactive
      ? 'cursor-pointer'
      : status === 'current'
        ? 'cursor-default'
        : 'cursor-not-allowed'
  }`

  if (status === 'past') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cellClass}
        title={`Volver a ${STAGE_FULL_LABEL[stage]}`}
      >
        <div className="h-[20px] w-[20px] rounded-full bg-ink flex items-center justify-center transition-transform group-hover:scale-110">
          <Check className="h-[12px] w-[12px] text-paper" strokeWidth={3} />
        </div>
        <span className="mt-2 text-[11px] text-steel text-center px-1 line-clamp-1 group-hover:text-ink">
          {label}
        </span>

        <StagePopup
          stage={stage}
          stepNumbers={stepNumbers}
          doneCount={doneCount}
          taskByStep={taskByStep}
        />
      </button>
    )
  }

  if (status === 'current') {
    return (
      <div className="flex-1 flex flex-col items-center min-w-0 relative z-10">
        <div className="h-[20px] w-[20px] rounded-full bg-signal flex items-center justify-center ring-4 ring-signal-soft">
          <span className="h-[6px] w-[6px] rounded-full bg-paper" />
        </div>
        <span className="mt-2 text-[11px] font-medium text-signal-deep text-center px-1 line-clamp-1">
          {label}
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cellClass}
      title={`Avanzar a ${STAGE_FULL_LABEL[stage]}`}
    >
      <div className="h-[20px] w-[20px] rounded-full border-[1.5px] border-bone bg-paper transition-colors group-hover:border-ink" />
      <span className="mt-2 text-[11px] text-steel-soft text-center px-1 line-clamp-1 group-hover:text-ink">
        {label}
      </span>

      <StagePopup
        stage={stage}
        stepNumbers={stepNumbers}
        doneCount={doneCount}
        taskByStep={taskByStep}
      />
    </button>
  )
}

function StagePopup({
  stage,
  stepNumbers,
  doneCount,
  taskByStep,
}: {
  stage: Stage
  stepNumbers: number[]
  doneCount: number
  taskByStep: Map<number, TaskRow>
}) {
  return (
    <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] rounded-[8px] border border-bone bg-paper p-3 z-50 text-left">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-[1.2px] uppercase text-steel">
          {STAGE_FULL_LABEL[stage]}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-steel-soft">
          {doneCount}/{stepNumbers.length}
        </span>
      </div>
      <ul className="space-y-1">
        {stepNumbers.map((n) => {
          const entry = TASK_CATALOG.find((e) => e.stepNumber === n)
          if (!entry) return null
          const taskStatus = taskByStep.get(n)?.status
          const isDone = taskStatus === 'done'
          const isActive = taskStatus === 'open' || taskStatus === 'escalated'
          const title = STEP_SHORT_LABEL[n] ?? entry.description
          return (
            <li
              key={n}
              className="flex items-start gap-1.5 text-[11px] leading-[15px]"
            >
              <StepIcon isDone={isDone} isActive={isActive} />
              <span
                className={
                  isDone
                    ? 'line-clamp-2 text-steel'
                    : isActive
                      ? 'line-clamp-2 text-ink'
                      : 'line-clamp-2 text-steel-soft'
                }
              >
                {title}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function StepIcon({ isDone, isActive }: { isDone: boolean; isActive: boolean }) {
  if (isDone) {
    return (
      <span className="shrink-0 mt-[2px] h-[12px] w-[12px] rounded-full bg-ink flex items-center justify-center">
        <Check className="h-[8px] w-[8px] text-paper" strokeWidth={3} />
      </span>
    )
  }
  if (isActive) {
    return (
      <span className="shrink-0 mt-[2px] h-[12px] w-[12px] rounded-full bg-signal" />
    )
  }
  return (
    <Circle
      className="shrink-0 mt-[2px] h-[12px] w-[12px] text-bone"
      strokeWidth={1.5}
    />
  )
}

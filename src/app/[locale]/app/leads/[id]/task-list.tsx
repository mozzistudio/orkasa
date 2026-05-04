'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Phone,
  Calendar,
  FileText,
  DollarSign,
  Calculator,
  Shield,
  Check,
  ArrowRight,
  X,
} from 'lucide-react'
import { completeTask, skipTask } from '../actions'
import {
  executeCtaAction,
  getCtaLabel,
  getCtaIcon,
  isCtaActionable,
  getCtaUnavailableReason,
  resolveCtaPhone,
} from '@/lib/tasks/cta-handlers'
import type { CtaCallbacks } from '@/lib/tasks/cta-handlers'
import type { TaskRow, CtaAction } from '@/lib/tasks/types'
import { ScheduleVisitModal } from '@/components/app/modals/schedule-visit-modal'
import { OfferFormModal } from '@/components/app/modals/offer-form-modal'
import { RequestDocModal } from '@/components/app/modals/request-doc-modal'
import { FinancingSimModal } from '@/components/app/modals/financing-sim-modal'

type Props = {
  tasks: TaskRow[]
  leadName: string
  agentName?: string
  phone?: string
  propertyPrice?: number
}

function urgencyFromDueAt(dueAt: string | null, status: string) {
  if (status === 'escalated') {
    return {
      label: 'Escalada',
      style: 'bg-signal-bg text-signal-deep',
    }
  }
  if (!dueAt) {
    return { label: 'Pendiente', style: 'bg-paper-warm text-steel' }
  }
  const diff = Math.floor(
    (new Date(dueAt).getTime() - Date.now()) / 86_400_000,
  )
  if (diff < 0) {
    return {
      label: `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) === 1 ? '' : 's'}`,
      style: 'bg-signal-bg text-signal-deep',
    }
  }
  if (diff === 0) {
    return { label: 'Hoy', style: 'bg-amber-bg text-amber-text' }
  }
  if (diff === 1) {
    return { label: 'Mañana', style: 'bg-amber-bg text-amber-text' }
  }
  if (diff <= 7) {
    return { label: 'Esta semana', style: 'bg-amber-bg text-amber-text' }
  }
  return {
    label: `En ${diff} días`,
    style: 'bg-paper-warm text-steel',
  }
}

function CtaIcon({ icon }: { icon: string }) {
  const cls = 'h-3 w-3'
  const sw = 1.5
  switch (icon) {
    case 'phone':
      return <Phone className={cls} strokeWidth={sw} />
    case 'calendar':
      return <Calendar className={cls} strokeWidth={sw} />
    case 'file':
      return <FileText className={cls} strokeWidth={sw} />
    case 'dollar':
      return <DollarSign className={cls} strokeWidth={sw} />
    case 'calculator':
      return <Calculator className={cls} strokeWidth={sw} />
    case 'shield':
      return <Shield className={cls} strokeWidth={sw} />
    case 'check':
      return <Check className={cls} strokeWidth={sw} />
    case 'arrow-right':
      return <ArrowRight className={cls} strokeWidth={sw} />
    case 'whatsapp':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
        </svg>
      )
    default:
      return null
  }
}

const PHASE_LABELS: Record<string, string> = {
  contacto_inicial: 'Contacto inicial',
  visitas: 'Visitas',
  financiamiento: 'Financiamiento',
  negociacion: 'Negociación',
  cumplimiento: 'Cumplimiento',
  cierre_legal: 'Cierre legal',
  tramite_bancario: 'Trámite bancario',
  entrega: 'Entrega',
  post_cierre: 'Post cierre',
}

export function TaskList({ tasks, leadName, agentName, phone, propertyPrice }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeModal, setActiveModal] = useState<{
    type: string
    props: Record<string, unknown>
  } | null>(null)

  const callbacks: CtaCallbacks = {
    openModal: (modal, props) => setActiveModal({ type: modal, props }),
    navigate: (path) => router.push(path),
    onComplete: (taskId) => {
      startTransition(async () => {
        await completeTask(taskId)
      })
    },
  }

  function handleCta(task: TaskRow) {
    const cta = (task.cta_metadata ?? {}) as Record<string, unknown>
    const meta = {
      ...cta,
      taskId: task.id,
      leadId: task.lead_id,
      propertyId: task.property_id,
      dealId: task.deal_id,
      clientName: leadName.split(' ')[0],
      leadFullName: leadName,
      agentName,
      phone: resolveCtaPhone(cta, phone ?? null),
    }
    executeCtaAction(task.cta_action as CtaAction, meta, callbacks)
  }

  function handleSkip(taskId: string) {
    startTransition(async () => {
      await skipTask(taskId)
    })
  }

  function handleComplete(taskId: string) {
    startTransition(async () => {
      await completeTask(taskId)
    })
  }

  if (tasks.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-steel">
        Sin tareas pendientes.
      </p>
    )
  }

  // Group by phase
  const grouped: Array<{ phase: string; label: string; items: TaskRow[] }> = []
  for (const task of tasks) {
    let group = grouped.find((g) => g.phase === task.phase)
    if (!group) {
      group = {
        phase: task.phase,
        label: PHASE_LABELS[task.phase] ?? task.phase,
        items: [],
      }
      grouped.push(group)
    }
    group.items.push(task)
  }

  const firstLeadId = tasks[0]?.lead_id ?? ''

  return (
    <>
      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        {grouped.map((group) => (
          <div key={group.phase}>
            {grouped.length > 1 && (
              <p className="font-mono text-[9px] tracking-[1px] uppercase text-steel mt-3 mb-1 px-0.5">
                {group.label}
              </p>
            )}
            {group.items.map((task) => {
              const urgency = urgencyFromDueAt(task.due_at, task.status)
              const icon = getCtaIcon(task.cta_action as CtaAction)
              const label = getCtaLabel(task.cta_action as CtaAction)
              const actionable = isCtaActionable(
                task.cta_action as CtaAction,
                task.cta_metadata,
                phone ?? null,
              )
              const unavailableReason = actionable
                ? ''
                : getCtaUnavailableReason(
                    task.cta_action as CtaAction,
                    task.cta_metadata,
                  )

              return (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-4 py-3.5 border-b border-bone-soft last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] text-ink leading-normal">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full bg-bone-soft text-steel font-medium">
                        Auto
                      </span>
                      <span
                        className={`font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium ${urgency.style}`}
                      >
                        {urgency.label}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      onClick={() => handleCta(task)}
                      disabled={!actionable}
                      title={unavailableReason || undefined}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                        actionable
                          ? 'bg-ink text-white hover:bg-coal'
                          : 'bg-bone-soft text-steel cursor-not-allowed'
                      }`}
                    >
                      <CtaIcon icon={icon} />
                      {label}
                    </button>
                    <button
                      onClick={() => handleComplete(task.id)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-[6px] border border-bone text-steel hover:text-green-text hover:border-green-mark transition-colors text-[11px]"
                      title="Marcar como hecho sin enviar"
                    >
                      <Check className="h-3 w-3" strokeWidth={1.5} />
                      Hecho
                    </button>
                    <button
                      onClick={() => handleSkip(task.id)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-[6px] border border-bone text-steel hover:text-signal-deep hover:border-signal/30 transition-colors text-[11px]"
                      title="Ignorar esta tarea"
                    >
                      <X className="h-3 w-3" strokeWidth={1.5} />
                      Ignorar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <ScheduleVisitModal
        open={activeModal?.type === 'schedule_visit'}
        onClose={() => setActiveModal(null)}
        leadId={activeModal?.props.leadId as string ?? firstLeadId}
        propertyId={activeModal?.props.propertyId as string}
      />
      <OfferFormModal
        open={activeModal?.type === 'offer_form'}
        onClose={() => setActiveModal(null)}
        leadId={activeModal?.props.leadId as string ?? firstLeadId}
        propertyId={activeModal?.props.propertyId as string}
      />
      <RequestDocModal
        open={activeModal?.type === 'request_doc'}
        onClose={() => setActiveModal(null)}
        leadId={activeModal?.props.leadId as string ?? firstLeadId}
        docCodes={activeModal?.props.docCodes as string[]}
        target={activeModal?.props.target as string}
        phone={phone}
        clientName={leadName.split(' ')[0]}
      />
      <FinancingSimModal
        open={activeModal?.type === 'financing_sim'}
        onClose={() => setActiveModal(null)}
        propertyPrice={propertyPrice}
        phone={phone}
        clientName={leadName.split(' ')[0]}
      />
    </>
  )
}

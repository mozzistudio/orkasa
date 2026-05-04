'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Phone,
  Calendar,
  FileText,
  DollarSign,
  Calculator,
  Shield,
  ArrowRight,
  Check,
  X,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { completeTask, skipTask } from '@/app/[locale]/app/leads/actions'
import {
  executeCtaAction,
  getCtaIcon,
  getCtaLabel,
  isCtaActionable,
  getCtaUnavailableReason,
  resolveCtaPhone,
  resolveTaskRecipient,
} from '@/lib/tasks/cta-handlers'
import type { CtaCallbacks } from '@/lib/tasks/cta-handlers'
import type { CtaAction } from '@/lib/tasks/types'
import type { DashboardTodo } from '@/lib/queries/dashboard'
import { PostVisitDecisionButtons } from '@/components/tasks/post-visit-decision-buttons'

function CtaIcon({ icon }: { icon: string }) {
  const props = { className: 'h-3 w-3', strokeWidth: 1.5 } as const
  switch (icon) {
    case 'whatsapp':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
        </svg>
      )
    case 'phone':
      return <Phone {...props} />
    case 'calendar':
      return <Calendar {...props} />
    case 'file':
      return <FileText {...props} />
    case 'dollar':
      return <DollarSign {...props} />
    case 'calculator':
      return <Calculator {...props} />
    case 'shield':
      return <Shield {...props} />
    case 'check':
      return <Check {...props} />
    case 'arrow':
      return <ArrowRight {...props} />
    default:
      return null
  }
}

function urgency(due: string | null, status: string) {
  if (status === 'escalated') return { label: 'ESCALADA', style: 'bg-signal-bg text-signal-deep' }
  if (!due) return { label: '—', style: 'bg-bone-soft text-steel' }
  const days = Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return { label: 'ATRASADA', style: 'bg-signal-bg text-signal-deep' }
  if (days === 0) return { label: 'HOY', style: 'bg-amber-bg text-amber-text' }
  if (days === 1) return { label: 'MAÑANA', style: 'bg-amber-bg text-amber-text' }
  if (days <= 3) return { label: `${days}d`, style: 'bg-amber-bg text-amber-text' }
  return { label: `${days}d`, style: 'bg-bone-soft text-steel' }
}

export function TodoListPanel({
  todos,
  totalOpenCount,
}: {
  todos: DashboardTodo[]
  totalOpenCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const callbacks: CtaCallbacks = {
    navigate: (path) => router.push(path),
    onComplete: (taskId) => {
      startTransition(async () => {
        await completeTask(taskId)
        router.refresh()
      })
    },
  }

  function handleCta(task: DashboardTodo) {
    const meta = {
      ...task.cta_metadata,
      taskId: task.id,
      leadId: task.lead_id,
      propertyId: task.property_id,
      dealId: task.deal_id,
      clientName: task.lead_name.split(' ')[0],
      leadFullName: task.lead_name,
      phone: resolveCtaPhone(task.cta_metadata, task.lead_phone),
    }
    executeCtaAction(task.cta_action as CtaAction, meta, callbacks)
  }

  function handleComplete(taskId: string) {
    startTransition(async () => {
      await completeTask(taskId)
      router.refresh()
    })
  }

  function handleSkip(taskId: string) {
    startTransition(async () => {
      await skipTask(taskId)
      router.refresh()
    })
  }

  if (todos.length === 0) {
    return (
      <section className="rounded-[10px] border border-bone bg-paper">
        <div className="border-b border-bone px-[18px] py-[14px]">
          <div className="flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-green-bg text-green-text">
              <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
            </span>
            Mi to-do list
          </div>
        </div>
        <div className="px-[18px] py-6 text-center text-[13px] text-steel">
          Sin tareas pendientes. ¡Todo al día!
        </div>
      </section>
    )
  }

  return (
    <section
      className={`overflow-hidden rounded-[10px] border border-bone bg-paper ${pending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] py-[14px]">
        <div className="min-w-0">
          <div className="mb-[3px] flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-green-bg text-green-text">
              <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
            </span>
            Mi to-do list
          </div>
          <div className="text-[11px] text-steel">
            {totalOpenCount === 1
              ? '1 tarea pendiente'
              : `${totalOpenCount} tareas pendientes`}
          </div>
        </div>
        <Link
          href="/app/tasks"
          className="flex-shrink-0 whitespace-nowrap text-[11px] text-steel hover:text-ink"
        >
          Ver todas →
        </Link>
      </div>

      <ul className="divide-y divide-bone-soft">
        {todos.map((task) => {
          const u = urgency(task.due_at, task.status)
          const icon = getCtaIcon(task.cta_action as CtaAction)
          const label = getCtaLabel(
            task.cta_action as CtaAction,
            task.cta_metadata,
          )
          const actionable = isCtaActionable(
            task.cta_action as CtaAction,
            task.cta_metadata,
            task.lead_phone,
          )
          const unavailableReason = actionable
            ? ''
            : getCtaUnavailableReason(
                task.cta_action as CtaAction,
                task.cta_metadata,
              )
          const recipient = resolveTaskRecipient(
            task.cta_metadata,
            task.lead_name,
          )
          return (
            <li key={task.id} className="px-[18px] py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink leading-snug line-clamp-2">
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {recipient.isLead ? (
                      <Link
                        href={`/app/leads/${task.lead_id}`}
                        className="font-mono text-[10px] text-steel hover:text-ink transition-colors"
                      >
                        {recipient.name}
                      </Link>
                    ) : (
                      <span className="font-mono text-[10px] text-steel">
                        <span className="text-ink">{recipient.role}:</span>{' '}
                        {recipient.name}
                      </span>
                    )}
                    {task.property_title && (
                      <>
                        <span className="text-bone">·</span>
                        <span className="font-mono text-[10px] text-steel truncate max-w-[120px]">
                          {task.property_title}
                        </span>
                      </>
                    )}
                    <span
                      className={`font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium ${u.style}`}
                    >
                      {u.label}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {task.cta_action === 'post_visit_decision' ? (
                    <>
                      <PostVisitDecisionButtons taskId={task.id} size="sm" />
                      <button
                        type="button"
                        onClick={() => handleSkip(task.id)}
                        title="Ignorar"
                        className="p-1.5 rounded-[6px] border border-bone text-steel hover:text-signal-deep hover:border-signal/30 transition-colors"
                      >
                        <X className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCta(task)}
                        disabled={!actionable}
                        title={unavailableReason || undefined}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[11px] font-medium transition-colors ${
                          actionable
                            ? 'bg-ink text-white hover:bg-coal'
                            : 'bg-bone-soft text-steel cursor-not-allowed'
                        }`}
                      >
                        <CtaIcon icon={icon} />
                        {label}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleComplete(task.id)}
                        title="Marcar como hecho"
                        className="p-1.5 rounded-[6px] border border-bone text-steel hover:text-green-text hover:border-green-mark transition-colors"
                      >
                        <Check className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSkip(task.id)}
                        title="Ignorar"
                        className="p-1.5 rounded-[6px] border border-bone text-steel hover:text-signal-deep hover:border-signal/30 transition-colors"
                      >
                        <X className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import {
  Bell,
  CheckCheck,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  ListChecks,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { markNotificationRead, markAllNotificationsRead } from './actions'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  lead_new: User,
  lead_assigned: User,
  lead_status_changed: User,
  offer_received: DollarSign,
  offer_accepted: DollarSign,
  offer_rejected: DollarSign,
  offer_countered: DollarSign,
  viewing_scheduled: Calendar,
  viewing_reminder: Calendar,
  deal_created: TrendingUp,
  deal_stage_changed: TrendingUp,
  deal_won: TrendingUp,
  deal_lost: TrendingUp,
  task_created: ListChecks,
  task_escalated: AlertTriangle,
  task_due_soon: AlertTriangle,
  doc_uploaded: FileText,
}

function getTargetHref(n: NotificationRow): string | null {
  const leadId = (n.metadata as { leadId?: string })?.leadId
  if (n.entity_type === 'lead' && n.entity_id) return `/app/leads/${n.entity_id}`
  if (n.entity_type === 'task' && leadId) return `/app/leads/${leadId}`
  if (n.entity_type === 'offer') return `/app/offers`
  if (n.entity_type === 'viewing') return `/app/viewings`
  if (n.entity_type === 'deal') return `/app/deals`
  if (n.entity_type === 'property' && n.entity_id)
    return `/app/properties/${n.entity_id}`
  if (leadId) return `/app/leads/${leadId}`
  return null
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('es-PA', {
    day: 'numeric',
    month: 'short',
  })
}

export function InboxList({
  unread,
  read,
}: {
  unread: NotificationRow[]
  read: NotificationRow[]
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {unread.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-signal font-medium">
                No leídas
              </span>
              <span className="font-mono text-[10px] tabular-nums text-signal">
                {unread.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={pending}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1px] text-steel hover:text-ink transition-colors disabled:opacity-50"
            >
              <CheckCheck className="h-3 w-3" strokeWidth={1.5} />
              Marcar todo leído
            </button>
          </div>
          <div className="overflow-hidden rounded-[4px] border border-signal/20 bg-signal-bg/20">
            {unread.map((n, idx) => (
              <NotificationItem
                key={n.id}
                notification={n}
                isLast={idx === unread.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel font-medium">
              Leídas
            </span>
            <span className="font-mono text-[10px] tabular-nums text-steel">
              {read.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-[4px] border border-bone bg-paper">
            {read.map((n, idx) => (
              <NotificationItem
                key={n.id}
                notification={n}
                isLast={idx === read.length - 1}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function NotificationItem({
  notification,
  isLast,
}: {
  notification: NotificationRow
  isLast: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const Icon = TYPE_ICONS[notification.type] ?? Bell
  const href = getTargetHref(notification)

  const handleClick = () => {
    if (!notification.is_read) {
      startTransition(async () => {
        await markNotificationRead(notification.id)
        if (href) router.push(href)
        else router.refresh()
      })
      return
    }
    if (href) router.push(href)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-bone/30 ${
        !isLast ? 'border-b border-bone' : ''
      } ${pending ? 'opacity-50' : ''}`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] ${
          !notification.is_read
            ? 'bg-signal/10 text-signal'
            : 'bg-bone/40 text-steel'
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-[13px] leading-tight ${
              !notification.is_read ? 'font-medium text-ink' : 'text-steel'
            }`}
          >
            {notification.title}
          </p>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-steel">
            {formatRelative(notification.created_at)}
          </span>
        </div>
        {notification.body && (
          <p className="mt-0.5 text-[12px] text-steel">{notification.body}</p>
        )}
      </div>
      {!notification.is_read && (
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
      )}
    </div>
  )
}

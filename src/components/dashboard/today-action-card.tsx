'use client'

import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildReminderUrl, reactivateColdLead } from '@/lib/whatsapp-templates'
import { useRouter } from '@/i18n/navigation'
import type { TodayAction } from '@/lib/queries/dashboard'

export function TodayActionCard({ action }: { action: TodayAction }) {
  const router = useRouter()

  function handleWhatsApp() {
    if (!action.phone || !action.clientName) return
    const message = reactivateColdLead(
      action.clientName,
      action.propertyTitle ?? 'tu propiedad',
      7,
    )
    window.open(buildReminderUrl(action.phone, message), '_blank')
  }

  function handleOpenLead() {
    if (action.leadId) {
      router.push(`/app/leads/${action.leadId}`)
    }
  }

  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border p-4 transition-all hover:-translate-y-px',
        action.variant === 'urgent' &&
          'border-signal-soft bg-signal-bg hover:bg-signal-soft',
        action.variant === 'opportunity' &&
          'border-green-mark/20 bg-green-bg',
        action.variant === 'neutral' &&
          'border-bone bg-paper hover:border-steel-soft',
      )}
    >
      {/* Tag */}
      <div
        className={cn(
          'mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[1.2px]',
          action.variant === 'urgent' && 'text-signal-deep',
          action.variant === 'opportunity' && 'text-green-text',
          action.variant === 'neutral' && 'text-steel',
        )}
      >
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            action.variant === 'urgent' && 'bg-signal',
            action.variant === 'opportunity' && 'bg-green-mark',
            action.variant === 'neutral' && 'bg-steel-soft',
          )}
        />
        {action.tag}
      </div>

      {/* Title */}
      <div className="mb-1.5 text-[14px] font-medium leading-snug text-ink">
        {action.title}
      </div>

      {/* Context */}
      <div className="mb-3 text-[12px] leading-[1.45] text-steel">
        {action.context}
      </div>

      {/* Bottom: amount + actions */}
      <div className="flex items-center justify-between gap-2.5">
        <div
          className={cn(
            'font-mono text-[13px] font-medium',
            action.variant === 'urgent' && 'text-signal-deep',
            action.variant === 'opportunity' && 'text-green-text',
            action.variant === 'neutral' && 'text-ink',
          )}
        >
          {action.amount}
        </div>
        <div className="flex gap-1.5">
          {action.phone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1 rounded-[5px] border border-whatsapp bg-whatsapp px-[11px] py-1.5 text-[12px] font-medium text-white hover:border-whatsapp-deep hover:bg-whatsapp-deep"
            >
              <MessageCircle className="h-3 w-3" />
              {action.variant === 'urgent' ? 'Reactivar' : ''}
            </button>
          )}
          {action.leadId && action.variant !== 'urgent' && (
            <button
              type="button"
              onClick={handleOpenLead}
              className="inline-flex items-center gap-1 rounded-[5px] border border-ink bg-ink px-[11px] py-1.5 text-[12px] font-medium text-white hover:bg-coal"
            >
              Abrir lead →
            </button>
          )}
          {action.variant === 'opportunity' && (
            <button
              type="button"
              onClick={() => router.push('/app/leads?status=new&assigned=none')}
              className="inline-flex items-center gap-1 rounded-[5px] border border-signal bg-signal px-[11px] py-1.5 text-[12px] font-medium text-white hover:bg-signal-deep"
            >
              Asignar →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

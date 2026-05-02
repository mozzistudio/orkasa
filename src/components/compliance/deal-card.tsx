import Link from 'next/link'
import { Eye, Phone, Pen, Users } from 'lucide-react'
import { cn, formatPriceCompact } from '@/lib/utils'
import { WhatsAppReminderButton } from './whatsapp-reminder-button'
import { ApproveButton } from './approve-button'
import type { DealCardData, DealSeverity } from './types'

const BORDER_CLASS: Record<DealSeverity, string> = {
  blocked: 'border-l-[3px] border-l-signal rounded-r-[8px] rounded-l-none',
  waiting: 'border-l-[3px] border-l-[#BA7517] rounded-r-[8px] rounded-l-none',
  ready: 'border-l-[3px] border-l-[#2E7D52] rounded-r-[8px] rounded-l-none',
}

const STATUS_BG: Record<DealSeverity, string> = {
  blocked: 'bg-signal-soft text-signal',
  waiting: 'bg-[#FBF1DF] text-[#6B4419]',
  ready: 'bg-[#E5F2EA] text-[#1F5236]',
}

const PROGRESS_CLASS: Record<string, string> = {
  done: 'bg-[#2E7D52]',
  warn: 'bg-[#BA7517]',
  fail: 'bg-signal',
  empty: 'bg-bone',
}

export function DealCard({ deal }: { deal: DealCardData }) {
  const hasChecklist = deal.progress.length > 0 && deal.progress.length <= 3
  const showProgress = !hasChecklist

  return (
    <div
      className={cn(
        'flex flex-col border border-bone bg-paper p-[14px] transition-all hover:-translate-y-px hover:border-steel',
        BORDER_CLASS[deal.severity],
      )}
    >
      {/* Top: client + price */}
      <div className="mb-2.5 flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug text-ink">
            {deal.leadName}
          </p>
          <p className="text-[11px] leading-snug text-steel">
            {deal.propertyTitle}
          </p>
        </div>
        {deal.propertyPrice != null && (
          <div className="flex-shrink-0 text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.8px] text-steel">
              {deal.listingType === 'rent' ? 'Mensual' : 'Venta'}
            </p>
            <p className="font-mono text-[13px] font-medium text-ink">
              {deal.listingType === 'rent'
                ? `$${deal.propertyPrice.toLocaleString('en-US')}`
                : formatPriceCompact(deal.propertyPrice)}
            </p>
          </div>
        )}
      </div>

      {/* Status box */}
      <div
        className={cn(
          'mb-2.5 rounded-[5px] px-2.5 py-2 text-[12px] leading-snug',
          STATUS_BG[deal.severity],
        )}
      >
        <p className="mb-0.5 font-medium">{deal.statusLabel}</p>
        <p>{deal.statusDescription}</p>
      </div>

      {/* Progress bar OR checklist */}
      {showProgress && (
        <div className="mb-2.5 flex h-1 gap-[3px]">
          {Array.from({ length: deal.progressTotal }).map((_, i) => {
            let cls = PROGRESS_CLASS.empty
            if (i < deal.progressDone) cls = PROGRESS_CLASS.done
            else if (i === deal.progressDone && deal.severity === 'waiting')
              cls = PROGRESS_CLASS.warn
            else if (i === deal.progressDone && deal.severity === 'blocked')
              cls = PROGRESS_CLASS.fail
            return (
              <span
                key={i}
                className={cn('flex-1 rounded-[2px]', cls)}
              />
            )
          })}
        </div>
      )}

      {hasChecklist && (
        <div className="mb-2.5 flex flex-col gap-[5px]">
          {deal.progress.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-[7px] text-[11px]',
                item.status === 'done' && 'text-[#1F5236]',
                item.status === 'todo' && 'font-medium text-ink',
                item.status === 'fail' && 'font-medium text-signal',
              )}
            >
              <span
                className={cn(
                  'flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-full text-white',
                  item.status === 'done' && 'bg-[#2E7D52]',
                  item.status === 'fail' && 'bg-signal',
                  item.status === 'todo' && 'border-[1.5px] border-dashed border-steel bg-bone',
                )}
              >
                {item.status === 'done' && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4l2 2 4-4.5" />
                  </svg>
                )}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-bone pt-2.5">
        <span
          className={cn(
            'font-mono text-[10px] text-steel',
            deal.timingUrgent && 'font-medium text-signal',
          )}
        >
          {deal.timingLabel}
        </span>
        <div className="flex gap-1">
          {deal.severity === 'ready' && (
            <ApproveButton leadId={deal.leadId} variant="mini" />
          )}
          {deal.phone && deal.severity !== 'ready' && (
            <WhatsAppReminderButton
              phone={deal.phone}
              clientName={deal.leadName}
              propertyTitle={deal.propertyTitle}
              documentType={deal.pendingDocType}
              leadId={deal.leadId}
              variant="mini"
            />
          )}
          <Link
            href={`/app/compliance/${deal.checkIds[0]}`}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-bone bg-paper text-steel hover:border-steel hover:bg-white hover:text-ink"
            title="Ver detalle"
          >
            <Eye className="h-[13px] w-[13px]" />
          </Link>
        </div>
      </div>
    </div>
  )
}

import { MessageCircle, Clock } from 'lucide-react'
import { formatPriceCompact } from '@/lib/utils'
import { ComplianceStatusBadge } from './compliance-status-badge'
import { WhatsAppReminderButton } from './whatsapp-reminder-button'
import { PostponeButton } from './postpone-button'
import type { AwaitingClientItem } from './types'

export function AwaitingClientPanel({
  items,
  emptyMessage,
}: {
  items: AwaitingClientItem[]
  emptyMessage: string
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-[10px] border border-bone bg-paper">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] pb-3 pt-[14px]">
        <div className="min-w-0">
          <div className="mb-0.5 flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-[#25D366] text-white">
              <MessageCircle className="h-3 w-3" />
            </span>
            Esperando del cliente
          </div>
          <p className="text-[11px] text-steel">
            {items.length} documentos pendientes — mandales un recordatorio
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="hidden flex-shrink-0 items-center gap-[5px] whitespace-nowrap rounded-[5px] border border-bone bg-paper px-[11px] py-1.5 font-sans text-[11px] font-medium text-ink hover:border-steel hover:bg-white md:inline-flex"
          >
            <MessageCircle className="h-[11px] w-[11px]" />
            Recordar a todos
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col">
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-10">
            <p className="text-[12px] text-steel">{emptyMessage}</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.leadId}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-3 last:border-b-0 hover:bg-[#F5F4EE]"
            >
              <div className="min-w-0">
                <p className="mb-0.5 text-[13px] leading-snug text-ink">
                  <strong className="font-medium">{item.leadName}</strong>
                  {' — '}
                  {item.pendingDocNames.join(', ')}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-steel">
                  <span className="inline-flex items-center gap-1 rounded-[3px] border border-bone bg-[#F5F4EE] px-1.5 py-px font-mono text-[10px] text-ink">
                    {item.propertyTitle}
                    {item.propertyPrice != null && (
                      <>
                        {' · '}
                        {item.listingType === 'rent'
                          ? `${formatPriceCompact(item.propertyPrice)}/mes`
                          : formatPriceCompact(item.propertyPrice)}
                      </>
                    )}
                  </span>
                  <span className="h-[3px] w-[3px] rounded-full bg-steel" />
                  <ComplianceStatusBadge variant={item.timingVariant}>
                    {item.timingLabel}
                  </ComplianceStatusBadge>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {item.phone && (
                  <WhatsAppReminderButton
                    phone={item.phone}
                    clientName={item.leadName}
                    propertyTitle={item.propertyTitle}
                    documentType={item.pendingDocType}
                    leadId={item.leadId}
                    label={items.indexOf(item) === 0 ? 'Enviar' : 'Recordar'}
                  />
                )}
                <PostponeButton leadId={item.leadId} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

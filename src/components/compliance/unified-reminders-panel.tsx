import Link from 'next/link'
import { MessageCircle, Check, ArrowRight } from 'lucide-react'
import { formatPriceCompact } from '@/lib/utils'
import { ComplianceStatusBadge } from './compliance-status-badge'
import { WhatsAppReminderButton } from './whatsapp-reminder-button'
import { PostponeButton } from './postpone-button'
import { ApproveButton } from './approve-button'
import type { AwaitingClientItem, AwaitingBrokerItem } from './types'

type Props = {
  clientItems: AwaitingClientItem[]
  brokerItems: AwaitingBrokerItem[]
}

export function UnifiedRemindersPanel({ clientItems, brokerItems }: Props) {
  const totalCount = clientItems.length + brokerItems.length

  return (
    <section className="mb-8 flex flex-col overflow-hidden rounded-[10px] border border-bone bg-paper">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] pb-3 pt-[14px]">
        <div className="min-w-0">
          <div className="mb-0.5 text-[14px] font-medium text-ink">
            Por hacer
          </div>
          <p className="text-[11px] text-steel">
            {totalCount === 0
              ? 'Sin pendientes — todo bajo control'
              : `${totalCount} ${totalCount === 1 ? 'pendiente' : 'pendientes'} · ${clientItems.length} del cliente · ${brokerItems.length} tuyas`}
          </p>
        </div>
      </div>

      {/* Body */}
      {totalCount === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <p className="text-[12px] text-steel">
            Ningún recordatorio pendiente — sos un crack
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Client items */}
          {clientItems.map((item) => (
            <div
              key={`client-${item.leadId}`}
              className="grid grid-cols-[22px_1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-3 last:border-b-0 hover:bg-paper-warm"
            >
              <span
                className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-[#25D366] text-white"
                title="Esperando del cliente"
              >
                <MessageCircle className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <p className="mb-0.5 text-[13px] leading-snug text-ink">
                  <strong className="font-medium">{item.leadName}</strong>
                  {' — '}
                  {item.pendingDocNames.join(', ')}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-steel">
                  <span className="inline-flex items-center gap-1 rounded-[3px] border border-bone bg-paper-warm px-1.5 py-px font-mono text-[10px] text-ink">
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
                    label={
                      item.pendingDocNames.length > 1
                        ? 'Recordar todo'
                        : 'Recordar'
                    }
                  />
                )}
                <PostponeButton leadId={item.leadId} />
              </div>
            </div>
          ))}

          {/* Broker items */}
          {brokerItems.map((item) => (
            <div
              key={`broker-${item.checkId}`}
              className="grid grid-cols-[22px_1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-3 last:border-b-0 hover:bg-paper-warm"
            >
              <span
                className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-ink text-white"
                title="Tu turno"
              >
                <Check className="h-3 w-3" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <p className="mb-0.5 text-[13px] leading-snug text-ink">
                  {item.actionType === 'review' ? (
                    <>
                      Revisar dossier de{' '}
                      <strong className="font-medium">{item.leadName}</strong>
                    </>
                  ) : (
                    <>
                      Aprobar y cerrar a{' '}
                      <strong className="font-medium">{item.leadName}</strong>
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-steel">
                  <span className="inline-flex items-center gap-1 rounded-[3px] border border-bone bg-paper-warm px-1.5 py-px font-mono text-[10px] text-ink">
                    {item.propertyTitle}
                  </span>
                  <span className="h-[3px] w-[3px] rounded-full bg-steel" />
                  <ComplianceStatusBadge variant={item.timingVariant}>
                    {item.timingLabel}
                  </ComplianceStatusBadge>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {item.actionType === 'review' ? (
                  <Link
                    href={`/app/compliance/${item.checkId}`}
                    className="inline-flex items-center gap-1.5 rounded-[5px] border border-ink bg-ink px-[11px] py-1.5 font-sans text-[12px] font-medium text-white hover:bg-coal"
                  >
                    Abrir
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <ApproveButton leadId={item.leadId} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

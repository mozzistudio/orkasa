import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { ComplianceStatusBadge } from './compliance-status-badge'
import { ApproveButton } from './approve-button'
import type { AwaitingBrokerItem } from './types'

export function AwaitingBrokerPanel({
  items,
  emptyMessage,
}: {
  items: AwaitingBrokerItem[]
  emptyMessage: string
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-[10px] border border-bone bg-paper">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] pb-3 pt-[14px]">
        <div className="min-w-0">
          <div className="mb-0.5 flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-ink text-white">
              <Check className="h-3 w-3" strokeWidth={1.6} />
            </span>
            Tu turno
          </div>
          <p className="text-[11px] text-steel">
            {items.length} acciones tuyas — revisar o aprobar
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="hidden flex-shrink-0 items-center gap-[5px] whitespace-nowrap rounded-[5px] border border-bone bg-paper px-[11px] py-1.5 font-sans text-[11px] font-medium text-ink hover:border-steel hover:bg-white md:inline-flex"
          >
            <ArrowRight className="h-[11px] w-[11px]" />
            Hacer todo
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
              key={item.checkId}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-3 last:border-b-0 hover:bg-[#F5F4EE]"
            >
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
                  <span className="inline-flex items-center gap-1 rounded-[3px] border border-bone bg-[#F5F4EE] px-1.5 py-px font-mono text-[10px] text-ink">
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
          ))
        )}
      </div>
    </section>
  )
}

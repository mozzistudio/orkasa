'use client'

import { useState } from 'react'
import { MessageCircle, Upload, AlertOctagon } from 'lucide-react'
import {
  buildReminderUrl,
  askPepRelationship,
  askUbo,
  askGenericDocument,
} from '@/lib/whatsapp-templates'
import { logWhatsAppReminder } from '@/app/[locale]/app/compliance/actions'
import { PepQuestionModal } from './pep-question-modal'

export type TodoItem = {
  id: string
  variant: 'missing-doc' | 'question' | 'block'
  flagType?: 'pep' | 'high_amount' | 'ubo'
  title: string
  meta?: { askedAt?: string; daysSilent?: number }
  explainer: string
  /** For missing-doc → the doc name to use in the WhatsApp template */
  docName?: string
  leadId?: string
}

export function TodoRow({
  item,
  clientName,
  clientPhone,
  propertyTitle,
  checkId,
}: {
  item: TodoItem
  clientName: string
  clientPhone: string | null
  propertyTitle: string
  checkId: string
}) {
  const [pepModalOpen, setPepModalOpen] = useState(false)

  function buildMessage(): string {
    if (item.variant === 'question' && item.flagType === 'pep') {
      return askPepRelationship(clientName)
    }
    if (item.variant === 'question' && item.flagType === 'ubo') {
      return askUbo(clientName, propertyTitle)
    }
    if (item.variant === 'missing-doc' && item.docName) {
      return askGenericDocument(clientName, item.docName, propertyTitle)
    }
    return ''
  }

  function handleWhatsApp() {
    if (!clientPhone) return
    const message = buildMessage()
    if (!message) return
    window.open(buildReminderUrl(clientPhone, message), '_blank')
    if (item.leadId) {
      logWhatsAppReminder(item.leadId, item.id)
    }
  }

  return (
    <div className="flex flex-col gap-3 border-b border-signal-deep/10 px-5 py-3.5 last:border-b-0 transition-colors hover:bg-paper/40 md:grid md:grid-cols-[22px_1fr_auto] md:items-start md:gap-3.5">
      {/* Icon (top on desktop, hidden on mobile in favor of inline) */}
      <div className="hidden md:block mt-0.5 flex-shrink-0">
        {item.variant === 'missing-doc' && (
          <div className="h-5 w-5 rounded-full border-[1.5px] border-dashed border-signal bg-paper" />
        )}
        {item.variant === 'question' && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-mark text-white">
            <span className="text-[11px] font-medium leading-none">?</span>
          </div>
        )}
        {item.variant === 'block' && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-signal text-white">
            <AlertOctagon className="h-3 w-3" strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex items-start gap-2 md:block">
          {/* Mobile inline icon */}
          <div className="mt-0.5 flex-shrink-0 md:hidden">
            {item.variant === 'missing-doc' && (
              <div className="h-4 w-4 rounded-full border-[1.5px] border-dashed border-signal bg-paper" />
            )}
            {item.variant === 'question' && (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-mark text-white">
                <span className="text-[10px] font-medium leading-none">?</span>
              </div>
            )}
            {item.variant === 'block' && (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-signal text-white">
                <AlertOctagon className="h-2.5 w-2.5" strokeWidth={2} />
              </div>
            )}
          </div>
          <div className="text-[13.5px] font-medium leading-snug text-ink">
            {item.title}
          </div>
        </div>
        <div className="mt-1 text-[12px] leading-relaxed text-steel">
          {item.meta?.askedAt && (
            <>
              <span className="text-ink">{item.meta.askedAt}</span>
              {item.meta.daysSilent !== undefined && item.meta.daysSilent > 0 && (
                <>
                  <span className="mx-1.5 text-steel-soft">·</span>
                  <span className="font-medium text-signal-deep">
                    Hace {item.meta.daysSilent} {item.meta.daysSilent === 1 ? 'día' : 'días'} sin respuesta
                  </span>
                </>
              )}
              <span> — </span>
            </>
          )}
          {item.explainer}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 flex-wrap items-start gap-1 md:mt-0.5 md:flex-nowrap">
        {item.variant === 'missing-doc' && (
          <>
            {clientPhone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 rounded-[5px] border border-whatsapp bg-whatsapp px-3 py-1.5 text-[12px] font-medium text-white hover:border-whatsapp-deep hover:bg-whatsapp-deep"
              >
                <MessageCircle className="h-3 w-3" />
                Mandar recordatorio
              </button>
            )}
            <button
              type="button"
              title="Subir manualmente"
              className="inline-flex items-center justify-center rounded-[5px] bg-transparent px-2 py-1.5 text-steel hover:bg-bone-soft hover:text-ink"
            >
              <Upload className="h-3 w-3" />
            </button>
          </>
        )}

        {item.variant === 'question' && (
          <>
            {clientPhone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 rounded-[5px] border border-whatsapp bg-whatsapp px-3 py-1.5 text-[12px] font-medium text-white hover:border-whatsapp-deep hover:bg-whatsapp-deep"
              >
                <MessageCircle className="h-3 w-3" />
                Preguntarle
              </button>
            )}
            <button
              type="button"
              onClick={() => setPepModalOpen(true)}
              className="inline-flex items-center rounded-[5px] bg-amber-mark px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
            >
              Ya lo sé · marcar
            </button>
          </>
        )}

        {item.variant === 'block' && (
          <>
            <button
              type="button"
              className="inline-flex items-center rounded-[5px] bg-signal px-3 py-1.5 text-[12px] font-medium text-white hover:bg-signal-deep"
            >
              Escalar
            </button>
          </>
        )}
      </div>

      {pepModalOpen && item.flagType && (
        <PepQuestionModal
          checkId={checkId}
          flagType={item.flagType}
          clientName={clientName}
          onClose={() => setPepModalOpen(false)}
        />
      )}
    </div>
  )
}

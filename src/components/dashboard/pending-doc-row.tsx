'use client'

import { MessageCircle, FileText } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { buildReminderUrl, askMultipleDocuments } from '@/lib/whatsapp-templates'
import type { PendingReminder } from '@/lib/queries/dashboard'

export function PendingDocRow({ reminder }: { reminder: PendingReminder }) {
  const router = useRouter()

  function handleOpen() {
    router.push(
      reminder.checkId
        ? `/app/compliance/${reminder.checkId}`
        : '/app/compliance',
    )
  }

  function handleWhatsApp(e: React.MouseEvent) {
    e.stopPropagation()
    if (!reminder.leadPhone) return
    const message = askMultipleDocuments(
      reminder.leadName,
      reminder.docNames,
      reminder.propertyTitle ?? 'la propiedad',
    )
    window.open(buildReminderUrl(reminder.leadPhone, message), '_blank')
  }

  const overdue = reminder.oldestDays >= 3

  return (
    <div
      onClick={handleOpen}
      className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-[13px] cursor-pointer transition-colors last:border-b-0 hover:bg-paper-warm"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-amber-50 text-amber-text">
        <FileText className="h-[13px] w-[13px]" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <div className="mb-[2px] truncate text-[13px] font-medium text-ink">
          {reminder.leadName}
        </div>
        <div className="truncate text-[11px] text-steel">
          {reminder.docCount} {reminder.docCount === 1 ? 'documento' : 'documentos'}
          {' · '}
          <span className={overdue ? 'text-signal-deep' : 'text-steel'}>
            {reminder.oldestDays === 0
              ? 'pedido hoy'
              : reminder.oldestDays === 1
                ? '1 día sin respuesta'
                : `${reminder.oldestDays} días sin respuesta`}
          </span>
        </div>
      </div>
      {reminder.leadPhone && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-[5px] border border-whatsapp bg-whatsapp px-[11px] py-1.5 text-[12px] font-medium text-white hover:border-whatsapp-deep hover:bg-whatsapp-deep"
        >
          <MessageCircle className="h-3 w-3" />
          Recordar
        </button>
      )}
    </div>
  )
}

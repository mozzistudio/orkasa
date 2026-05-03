'use client'

import { MessageIcon } from '@/components/icons/icons'
import { useRouter } from '@/i18n/navigation'
import { buildReminderUrl, askMultipleDocuments } from '@/lib/whatsapp-templates'
import type { PendingReminder } from '@/lib/queries/dashboard'

export function CurrentDealRow({ reminder }: { reminder: PendingReminder }) {
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
  const multipleDocs = reminder.docCount > 1
  const buttonLabel = multipleDocs ? 'Recordar todo' : 'Recordar'

  return (
    <div
      onClick={handleOpen}
      className="group grid grid-cols-[1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-[13px] cursor-pointer transition-colors last:border-b-0 hover:bg-paper-warm"
    >
      <div className="min-w-0">
        <div className="mb-[2px] flex items-center gap-2 truncate text-[13px] font-medium text-ink">
          <span className="truncate">{reminder.leadName}</span>
          {reminder.propertyTitle && (
            <>
              <span className="text-steel-soft">·</span>
              <span className="truncate font-normal text-steel">
                {reminder.propertyTitle}
              </span>
            </>
          )}
        </div>
        {/* Default subtitle: count + days. On hover: doc names list. */}
        <div className="truncate text-[11px] text-steel">
          <span className="group-hover:hidden">
            {reminder.docCount}{' '}
            {reminder.docCount === 1 ? 'documento' : 'documentos'}
            {' · '}
            <span className={overdue ? 'text-signal-deep' : 'text-steel'}>
              {reminder.oldestDays === 0
                ? 'pedido hoy'
                : reminder.oldestDays === 1
                  ? '1 día sin respuesta'
                  : `${reminder.oldestDays} días sin respuesta`}
            </span>
          </span>
          <span className="hidden group-hover:inline">
            <span className="text-ink">Falta:</span>{' '}
            {reminder.docNames.join(', ')}
          </span>
        </div>
      </div>
      {reminder.leadPhone && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-[5px] border border-whatsapp bg-whatsapp px-[11px] py-1.5 text-[12px] font-medium text-white hover:border-whatsapp-deep hover:bg-whatsapp-deep"
        >
          <MessageIcon size={12} />
          {buttonLabel}
        </button>
      )}
    </div>
  )
}

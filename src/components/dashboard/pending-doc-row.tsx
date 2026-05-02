'use client'

import { MessageCircle, FileText, PenLine, Shield } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import {
  buildReminderUrl,
  askGenericDocument,
  reminderCedula,
  reminderIncomeProof,
  reminderFundsOrigin,
  askPepRelationship,
  askUbo,
} from '@/lib/whatsapp-templates'
import type { PendingReminder } from '@/lib/queries/dashboard'

const KIND_CONFIG = {
  document: { Icon: FileText, bg: 'bg-amber-50', text: 'text-amber-text' },
  signature: { Icon: PenLine, bg: 'bg-signal-bg', text: 'text-signal-deep' },
  compliance: { Icon: Shield, bg: 'bg-bone-soft', text: 'text-ink' },
} as const

function buildMessage(r: PendingReminder): string {
  const name = r.leadName ?? 'cliente'
  const property = r.propertyTitle ?? 'la propiedad'
  switch (r.docKind) {
    case 'identity':
      return reminderCedula(name, property)
    case 'income_proof':
      return reminderIncomeProof(name, property)
    case 'funds_origin':
      return reminderFundsOrigin(name, property)
    case 'pep':
      return askPepRelationship(name)
    case 'aml':
    case 'sanctions':
      return askUbo(name, property)
    default:
      return askGenericDocument(name, r.label, property)
  }
}

export function PendingDocRow({
  reminder,
  corporateLabel,
}: {
  reminder: PendingReminder
  corporateLabel: string
}) {
  const router = useRouter()
  const config = KIND_CONFIG[reminder.kind]
  const Icon = config.Icon

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
    window.open(buildReminderUrl(reminder.leadPhone, buildMessage(reminder)), '_blank')
  }

  return (
    <div
      onClick={handleOpen}
      className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-[13px] cursor-pointer transition-colors last:border-b-0 hover:bg-paper-warm"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-[5px] ${config.bg} ${config.text}`}
      >
        <Icon className="h-[13px] w-[13px]" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <div className="mb-[2px] truncate text-[13px] font-medium text-ink">
          {reminder.label}
        </div>
        <div className="truncate text-[11px] text-steel">
          {reminder.leadName ?? corporateLabel}
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

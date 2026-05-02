'use client'

import { useTransition } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildReminderUrl,
  getReminderMessage,
  type DocumentReminderType,
} from '@/lib/whatsapp-templates'
import { logWhatsAppReminder } from '@/app/[locale]/app/compliance/actions'

export function WhatsAppReminderButton({
  phone,
  clientName,
  propertyTitle,
  documentType,
  leadId,
  label,
  variant = 'full',
  className,
}: {
  phone: string
  clientName: string
  propertyTitle: string
  documentType: DocumentReminderType
  leadId: string
  label?: string
  variant?: 'full' | 'mini'
  className?: string
}) {
  const [, startTransition] = useTransition()

  function handleClick() {
    const message = getReminderMessage(documentType, clientName, propertyTitle)
    const url = buildReminderUrl(phone, message)
    window.open(url, '_blank')

    startTransition(() => {
      logWhatsAppReminder(leadId, documentType)
    })
  }

  if (variant === 'mini') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-[#25D366] bg-[#25D366] text-white hover:border-[#128C7E] hover:bg-[#128C7E]',
          className,
        )}
        title={label ?? 'Recordar por WhatsApp'}
      >
        <MessageCircle className="h-[13px] w-[13px]" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[5px] border border-[#25D366] bg-[#25D366] px-[11px] py-1.5 font-sans text-[12px] font-medium text-white hover:border-[#128C7E] hover:bg-[#128C7E]',
        className,
      )}
    >
      <MessageCircle className="h-3 w-3" />
      {label ?? 'Enviar'}
    </button>
  )
}

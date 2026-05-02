'use client'

import { MessageCircle } from 'lucide-react'
import { buildReminderUrl } from '@/lib/whatsapp-templates'

export function ClientMiniWhatsAppButton({
  phone,
  clientName,
}: {
  phone: string
  clientName: string
  propertyTitle: string
}) {
  function handleClick() {
    const message = `Hola ${clientName}, te escribo de Orkasa.`
    window.open(buildReminderUrl(phone, message), '_blank')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-whatsapp bg-whatsapp px-2.5 py-1.5 text-[12px] font-medium text-white hover:border-whatsapp-deep hover:bg-whatsapp-deep"
    >
      <MessageCircle className="h-3 w-3" />
      WhatsApp
    </button>
  )
}

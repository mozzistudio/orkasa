'use client'

import { MessageCircle, User } from 'lucide-react'
import type { CoolingLead } from '@/lib/queries/dashboard'
import { formatPriceCompact } from '@/lib/utils'
import { buildReminderUrl, reactivateColdLead } from '@/lib/whatsapp-templates'

const CHANNEL_LABELS: Record<string, string> = {
  portal: 'Portal',
  web: 'Web',
  referido: 'Referido',
  whatsapp: 'WhatsApp',
  walk_in: 'Walk-in',
  other: 'Otro',
}

export function CoolingLeadRow({ lead }: { lead: CoolingLead }) {
  function handleWhatsApp() {
    if (!lead.phone) return
    const message = reactivateColdLead(
      lead.name,
      lead.propertyTitle ?? 'tu propiedad',
      lead.daysSilent,
    )
    window.open(buildReminderUrl(lead.phone, message), '_blank')
  }

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-[13px] last:border-b-0 hover:bg-paper-warm transition-colors">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-[13px] text-ink">
          <span className="font-medium">{lead.name}</span>
          <span className="rounded-[3px] bg-bone-soft px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.8px] text-steel">
            {CHANNEL_LABELS[lead.channel] ?? lead.channel}
          </span>
        </div>
        <div className="text-[11px] text-steel">
          <span className="text-ink">
            {lead.propertyTitle
              ? `${lead.propertyTitle} · ${lead.amount ? formatPriceCompact(lead.amount) : ''}`
              : 'Sin propiedad asignada'}
          </span>
          <span className="mx-[5px] text-steel-soft">·</span>
          <span className="font-medium text-signal-deep">
            {lead.daysSilent} días sin contacto
          </span>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        {lead.phone && (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-1 rounded-[5px] border border-whatsapp bg-whatsapp px-[11px] py-1.5 text-[12px] font-medium text-white hover:border-whatsapp-deep hover:bg-whatsapp-deep"
          >
            <MessageCircle className="h-3 w-3" />
            Reactivar
          </button>
        )}
        <button
          type="button"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] border-0 bg-transparent text-steel hover:bg-bone-soft hover:text-ink"
          title="Reasignar"
        >
          <User className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

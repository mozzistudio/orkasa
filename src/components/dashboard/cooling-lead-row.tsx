'use client'

import { useRouter } from '@/i18n/navigation'
import type { CoolingLead } from '@/lib/queries/dashboard'
import { formatPriceCompact } from '@/lib/utils'

const CHANNEL_LABELS: Record<string, string> = {
  portal: 'Portal',
  web: 'Web',
  referido: 'Referido',
  whatsapp: 'WhatsApp',
  walk_in: 'Walk-in',
  other: 'Otro',
}

export function CoolingLeadRow({ lead }: { lead: CoolingLead }) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/app/leads/${lead.id}`)}
      className="border-b border-bone px-[18px] py-[13px] last:border-b-0 hover:bg-paper-warm transition-colors cursor-pointer"
    >
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
    </div>
  )
}

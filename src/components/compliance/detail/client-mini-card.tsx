import { Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { formatRelativeEs } from '@/lib/compliance-copy'
import { ClientMiniWhatsAppButton } from './client-mini-whatsapp-button'

const ORIGIN_LABELS: Record<string, string> = {
  portal: 'Portal',
  web: 'Web',
  referido: 'Referido',
  whatsapp: 'WhatsApp',
  walk_in: 'Walk-in',
  other: 'Otro',
}

export function ClientMiniCard({
  leadId,
  clientName,
  clientPhone,
  createdAt,
  origin,
  assignedAgentName,
  otherDealsCount,
  propertyTitle,
}: {
  leadId: string
  clientName: string
  clientPhone: string | null
  createdAt: string | null
  origin: string
  assignedAgentName: string | null
  otherDealsCount: number
  propertyTitle: string
}) {
  return (
    <section className="rounded-[10px] border border-bone bg-paper overflow-hidden">
      <div className="flex items-center justify-between px-[18px] pt-3.5 pb-2.5">
        <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
          Sobre {clientName.split(' ')[0]}
        </div>
        <Link
          href={`/app/leads/${leadId}`}
          className="text-[11px] text-steel hover:text-ink"
        >
          Ver perfil →
        </Link>
      </div>

      <div className="px-[18px] pb-4">
        <Row label="Cliente desde" value={formatRelativeEs(createdAt)} />
        <Row label="Origen lead" value={ORIGIN_LABELS[origin] ?? origin} />
        <Row label="Asignado a" value={assignedAgentName ?? 'Sin asignar'} />
        <Row
          label="Otros deals"
          value={otherDealsCount > 0 ? `${otherDealsCount}` : 'Ninguno'}
          muted={otherDealsCount === 0}
        />

        <div className="mt-3 flex gap-1.5 border-t border-bone pt-3">
          {clientPhone && (
            <ClientMiniWhatsAppButton
              phone={clientPhone}
              clientName={clientName}
              propertyTitle={propertyTitle}
            />
          )}
          {clientPhone && (
            <a
              href={`tel:${clientPhone}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-bone bg-paper px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-steel-soft"
            >
              <Phone className="h-3 w-3" />
              Llamar
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 py-1.5 text-[12px]">
      <span className="text-steel">{label}</span>
      <span
        className={`text-right font-mono text-[11px] ${muted ? 'text-steel' : 'text-ink'}`}
      >
        {value}
      </span>
    </div>
  )
}

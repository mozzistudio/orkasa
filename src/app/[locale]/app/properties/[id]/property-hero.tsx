import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { ComputedStatus } from '@/lib/properties/types'
import { getStatusLabel } from '@/lib/properties/computed-status'

type Props = {
  property: {
    id: string
    title: string
    neighborhood: string | null
    city: string | null
    address: string | null
    price: number | null
    listing_type: string
    property_type: string
    bedrooms: number | null
    bathrooms: number | null
    area_m2: number | null
  }
  status: ComputedStatus
  leadsCount: number
  recentLeads7d: number
  hasOffer: boolean
  pendingOfferCount: number
}

const STATUS_STYLE: Record<string, string> = {
  signal: 'bg-signal text-white',
  green: 'bg-green-bg text-green-text',
  amber: 'bg-amber-bg text-amber-text',
  neutral: 'bg-bone-soft text-steel',
}

const GRADIENT_BG: Record<string, string> = {
  signal: '--signal-bg',
  green: '--green-bg',
  amber: '--amber-bg',
  neutral: '--paper-warm',
}

const TYPE_LABEL: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  condo: 'Condominio',
  land: 'Terreno',
  commercial: 'Comercial',
}

const LISTING_LABEL: Record<string, string> = {
  sale: 'Venta',
  rent: 'Alquiler',
}

export function PropertyHero({
  property: p,
  status,
  leadsCount,
  recentLeads7d,
  hasOffer,
  pendingOfferCount,
}: Props) {
  const statusStyle = STATUS_STYLE[status.tone] ?? STATUS_STYLE.neutral
  const statusLabel = getStatusLabel(status.tag)
  const gradientVar = GRADIENT_BG[status.tone] ?? GRADIENT_BG.neutral

  const specs = [
    p.bedrooms != null && `${p.bedrooms} dorm`,
    p.bathrooms != null && `${Number(p.bathrooms)} baños`,
    p.area_m2 != null && `${Number(p.area_m2)} m²`,
    TYPE_LABEL[p.property_type] ?? p.property_type,
  ].filter(Boolean)

  return (
    <section className="relative rounded-[14px] border border-bone bg-gradient-to-b from-paper to-paper-warm overflow-hidden shadow-sm">
      <div
        className="absolute top-0 right-0 w-[220px] h-[220px] opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, var(${gradientVar}), transparent 70%)`,
        }}
      />

      <div className="relative z-[1] px-6 py-6">
        {/* Status + meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`font-mono text-[10px] tracking-[1.3px] uppercase px-2.5 py-0.5 rounded-full font-medium ${statusStyle}`}
          >
            {statusLabel}
          </span>
          <span className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel">
            ·
          </span>
          <span className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel">
            {recentLeads7d > 0 && (
              <>
                <span className="text-green-text font-medium">
                  {recentLeads7d} leads esta semana
                </span>
                {hasOffer ? ' · ' : ''}
              </>
            )}
            {hasOffer &&
              `${pendingOfferCount} oferta${pendingOfferCount !== 1 ? 's' : ''} pendiente${pendingOfferCount !== 1 ? 's' : ''}`}
            {recentLeads7d === 0 && !hasOffer && `${leadsCount} leads en total`}
          </span>
        </div>

        {/* Name + more button */}
        <div className="flex items-start justify-between gap-6 mb-2.5">
          <div>
            <h1 className="text-[28px] font-medium tracking-[-0.6px] leading-tight text-ink mb-1 md:text-[30px]">
              {p.title}
            </h1>
            <div className="text-[14px] text-steel flex items-center gap-1.5 flex-wrap">
              {p.neighborhood && <span>{p.neighborhood}</span>}
              {p.neighborhood && p.city && (
                <span className="text-steel-soft">·</span>
              )}
              {p.city && <span>{p.city}</span>}
              {(p.neighborhood || p.city) && p.address && (
                <span className="text-steel-soft">·</span>
              )}
              {p.address && <span>{p.address}</span>}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 h-8 w-8 rounded-[6px] border border-bone bg-paper flex items-center justify-center text-steel hover:text-ink hover:border-steel-soft transition-colors"
          >
            <MoreHorizontal className="h-[14px] w-[14px]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-mono text-[28px] font-medium tracking-[-0.8px] text-ink leading-none md:text-[32px]">
            {p.price ? formatPrice(Number(p.price)) : '—'}
          </span>
          <span className="font-mono text-[11px] tracking-[0.8px] uppercase text-steel">
            {LISTING_LABEL[p.listing_type] ?? p.listing_type}
          </span>
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="text-[13px] text-steel mt-1">
            {specs.map((s, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {i < specs.length - 1 ? (
                  <strong className="text-ink font-medium">{s}</strong>
                ) : (
                  s
                )}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-[18px] pt-[18px] border-t border-bone sm:flex-row">
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[8px] bg-whatsapp text-white text-[13px] font-medium hover:bg-whatsapp-deep transition-colors"
          >
            <WhatsAppIcon />
            Compartir con cliente
          </button>
          <Link
            href={`/app/properties/${p.id}/edit`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[8px] bg-ink text-white text-[13px] font-medium hover:bg-coal transition-colors"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path d="M8 12V4M4 8l4 4 4-4" />
            </svg>
            Ajustar precio
          </Link>
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[8px] bg-white text-ink border border-bone text-[13px] font-medium hover:border-steel-soft transition-colors"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="8" cy="5" r="2.5" />
              <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
            </svg>
            Ver {leadsCount} leads
          </button>
        </div>
      </div>
    </section>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  )
}

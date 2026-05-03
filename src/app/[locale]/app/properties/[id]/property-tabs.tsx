'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, ChevronRight, User } from 'lucide-react'

// ── Types ──

export type LeadSummary = {
  id: string
  full_name: string
  phone: string | null
  status: string | null
  created_at: string | null
  daysSinceContact: number | null
  visitCount: number
  hasOffer: boolean
  lastMeta: string | null
}

export type TimelineEvent = {
  id: string
  type:
    | 'created'
    | 'photo'
    | 'publish'
    | 'price'
    | 'lead'
    | 'visit'
    | 'offer'
    | 'note'
    | 'call'
    | 'whatsapp'
    | 'email'
  text: string
  highlight?: string
  time: string
  timestamp: string
  quote?: string
}

export type PropertyForDetails = {
  description: string | null
  property_type: string
  listing_type: string
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  address: string | null
  neighborhood: string | null
  city: string | null
  country_code: string | null
  features: unknown
  created_at: string | null
  updated_at: string | null
}

type Props = {
  leads: LeadSummary[]
  timeline: TimelineEvent[]
  property: PropertyForDetails
}

// ── Stage display ──

const STAGE_DISPLAY: Record<
  string,
  { label: string; style: string }
> = {
  negotiating: { label: 'Oferta', style: 'bg-ink text-white' },
  viewing_scheduled: {
    label: 'Le encantó',
    style: 'bg-signal text-white',
  },
  visited: {
    label: 'Visitada',
    style: 'bg-green-bg text-green-text',
  },
  qualified: {
    label: 'Calificado',
    style: 'bg-bone-soft text-steel',
  },
  cooling: {
    label: 'Cooling',
    style: 'bg-signal-bg text-signal-deep',
  },
  new: { label: 'Nuevo', style: 'bg-bone-soft text-steel' },
  contacted: {
    label: 'Contactado',
    style: 'bg-bone-soft text-steel',
  },
}

const AVATAR_COLORS: Record<string, string> = {
  negotiating: 'bg-ink',
  viewing_scheduled: 'bg-signal-deep',
  visited: 'bg-green-mark',
  qualified: 'bg-amber-mark',
  cooling: 'bg-signal-deep',
  new: 'bg-ink',
  contacted: 'bg-ink',
}

function getDisplayStage(lead: LeadSummary): string {
  if (lead.hasOffer) return 'negotiating'
  if (lead.visitCount > 0 && lead.status === 'viewing_scheduled')
    return 'viewing_scheduled'
  if (lead.visitCount > 0) return 'visited'
  if (
    lead.daysSinceContact !== null &&
    lead.daysSinceContact > 14
  )
    return 'cooling'
  return lead.status ?? 'new'
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// ── Timeline helpers ──

const TIMELINE_ICON_CLASS: Record<string, string> = {
  created: 'bg-ink text-white',
  photo: 'bg-paper-warm text-steel border border-bone',
  publish: 'bg-signal text-white',
  price: 'bg-amber-mark text-white',
  lead: 'bg-bone-soft text-ink',
  visit: 'bg-ink text-white',
  offer: 'bg-green-mark text-white',
  note: 'bg-paper-warm text-steel border border-bone',
  call: 'bg-bone-soft text-ink',
  whatsapp: 'bg-whatsapp text-white',
  email: 'bg-bone-soft text-ink',
}

function TimelineIcon({ type }: { type: string }) {
  const cls = TIMELINE_ICON_CLASS[type] ?? 'bg-bone-soft text-ink'
  return (
    <div
      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-[1] relative ${cls}`}
    >
      <TimelineIconSvg type={type} />
    </div>
  )
}

function TimelineIconSvg({ type }: { type: string }) {
  switch (type) {
    case 'created':
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      )
    case 'publish':
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path d="M2 8l5 5 7-9" />
        </svg>
      )
    case 'price':
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="M8 12V4M4 8l4 4 4-4" />
        </svg>
      )
    case 'visit':
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="2" y="3" width="12" height="11" rx="1" />
          <path d="M2 6h12" />
        </svg>
      )
    case 'offer':
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="M8 2v12M3 6h7c1.5 0 2 1 2 2s-.5 2-2 2H4" />
        </svg>
      )
    case 'lead':
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="8" cy="5" r="2.5" />
          <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
        </svg>
      )
    case 'photo':
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="2" y="3" width="12" height="10" rx="1" />
          <circle cx="6" cy="7" r="1.5" />
          <path d="M2 11l4-4 4 3 4-2" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
        </svg>
      )
    default:
      return (
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M3 4h10M3 8h10M3 12h7" />
        </svg>
      )
  }
}

function groupTimelineByDay(events: TimelineEvent[]) {
  const groups: { label: string; items: TimelineEvent[] }[] = []
  const today = new Date()
  const todayStr = today.toDateString()
  const yesterdayStr = new Date(
    today.getTime() - 86_400_000,
  ).toDateString()

  for (const ev of events) {
    if (!ev.timestamp) continue
    const date = new Date(ev.timestamp)
    const dateStr = date.toDateString()
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / 86_400_000,
    )

    let label: string
    if (dateStr === todayStr) {
      label = 'Hoy'
    } else if (dateStr === yesterdayStr) {
      label = `Ayer — ${date.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}`
    } else {
      label = `${date.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}${diffDays > 0 ? ` — hace ${diffDays} días` : ''}`
    }

    if (
      groups.length === 0 ||
      groups[groups.length - 1].label !== label
    ) {
      groups.push({ label, items: [ev] })
    } else {
      groups[groups.length - 1].items.push(ev)
    }
  }
  return groups
}

// ── Detail helpers ──

const TYPE_LABEL: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  condo: 'Condominio',
  land: 'Terreno',
  commercial: 'Comercial',
  penthouse: 'Apartamento penthouse',
}

const LISTING_LABEL: Record<string, string> = {
  sale: 'Venta',
  rent: 'Alquiler',
}

const FEATURE_LABELS: Record<string, string> = {
  pool: 'Piscina',
  gym: 'Gimnasio',
  security: 'Seguridad',
  view: 'Vista',
  parking: 'Parking',
  terrace: 'Terraza',
  garden: 'Jardín',
  elevator: 'Ascensor',
  ac: 'Aire acondicionado',
  laundry: 'Lavandería',
  storage: 'Depósito',
  pets: 'Mascotas',
}

// ── Main component ──

export function PropertyTabs({ leads, timeline, property }: Props) {
  const [tab, setTab] = useState<
    'leads' | 'actividad' | 'detalles'
  >('leads')

  const features =
    property.features &&
    typeof property.features === 'object' &&
    !Array.isArray(property.features)
      ? (property.features as Record<string, unknown>)
      : null

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden shadow-xs">
      {/* Tab bar */}
      <div className="flex border-b border-bone px-1.5">
        <TabButton
          active={tab === 'leads'}
          onClick={() => setTab('leads')}
          icon={
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
          }
          label="Leads"
          count={leads.length}
        />
        <TabButton
          active={tab === 'actividad'}
          onClick={() => setTab('actividad')}
          icon={
            <Clock className="h-[13px] w-[13px]" strokeWidth={1.5} />
          }
          label="Actividad"
          count={timeline.length}
        />
        <TabButton
          active={tab === 'detalles'}
          onClick={() => setTab('detalles')}
          icon={
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M3 4h10M3 8h10M3 12h7" />
            </svg>
          }
          label="Detalles"
        />
      </div>

      {/* ── Leads panel ── */}
      {tab === 'leads' && (
        <div>
          <div className="px-5 py-3.5 border-b border-bone flex items-center justify-between gap-3">
            <p className="text-[12px] text-steel">
              <strong className="text-ink font-medium">
                {leads.length} leads en seguimiento
              </strong>
              {leads.length > 0 &&
                (() => {
                  const offers = leads.filter(
                    (l) => l.hasOffer,
                  ).length
                  const visited = leads.filter(
                    (l) => l.visitCount > 0,
                  ).length
                  const parts = []
                  if (offers > 0) parts.push(`${offers} con oferta`)
                  if (visited > 0)
                    parts.push(`${visited} visitaron`)
                  return parts.length > 0
                    ? ` · ${parts.join(', ')}`
                    : ''
                })()}
            </p>
          </div>
          <div className="px-5 py-2 pb-5">
            {leads.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-steel">
                Sin leads para esta propiedad todavía.
              </p>
            ) : (
              leads.map((lead) => {
                const stage = getDisplayStage(lead)
                const display =
                  STAGE_DISPLAY[stage] ?? STAGE_DISPLAY.new
                const avatarBg =
                  AVATAR_COLORS[stage] ?? 'bg-ink'

                return (
                  <div
                    key={lead.id}
                    className="grid grid-cols-[32px_1fr_auto] gap-3.5 py-3.5 border-b border-bone last:border-b-0 items-center cursor-pointer hover:bg-paper-warm hover:-mx-2 hover:px-2 hover:rounded-[6px] transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full text-white text-[11px] font-medium flex items-center justify-center shrink-0 ${avatarBg}`}
                    >
                      {initials(lead.full_name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[13px] font-medium text-ink">
                          {lead.full_name}
                        </span>
                        <span
                          className={`font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium ${display.style}`}
                        >
                          {display.label}
                        </span>
                      </div>
                      {lead.lastMeta && (
                        <p className="text-[11px] text-steel leading-snug">
                          {lead.lastMeta}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9+]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-[30px] w-[30px] rounded-[6px] bg-paper-warm border border-bone flex items-center justify-center text-steel hover:text-ink hover:bg-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                          </svg>
                        </a>
                      )}
                      <Link
                        href={`/app/leads/${lead.id}`}
                        className="h-[30px] w-[30px] rounded-[6px] bg-paper-warm border border-bone flex items-center justify-center text-steel hover:text-ink hover:bg-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronRight
                          className="h-[13px] w-[13px]"
                          strokeWidth={1.5}
                        />
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── Actividad panel ── */}
      {tab === 'actividad' && (
        <div>
          <div className="px-5 py-3.5 border-b border-bone flex items-center justify-between gap-3">
            <p className="text-[12px] text-steel">
              <strong className="text-ink font-medium">
                {timeline.length} eventos
              </strong>
              {property.created_at &&
                ` desde que se creó · ${new Date(property.created_at).toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          </div>
          <div className="px-5 py-2 pb-5">
            {timeline.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-steel">
                Sin actividad todavía.
              </p>
            ) : (
              groupTimelineByDay(timeline).map((group) => (
                <div key={group.label}>
                  <div className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel py-3.5 mt-1 border-t border-bone first:border-t-0 first:pt-2">
                    {group.label}
                  </div>
                  {group.items.map((ev, i) => {
                    const isLast = i === group.items.length - 1
                    return (
                      <div
                        key={ev.id}
                        className="grid grid-cols-[28px_1fr] gap-3 py-3 relative"
                      >
                        <div className="relative">
                          {!isLast && (
                            <span className="absolute left-[13px] top-7 bottom-[-12px] w-px bg-bone" />
                          )}
                          <TimelineIcon type={ev.type} />
                        </div>
                        <div className="min-w-0 pt-1">
                          <p
                            className="text-[13px] text-ink leading-normal"
                            dangerouslySetInnerHTML={{
                              __html: ev.text,
                            }}
                          />
                          <p className="font-mono text-[11px] text-steel mt-0.5">
                            {ev.time}
                          </p>
                          {ev.quote && (
                            <div className="mt-1.5 px-3 py-2.5 bg-paper-warm rounded-[6px] text-[12px] text-steel leading-normal border-l-2 border-bone">
                              {ev.quote}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Detalles panel ── */}
      {tab === 'detalles' && (
        <div className="px-5 py-4 pb-5">
          {/* Descripción */}
          {property.description && (
            <div className="mb-5">
              <h4 className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel mb-2.5">
                Descripción
              </h4>
              <div className="text-[13px] text-ink leading-relaxed px-3 py-2.5 bg-paper-warm rounded-[8px] border border-transparent hover:border-bone hover:bg-white transition-colors cursor-text whitespace-pre-wrap">
                {property.description}
              </div>
            </div>
          )}

          {/* Características */}
          <DetailSection title="Características">
            <DetailRow
              label="Tipo"
              value={
                TYPE_LABEL[property.property_type] ??
                property.property_type
              }
            />
            <DetailRow
              label="Operación"
              value={
                LISTING_LABEL[property.listing_type] ??
                property.listing_type
              }
            />
            {property.bedrooms != null && (
              <DetailRow
                label="Dormitorios"
                value={String(property.bedrooms)}
              />
            )}
            {property.bathrooms != null && (
              <DetailRow
                label="Baños"
                value={String(Number(property.bathrooms))}
              />
            )}
            {property.area_m2 != null && (
              <DetailRow
                label="Área"
                value={`${Number(property.area_m2)} m²`}
              />
            )}
          </DetailSection>

          {/* Ubicación */}
          <DetailSection title="Ubicación">
            {property.address && (
              <DetailRow
                label="Dirección"
                value={property.address}
              />
            )}
            {property.neighborhood && (
              <DetailRow
                label="Barrio"
                value={property.neighborhood}
              />
            )}
            {property.city && (
              <DetailRow label="Ciudad" value={property.city} />
            )}
            {property.country_code && (
              <DetailRow
                label="País"
                value={property.country_code}
              />
            )}
          </DetailSection>

          {/* Features */}
          {features && Object.keys(features).length > 0 && (
            <DetailSection title="Características adicionales">
              {Object.entries(features).map(([key, val]) => {
                if (!val) return null
                const label =
                  FEATURE_LABELS[key] ??
                  key.charAt(0).toUpperCase() + key.slice(1)
                const value =
                  val === true
                    ? 'Sí'
                    : typeof val === 'string'
                      ? val
                      : String(val)
                return (
                  <DetailRow
                    key={key}
                    label={label}
                    value={value}
                  />
                )
              })}
            </DetailSection>
          )}
        </div>
      )}
    </section>
  )
}

// ── Shared sub-components ──

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-3.5 text-[13px] font-medium inline-flex items-center gap-2 transition-colors ${
        active ? 'text-ink' : 'text-steel hover:text-ink'
      }`}
    >
      {icon}
      {label}
      {count != null && (
        <span
          className={`font-mono text-[10px] px-1.5 py-px rounded-full ${
            active
              ? 'bg-ink text-white'
              : 'bg-bone-soft text-steel'
          }`}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="absolute left-4 right-4 -bottom-px h-[2px] bg-ink rounded-t-[2px]" />
      )}
    </button>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-5 pt-5 border-t border-bone first:mt-0 first:pt-0 first:border-t-0">
      <h4 className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel mb-2.5">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
        {children}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-bone-soft text-[13px] cursor-pointer group">
      <span className="text-steel">{label}</span>
      <span className="text-ink font-medium flex items-center gap-1.5">
        {value}
        <svg
          className="opacity-0 group-hover:opacity-100 transition-opacity text-steel-soft"
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M11 3l2 2-7 7H4v-2z" />
        </svg>
      </span>
    </div>
  )
}

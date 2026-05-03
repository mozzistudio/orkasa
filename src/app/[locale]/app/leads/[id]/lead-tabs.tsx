'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Clock,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Plus,
  StickyNote,
  Heart,
  X,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { updateLeadPropertyStatus } from '../actions'

type LeadPropertyStatus = 'pendiente' | 'le_encanto' | 'descartada' | 'oferta_hecha'

type StoredImage = { path: string; url: string }

function coverUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images[0] as StoredImage | undefined
  return first?.url ?? null
}

type Interaction = {
  id: string
  type: string
  content: string | null
  created_at: string | null
  agent_id: string | null
}

type PropertyCard = {
  id: string
  title: string
  property_type: string
  listing_type: string
  price: number | string | null
  neighborhood: string | null
  city: string | null
  images: unknown
  bedrooms: number | null
  area_m2: number | string | null
}

type Props = {
  leadId: string
  interactions: Interaction[]
  agentMap: Record<string, string>
  property: PropertyCard | null
  matches: PropertyCard[]
  leadPropertyStatusMap: Record<string, LeadPropertyStatus>
}

const STATUS_BADGES: Record<LeadPropertyStatus, { label: string; style: string }> = {
  pendiente: { label: 'Pendiente', style: 'bg-bone-soft text-steel' },
  le_encanto: { label: '♥ Le encantó', style: 'bg-signal-bg text-signal-deep' },
  descartada: { label: '✕ Descartada', style: 'bg-bone-soft text-steel-soft line-through' },
  oferta_hecha: { label: 'Oferta hecha', style: 'bg-green-bg text-green-text' },
}

function PropertyStatusSelector({
  leadId,
  propertyId,
  current,
}: {
  leadId: string
  propertyId: string
  current: LeadPropertyStatus
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<LeadPropertyStatus>(current)

  function setStatus(next: LeadPropertyStatus) {
    setOptimistic(next)
    setOpen(false)
    startTransition(async () => {
      await updateLeadPropertyStatus(leadId, propertyId, next)
    })
  }

  const badge = STATUS_BADGES[optimistic]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={`font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity disabled:opacity-50 ${badge.style}`}
        aria-label="Cambiar estado de interés"
      >
        {badge.label}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[5]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-[6] min-w-[140px] rounded-[6px] border border-bone bg-paper shadow-md py-1">
            {(['pendiente', 'le_encanto', 'descartada', 'oferta_hecha'] as const).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-bone-soft transition-colors flex items-center gap-2 ${
                    s === optimistic ? 'text-ink font-medium' : 'text-steel'
                  }`}
                >
                  {s === 'le_encanto' && <Heart className="h-3 w-3" strokeWidth={1.6} />}
                  {s === 'descartada' && <X className="h-3 w-3" strokeWidth={1.6} />}
                  {STATUS_BADGES[s].label.replace(/^[♥✕]\s/, '')}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  )
}

const ICON_MAP: Record<string, { icon: typeof Phone; bg: string }> = {
  call: { icon: Phone, bg: 'bg-bone-soft text-ink' },
  email: { icon: Mail, bg: 'bg-bone-soft text-ink' },
  note: { icon: StickyNote, bg: 'bg-paper-warm text-steel border border-bone' },
  visit: { icon: Calendar, bg: 'bg-ink text-white' },
}

function WhatsAppTimelineIcon() {
  return (
    <div className="h-7 w-7 rounded-full bg-whatsapp text-white flex items-center justify-center shrink-0 z-[1] relative">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
      </svg>
    </div>
  )
}

function CreatedIcon() {
  return (
    <div className="h-7 w-7 rounded-full bg-amber-mark text-white flex items-center justify-center shrink-0 z-[1] relative">
      <Plus className="h-[11px] w-[11px]" strokeWidth={2} />
    </div>
  )
}

function groupByDay(interactions: Interaction[]) {
  const groups: { label: string; items: Interaction[] }[] = []
  const today = new Date()
  const todayStr = today.toDateString()

  for (const it of interactions) {
    if (!it.created_at) continue
    const date = new Date(it.created_at)
    const isToday = date.toDateString() === todayStr
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / 86_400_000,
    )
    const label = isToday
      ? 'Hoy'
      : `${date.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}${diffDays > 0 ? ` — hace ${diffDays} días` : ''}`

    if (groups.length === 0 || groups[groups.length - 1].label !== label) {
      groups.push({ label, items: [it] })
    } else {
      groups[groups.length - 1].items.push(it)
    }
  }
  return groups
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}`
}

export function LeadTabs({
  leadId,
  interactions,
  agentMap,
  property,
  matches,
  leadPropertyStatusMap,
}: Props) {
  const [tab, setTab] = useState<'historia' | 'propiedades'>('historia')

  const allProps = property ? [property, ...matches] : matches
  const propCount = allProps.length

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-bone px-1.5">
        <button
          type="button"
          onClick={() => setTab('historia')}
          className={`relative px-4 py-3.5 text-[13px] font-medium inline-flex items-center gap-2 transition-colors ${
            tab === 'historia' ? 'text-ink' : 'text-steel hover:text-ink'
          }`}
        >
          <Clock className="h-[13px] w-[13px]" strokeWidth={1.5} />
          Historia
          <span
            className={`font-mono text-[10px] px-1.5 py-px rounded-full ${
              tab === 'historia'
                ? 'bg-ink text-white'
                : 'bg-bone-soft text-steel'
            }`}
          >
            {interactions.length}
          </span>
          {tab === 'historia' && (
            <span className="absolute left-4 right-4 -bottom-px h-[2px] bg-ink rounded-t-[2px]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('propiedades')}
          className={`relative px-4 py-3.5 text-[13px] font-medium inline-flex items-center gap-2 transition-colors ${
            tab === 'propiedades' ? 'text-ink' : 'text-steel hover:text-ink'
          }`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M2 6h12v9H2z" />
            <path d="M2 6l6-4 6 4" />
          </svg>
          Propiedades
          <span
            className={`font-mono text-[10px] px-1.5 py-px rounded-full ${
              tab === 'propiedades'
                ? 'bg-ink text-white'
                : 'bg-bone-soft text-steel'
            }`}
          >
            {propCount}
          </span>
          {tab === 'propiedades' && (
            <span className="absolute left-4 right-4 -bottom-px h-[2px] bg-ink rounded-t-[2px]" />
          )}
        </button>
      </div>

      {/* Historia panel */}
      {tab === 'historia' && (
        <div>
          <div className="px-5 py-3.5 border-b border-bone flex items-center justify-between gap-3">
            <p className="text-[12px] text-steel">
              <strong className="text-ink font-medium">
                {interactions.length} interacciones
              </strong>
            </p>
          </div>
          <div className="px-5 py-2 pb-5">
            {interactions.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-steel">
                Sin interacciones todavía.
              </p>
            ) : (
              groupByDay(interactions).map((group) => (
                <div key={group.label}>
                  <div className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel py-3.5 mt-1 border-t border-bone first:border-t-0 first:pt-2">
                    {group.label}
                  </div>
                  {group.items.map((it, i) => {
                    const isLast =
                      i === group.items.length - 1
                    const iconDef = ICON_MAP[it.type]
                    const agentName =
                      it.agent_id && agentMap[it.agent_id]
                        ? agentMap[it.agent_id]
                        : null

                    return (
                      <div
                        key={it.id}
                        className="grid grid-cols-[28px_1fr] gap-3 py-3 relative"
                      >
                        {/* Rail + icon */}
                        <div className="relative">
                          {!isLast && (
                            <span className="absolute left-[13px] top-7 bottom-[-12px] w-px bg-bone" />
                          )}
                          {it.type === 'whatsapp' ? (
                            <WhatsAppTimelineIcon />
                          ) : iconDef ? (
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-[1] relative ${iconDef.bg}`}
                            >
                              <iconDef.icon
                                className="h-3 w-3"
                                strokeWidth={1.5}
                              />
                            </div>
                          ) : (
                            <CreatedIcon />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 pt-1">
                          <p className="text-[13px] text-ink leading-normal">
                            {agentName && (
                              <strong className="font-medium">
                                {agentName}
                              </strong>
                            )}{' '}
                            <span className="text-steel">
                              {it.type === 'note'
                                ? 'agregó una nota'
                                : it.type === 'call'
                                  ? 'registró una llamada'
                                  : it.type === 'email'
                                    ? 'envió un email'
                                    : it.type === 'whatsapp'
                                      ? 'envió por WhatsApp'
                                      : it.type === 'visit'
                                        ? 'registró una visita'
                                        : it.type}
                            </span>
                          </p>
                          <p className="font-mono text-[11px] text-steel mt-0.5">
                            {formatTime(it.created_at)}
                          </p>
                          {it.content && (
                            <div className="mt-1.5 px-3 py-2.5 bg-paper-warm rounded-[6px] text-[12px] text-steel leading-normal border-l-2 border-bone">
                              {it.content}
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

      {/* Propiedades panel */}
      {tab === 'propiedades' && (
        <div>
          <div className="px-5 py-3.5 border-b border-bone flex items-center justify-between gap-3">
            <p className="text-[12px] text-steel">
              <strong className="text-ink font-medium">
                {propCount} propiedades
              </strong>{' '}
              en seguimiento
            </p>
          </div>
          <div className="px-5 py-2 pb-5">
            {allProps.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-steel">
                Sin propiedades asignadas.
              </p>
            ) : (
              allProps.map((p, idx) => {
                const cover = coverUrl(p.images)
                const location = [p.neighborhood, p.city]
                  .filter(Boolean)
                  .join(' · ')
                const isPrincipal = property && p.id === property.id

                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[88px_1fr_auto] gap-4 py-4 border-b border-bone last:border-b-0 items-center"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-[88px] h-[72px] rounded-[8px] overflow-hidden shrink-0 bg-coal">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={p.title}
                          fill
                          sizes="88px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${
                              idx === 0
                                ? '#5D7A8C, #2E4A5C'
                                : idx === 1
                                  ? '#8B7355, #5C4A35'
                                  : '#7C8B6F, #4A5C42'
                            })`,
                          }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[14px] font-medium text-ink">
                          {p.title}
                        </span>
                        {isPrincipal && (
                          <span className="font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full bg-ink text-white font-medium">
                            Principal
                          </span>
                        )}
                        <PropertyStatusSelector
                          leadId={leadId}
                          propertyId={p.id}
                          current={leadPropertyStatusMap[p.id] ?? 'pendiente'}
                        />
                      </div>
                      <p className="text-[12px] text-steel mb-1.5">
                        {location || '—'} ·{' '}
                        <span className="text-ink font-medium">
                          {p.price
                            ? formatPrice(Number(p.price))
                            : '—'}
                        </span>
                        {p.bedrooms != null && ` · ${p.bedrooms} dorm`}
                        {p.area_m2 != null && ` · ${Number(p.area_m2)}m²`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <Link
                        href={`/app/properties/${p.id}`}
                        className="h-[30px] w-[30px] rounded-[6px] bg-paper-warm border border-bone flex items-center justify-center text-steel hover:text-ink hover:bg-white transition-colors"
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

            <button
              type="button"
              className="mt-1.5 w-full py-3 px-4 border border-dashed border-bone rounded-[8px] text-[12px] text-steel hover:border-steel-soft hover:text-ink transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="h-[11px] w-[11px]" strokeWidth={1.6} />
              Sugerir otra propiedad
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

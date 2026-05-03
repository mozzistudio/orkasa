import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronDown, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatPriceCompact } from '@/lib/utils'
import {
  computePropertyStatus,
  computePropertyAlert,
  getStatusLabel,
} from '@/lib/properties/computed-status'
import { PropertyHero } from './property-hero'
import { PropertyComposer } from './property-composer'
import { PropertyTabs } from './property-tabs'
import type { LeadSummary, TimelineEvent } from './property-tabs'
import type { Database } from '@/lib/database.types'
import type {
  PropertyWithMetrics,
  PropertyMetrics,
  StoredImage,
  PriceHistoryEntry,
} from '@/lib/properties/types'

type Property = Database['public']['Tables']['properties']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Interaction = Database['public']['Tables']['lead_interactions']['Row']
type Publication =
  Database['public']['Tables']['property_publications']['Row']

const DAY_MS = 86_400_000

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)
}

function daysUntil(iso: string | null | undefined): number {
  if (!iso) return Number.POSITIVE_INFINITY
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS)
}

function fmtTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}`
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // ── Parallel data fetching ──
  const [propertyRes, leadsRes, publicationsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .maybeSingle<Property>(),
    supabase
      .from('leads')
      .select('*')
      .eq('property_id', id)
      .order('created_at', { ascending: false })
      .returns<Lead[]>(),
    supabase
      .from('property_publications')
      .select('*')
      .eq('property_id', id)
      .returns<Publication[]>(),
  ])

  const property = propertyRes.data
  if (!property) notFound()

  const leads = leadsRes.data ?? []
  const publications = publicationsRes.data ?? []

  // Fetch interactions for all leads of this property
  const leadIds = leads.map((l) => l.id)
  const interactionsRes =
    leadIds.length > 0
      ? await supabase
          .from('lead_interactions')
          .select('*')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
          .returns<Interaction[]>()
      : { data: [] }
  const interactions = interactionsRes.data ?? []

  // Fetch agents for timeline attribution
  const agentIds = [
    ...new Set(interactions.map((i) => i.agent_id).filter(Boolean)),
  ] as string[]
  const agentsRes =
    agentIds.length > 0
      ? await supabase
          .from('agents')
          .select('id, full_name')
          .in('id', agentIds)
          .returns<Array<{ id: string; full_name: string }>>()
      : { data: [] }
  const agentMap: Record<string, string> = {}
  for (const a of agentsRes.data ?? []) agentMap[a.id] = a.full_name

  // ── Compute metrics ──
  const now = Date.now()
  const sevenDaysAgo = now - 7 * DAY_MS
  const recentLeads7d = leads.filter(
    (l) => l.created_at && new Date(l.created_at).getTime() > sevenDaysAgo,
  ).length
  const visits = interactions.filter((i) => i.type === 'visit')
  const visitsThisWeek = visits.filter(
    (v) => v.created_at && new Date(v.created_at).getTime() > sevenDaysAgo,
  ).length
  const negotiatingLeads = leads.filter(
    (l) => l.status === 'negotiating',
  )
  const hasOfferPending = negotiatingLeads.length > 0

  const priceHistory: PriceHistoryEntry[] = Array.isArray(
    property.price_history,
  )
    ? (property.price_history as unknown as PriceHistoryEntry[])
    : []
  const lastPriceChange = priceHistory[priceHistory.length - 1]
  const previousPrice = lastPriceChange?.from ?? null
  const recentPriceDrop =
    lastPriceChange != null &&
    lastPriceChange.from != null &&
    lastPriceChange.to < lastPriceChange.from &&
    daysSince(lastPriceChange.at) <= 14

  const metrics: PropertyMetrics = {
    totalLeads: leads.length,
    recentLeads7d,
    visitsCount: visitsThisWeek,
    nextViewingAt: null,
    hasOfferPending,
    pendingOfferAmount: null,
    pendingOfferLeadName: negotiatingLeads[0]?.full_name ?? null,
    recentPriceDrop,
    priceDropAt: lastPriceChange?.at ?? null,
    previousPrice,
    ownerName: null,
  }

  const propertyWithMetrics: PropertyWithMetrics = {
    ...property,
    metrics,
  }
  const computedStatus = computePropertyStatus(propertyWithMetrics)
  const computedAlert = computePropertyAlert(propertyWithMetrics)

  // ── Compute publication info ──
  const livePublications = publications.filter(
    (p) => p.status === 'published',
  )
  const firstPublishedAt = livePublications
    .map((p) => p.published_at)
    .filter(Boolean)
    .sort()[0]
  const daysSincePublished = firstPublishedAt
    ? daysSince(firstPublishedAt)
    : null
  const daysUntilExpiry = property.listing_expires_at
    ? daysUntil(property.listing_expires_at)
    : null

  // ── Build lead summaries ──
  const leadSummaries: LeadSummary[] = leads.map((lead) => {
    const leadInteractions = interactions.filter(
      (i) => i.lead_id === lead.id,
    )
    const lastInteraction = leadInteractions[0]
    const dc = lastInteraction?.created_at
      ? Math.floor(
          (now - new Date(lastInteraction.created_at).getTime()) /
            DAY_MS,
        )
      : null
    const vc = leadInteractions.filter(
      (i) => i.type === 'visit',
    ).length

    let lastMeta: string | null = null
    if (lastInteraction) {
      const typeLabel: Record<string, string> = {
        visit: 'Visita',
        call: 'Llamada',
        whatsapp: 'WhatsApp',
        email: 'Email',
        note: 'Nota',
      }
      const tl = typeLabel[lastInteraction.type] ?? lastInteraction.type
      const timePart = lastInteraction.created_at
        ? new Date(lastInteraction.created_at).toLocaleDateString(
            'es-PA',
            { day: 'numeric', month: 'short' },
          )
        : ''
      lastMeta = `${tl} ${timePart}`
      if (dc !== null && dc > 3) lastMeta += ` · ${dc} días sin contacto`
    } else if (lead.created_at) {
      lastMeta = `Registrado ${new Date(lead.created_at).toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}`
    }

    return {
      id: lead.id,
      full_name: lead.full_name,
      phone: lead.phone,
      status: lead.status,
      created_at: lead.created_at,
      daysSinceContact: dc,
      visitCount: vc,
      hasOffer: lead.status === 'negotiating',
      lastMeta,
    }
  })

  // ── Build timeline events ──
  const timeline: TimelineEvent[] = []

  // Property created
  if (property.created_at) {
    const initialPrice = priceHistory.length > 0 ? priceHistory[0].from ?? priceHistory[0].to : property.price
    timeline.push({
      id: 'created',
      type: 'created',
      text: `Propiedad creada${initialPrice ? ` · precio inicial <strong>${formatPrice(Number(initialPrice))}</strong>` : ''}`,
      time: fmtTime(property.created_at),
      timestamp: property.created_at,
    })
  }

  // Photos (approximate — use created_at if no separate event)
  const images: StoredImage[] = Array.isArray(property.images)
    ? (property.images as unknown as StoredImage[])
    : []
  if (images.length > 0 && property.created_at) {
    timeline.push({
      id: 'photos',
      type: 'photo',
      text: `Se subieron <strong>${images.length} fotos</strong>`,
      time: fmtTime(property.created_at),
      timestamp: property.created_at,
    })
  }

  // Publications
  for (const pub of publications) {
    if (pub.published_at) {
      timeline.push({
        id: `pub-${pub.id}`,
        type: 'publish',
        text: `Publicada en <strong>${pub.provider}</strong>`,
        time: fmtTime(pub.published_at),
        timestamp: pub.published_at,
      })
    }
  }

  // Price changes
  for (let i = 0; i < priceHistory.length; i++) {
    const entry = priceHistory[i]
    if (entry.from != null) {
      const fromStr = formatPriceCompact(entry.from)
      const toStr = formatPriceCompact(entry.to)
      const pct =
        entry.from > 0
          ? Math.round(
              ((entry.to - entry.from) / entry.from) * 100,
            )
          : 0
      const direction = pct < 0 ? 'Bajaste' : 'Subiste'
      timeline.push({
        id: `price-${i}`,
        type: 'price',
        text: `${direction} el precio de <span class="text-steel">${fromStr}</span> a <strong>${toStr}</strong> <span class="text-steel">(${pct > 0 ? '+' : ''}${pct}%)</span>`,
        time: fmtTime(entry.at),
        timestamp: entry.at,
      })
    }
  }

  // Lead creation events
  for (const lead of leads) {
    if (lead.created_at) {
      timeline.push({
        id: `lead-${lead.id}`,
        type: 'lead',
        text: `Nuevo lead · <strong>${lead.full_name}</strong>`,
        time: fmtTime(lead.created_at),
        timestamp: lead.created_at,
      })
    }
  }

  // Lead interactions (visits, notes, calls, etc.)
  for (const it of interactions) {
    const agentName = it.agent_id ? agentMap[it.agent_id] : null
    const lead = leads.find((l) => l.id === it.lead_id)
    const nameStr = agentName
      ? `<strong>${agentName}</strong>`
      : lead
        ? `<strong>${lead.full_name}</strong>`
        : ''

    const typeText: Record<string, string> = {
      visit: 'registró una visita',
      call: 'registró una llamada',
      note: 'agregó una nota',
      whatsapp: 'envió por WhatsApp',
      email: 'envió un email',
    }

    timeline.push({
      id: `interaction-${it.id}`,
      type: (it.type === 'visit'
        ? 'visit'
        : it.type) as TimelineEvent['type'],
      text: `${nameStr} ${typeText[it.type] ?? it.type}${lead ? ` con <strong>${lead.full_name}</strong>` : ''}`,
      time: fmtTime(it.created_at),
      timestamp: it.created_at ?? '',
      quote: it.content ?? undefined,
    })
  }

  // Sort timeline by timestamp DESC
  timeline.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  // ── Alert tone mapping ──
  const ALERT_STYLE: Record<string, string> = {
    hot: 'bg-green-bg text-green-text border-l-2 border-green-mark',
    opp: 'bg-green-bg text-green-text border-l-2 border-green-mark',
    cool: 'bg-amber-bg text-amber-text border-l-2 border-amber-mark',
    neutral: 'bg-paper-warm text-steel border-l-2 border-bone',
  }

  // ── Portal display ──
  const PROVIDER_LABELS: Record<string, string> = {
    encuentra24: 'encuentra24',
    mercadolibre: 'mercadolibre',
    compreoalquile: 'Compreoalquile',
    web: 'Web Orkasa',
  }

  const PORTAL_STATUS_STYLE: Record<string, string> = {
    published:
      'bg-green-bg text-green-text',
    draft: 'bg-bone-soft text-steel',
    generating: 'bg-amber-bg text-amber-text',
    validated: 'bg-amber-bg text-amber-text',
    queued: 'bg-amber-bg text-amber-text',
    publishing: 'bg-amber-bg text-amber-text',
    failed: 'bg-signal-bg text-signal-deep',
    paused: 'bg-bone-soft text-steel',
  }

  const PORTAL_STATUS_LABEL: Record<string, string> = {
    published: 'Live',
    draft: 'Borrador',
    generating: 'Generando',
    validated: 'Validado',
    queued: 'En cola',
    publishing: 'Publicando',
    failed: 'Error',
    paused: 'Pausado',
  }

  const PORTAL_DOT_COLOR: Record<string, string> = {
    published: 'bg-green-mark',
    draft: 'bg-steel-soft',
    failed: 'bg-signal',
    paused: 'bg-steel-soft',
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Back link */}
      <Link
        href="/app/properties"
        className="inline-flex items-center gap-1.5 text-[12px] text-steel hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft className="h-[11px] w-[11px]" strokeWidth={1.5} />
        Volver a Propiedades
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Main column ── */}
        <div className="min-w-0 flex flex-col gap-4">
          {/* Hero */}
          <PropertyHero
            property={property}
            status={computedStatus}
            leadsCount={leads.length}
            recentLeads7d={recentLeads7d}
            hasOffer={hasOfferPending}
            pendingOfferCount={negotiatingLeads.length}
          />

          {/* Photo strip */}
          {(images.length > 0 || true) && (
            <section className="rounded-[12px] border border-bone bg-paper p-3 shadow-xs">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <div
                    key={img.path}
                    className="relative h-[88px] w-[132px] shrink-0 rounded-[8px] overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="132px"
                      className="object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-ink/70 text-white backdrop-blur-sm font-mono text-[9px] tracking-[0.5px] uppercase px-1.5 py-0.5 rounded-[3px]">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
                {images.length === 0 && (
                  <div className="h-[88px] w-[132px] shrink-0 rounded-[8px] bg-gradient-to-br from-[#5D7A8C] to-[#2E4A5C]" />
                )}
                <button
                  type="button"
                  className="h-[88px] w-[132px] shrink-0 rounded-[8px] border border-dashed border-bone bg-transparent flex flex-col items-center justify-center gap-1 text-steel text-[12px] cursor-pointer hover:border-steel-soft hover:text-ink transition-colors"
                >
                  <Plus
                    className="h-4 w-4"
                    strokeWidth={1.5}
                  />
                  Agregar foto
                </button>
              </div>
            </section>
          )}

          {/* Pulse strip — 4 business metrics */}
          <section className="grid grid-cols-2 md:grid-cols-4 rounded-[12px] border border-bone bg-paper overflow-hidden shadow-xs">
            <PulseCell
              label="Leads activos"
              value={String(leads.length)}
              valueClass={leads.length > 0 ? 'text-green-text' : undefined}
              meta={
                recentLeads7d > 0
                  ? `↑ ${recentLeads7d} esta semana`
                  : 'sin nuevos'
              }
              metaClass={recentLeads7d > 0 ? 'text-green-text font-medium' : undefined}
            />
            <PulseCell
              label="Visitas"
              value={String(visitsThisWeek)}
              meta={`esta semana · ${visits.length} totales`}
            />
            <PulseCell
              label="Publicada"
              value={
                daysSincePublished != null
                  ? `${daysSincePublished}d`
                  : '—'
              }
              meta={
                daysUntilExpiry != null && daysUntilExpiry < Infinity
                  ? `listing vence ${new Date(property.listing_expires_at!).toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}`
                  : daysSincePublished != null
                    ? 'activa'
                    : 'sin publicar'
              }
            />
            <PulseCell
              label="Ofertas"
              value={String(negotiatingLeads.length)}
              valueClass={
                negotiatingLeads.length > 0
                  ? 'text-signal-deep'
                  : undefined
              }
              meta={
                negotiatingLeads.length > 0
                  ? 'pendiente'
                  : 'sin ofertas'
              }
              metaClass={
                negotiatingLeads.length > 0
                  ? 'text-signal-deep font-medium'
                  : undefined
              }
              noBorder
            />
          </section>

          {/* Composer */}
          <PropertyComposer propertyId={property.id} />

          {/* Main tabs */}
          <PropertyTabs
            leads={leadSummaries}
            timeline={timeline}
            property={property}
          />
        </div>

        {/* ── Sidebar ── */}
        <div className="hidden lg:flex flex-col gap-3.5 sticky top-[76px]">
          {/* Resumen card */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 flex justify-between items-center">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Resumen
              </h3>
            </div>
            <div
              className={`mx-4 mb-3.5 px-3.5 py-3 rounded-[8px] text-[12px] leading-normal ${ALERT_STYLE[computedAlert.tone] ?? ALERT_STYLE.neutral}`}
            >
              <strong className="font-medium">
                {computedAlert.message}
              </strong>
            </div>
            <div className="px-4 pb-3.5">
              <AboutRow
                label="Precio actual"
                value={
                  property.price
                    ? formatPriceCompact(Number(property.price))
                    : '—'
                }
                mono
              />
              {previousPrice != null && (
                <AboutRow
                  label="Precio original"
                  value={formatPriceCompact(previousPrice)}
                  mono
                  muted
                />
              )}
              <AboutRow
                label="Comisión"
                value={
                  property.price
                    ? `3% · ${formatPriceCompact(Number(property.price) * 0.03)}`
                    : '—'
                }
                green
              />
            </div>
          </section>

          {/* Listing card */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 flex justify-between items-center">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Listing
              </h3>
              <span className="text-[11px] text-steel cursor-pointer hover:text-ink transition-colors">
                Sync ahora
              </span>
            </div>
            <div className="px-4 pb-3.5">
              {publications.length === 0 ? (
                <p className="py-3 text-[12px] text-steel text-center">
                  Sin publicaciones aún.
                </p>
              ) : (
                publications.map((pub) => (
                  <div
                    key={pub.id}
                    className="flex items-center justify-between py-2 border-b border-bone-soft last:border-b-0 text-[12px]"
                  >
                    <span className="text-ink flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-[2px] ${PORTAL_DOT_COLOR[pub.status] ?? 'bg-steel-soft'}`}
                      />
                      {PROVIDER_LABELS[pub.provider] ??
                        pub.provider}
                    </span>
                    <span
                      className={`font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium ${PORTAL_STATUS_STYLE[pub.status] ?? 'bg-bone-soft text-steel'}`}
                    >
                      {PORTAL_STATUS_LABEL[pub.status] ??
                        pub.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link
              href={`/app/properties/${property.id}/publish`}
              className="mx-4 mb-4 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-ink text-white rounded-[6px] text-[12px] font-medium hover:bg-coal transition-colors"
            >
              Publicar en más portales
            </Link>
            {property.listing_expires_at && (
              <div className="px-4 pb-3.5 pt-3 border-t border-bone">
                <div className="grid grid-cols-[1fr_auto] gap-3 text-[12px] items-center">
                  <span className="text-steel">
                    Vence listing
                  </span>
                  <span className="text-ink text-right font-mono text-[11px]">
                    {new Date(
                      property.listing_expires_at,
                    ).toLocaleDateString('es-PA', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {daysUntilExpiry != null &&
                      daysUntilExpiry < Infinity &&
                      ` · en ${daysUntilExpiry} días`}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Technical details */}
          <section className="rounded-[12px] border border-dashed border-bone bg-paper-warm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between cursor-pointer">
              <div className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel flex items-center gap-1.5">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <circle cx="8" cy="8" r="2" />
                  <path d="M8 1v3M8 12v3M1 8h3M12 8h3" />
                </svg>
                Detalles técnicos
              </div>
              <ChevronDown
                className="h-[11px] w-[11px] text-steel-soft"
                strokeWidth={1.5}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──

function PulseCell({
  label,
  value,
  valueClass,
  meta,
  metaClass,
  noBorder,
}: {
  label: string
  value: string
  valueClass?: string
  meta: string
  metaClass?: string
  noBorder?: boolean
}) {
  return (
    <div
      className={`px-[18px] py-3.5 ${noBorder ? '' : 'border-r border-bone'} [&:nth-child(2)]:max-md:border-r-0 [&:nth-child(1)]:max-md:border-b [&:nth-child(2)]:max-md:border-b`}
    >
      <div className="font-mono text-[9px] tracking-[1.2px] uppercase text-steel mb-1.5">
        {label}
      </div>
      <div
        className={`font-mono text-[18px] font-medium tracking-[-0.3px] leading-none mb-1 ${valueClass ?? 'text-ink'}`}
      >
        {value}
      </div>
      <div className={`text-[11px] ${metaClass ?? 'text-steel'}`}>
        {meta}
      </div>
    </div>
  )
}

function AboutRow({
  label,
  value,
  mono,
  muted,
  green,
}: {
  label: string
  value: string
  mono?: boolean
  muted?: boolean
  green?: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-[7px] text-[12px] items-center">
      <span className="text-steel">{label}</span>
      <span
        className={`text-right ${
          green
            ? 'text-green-text font-medium'
            : muted
              ? 'text-steel font-mono text-[11px]'
              : mono
                ? 'text-ink font-mono text-[11px]'
                : 'text-ink'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

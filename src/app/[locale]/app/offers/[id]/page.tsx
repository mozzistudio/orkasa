import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OfferActionsPanel } from './offer-actions-panel'
import type { Database } from '@/lib/database.types'

type Offer = Database['public']['Tables']['offers']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Interaction = Database['public']['Tables']['lead_interactions']['Row']

type StoredImage = { path: string; url: string }

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  countered: 'Contraoferta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  withdrawn: 'Retirada',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-bone-soft text-steel',
  submitted: 'bg-amber-bg text-amber-text',
  countered: 'bg-amber-bg text-amber-text',
  accepted: 'bg-green-bg text-green-text',
  rejected: 'bg-signal-bg text-signal-deep',
  expired: 'bg-bone-soft text-steel',
  withdrawn: 'bg-bone-soft text-steel',
}

function fmtMoney(amount: number | null, currency: string | null): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDateLong(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('id', id)
    .maybeSingle<Offer>()

  if (!offer) notFound()

  const [leadRes, propertyRes, agentRes, interactionsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', offer.lead_id)
      .maybeSingle<Lead>(),
    supabase
      .from('properties')
      .select('*')
      .eq('id', offer.property_id)
      .maybeSingle<Property>(),
    offer.agent_id
      ? supabase
          .from('agents')
          .select('id, full_name, phone')
          .eq('id', offer.agent_id)
          .maybeSingle<{ id: string; full_name: string; phone: string | null }>()
      : Promise.resolve({ data: null }),
    supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', offer.lead_id)
      .order('created_at', { ascending: false })
      .limit(15)
      .returns<Interaction[]>(),
  ])

  const lead = leadRes.data
  const property = propertyRes.data
  const agent = agentRes.data
  const interactions = interactionsRes.data ?? []

  if (!lead || !property) notFound()

  const propertyImages: StoredImage[] = Array.isArray(property.images)
    ? (property.images as unknown as StoredImage[])
    : []
  const heroImage = propertyImages[0]?.url ?? null

  const amount = Number(offer.amount)
  const propertyPrice = property.price ? Number(property.price) : null
  const diff = propertyPrice != null ? amount - propertyPrice : null
  const diffPct =
    propertyPrice != null && propertyPrice > 0
      ? (amount / propertyPrice - 1) * 100
      : null

  const validUntil = offer.created_at
    ? (() => {
        const d = new Date(offer.created_at)
        d.setDate(d.getDate() + 7)
        return d.toISOString()
      })()
    : null

  return (
    <div className="mx-auto max-w-[1280px]">
      <Link
        href="/app/offers"
        className="inline-flex items-center gap-1.5 text-[12px] text-steel hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft className="h-[11px] w-[11px]" strokeWidth={1.5} />
        Volver a Ofertas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Main column ── */}
        <div className="min-w-0 flex flex-col gap-4">
          {/* Hero */}
          <section className="rounded-[14px] border border-bone bg-paper overflow-hidden shadow-sm">
            <div className="px-6 py-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel">
                  Oferta · OFR-{offer.id.slice(0, 8).toUpperCase()}
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.8px] uppercase px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[offer.status] ?? STATUS_STYLE.draft}`}
                >
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </span>
              </div>
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <span className="font-mono text-[36px] font-medium tracking-[-0.6px] text-ink">
                  {fmtMoney(amount, offer.currency)}
                </span>
                {diff != null && diffPct != null && (
                  <span
                    className={`font-mono text-[14px] ${diff < 0 ? 'text-signal-deep' : 'text-green-text'}`}
                  >
                    {diff >= 0 ? '+' : ''}
                    {diffPct.toFixed(1)}% vs publicado
                  </span>
                )}
              </div>
              <p className="text-[13px] text-steel">
                Presentada por{' '}
                <Link
                  href={`/app/leads/${lead.id}`}
                  className="text-ink font-medium hover:underline underline-offset-2"
                >
                  {lead.full_name}
                </Link>{' '}
                el {fmtDateLong(offer.created_at)}
              </p>
            </div>
          </section>

          {/* Property card with photo */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft flex items-center justify-between">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Propiedad
              </h3>
              <Link
                href={`/app/properties/${property.id}`}
                className="text-[11px] text-steel hover:text-ink underline-offset-2 hover:underline"
              >
                Ver propiedad →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 p-4">
              <div className="relative h-[140px] w-full sm:w-[200px] rounded-[8px] overflow-hidden bg-gradient-to-br from-[#5D7A8C] to-[#2E4A5C] shrink-0">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={property.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <h4 className="text-[16px] font-medium text-ink leading-tight">
                  {property.title}
                </h4>
                <div className="mt-1 text-[12px] text-steel flex items-center gap-1.5 flex-wrap">
                  <MapPin className="h-3 w-3" strokeWidth={1.5} />
                  {[property.address, property.neighborhood, property.city]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                  <span className="font-mono text-[18px] font-medium text-ink">
                    {fmtMoney(propertyPrice, property.currency)}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.7px] uppercase text-steel">
                    {property.listing_type === 'sale' ? 'Venta' : 'Alquiler'} ·{' '}
                    Publicado
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12px] text-steel flex-wrap">
                  {property.bedrooms != null && (
                    <span>
                      <strong className="text-ink font-medium">
                        {property.bedrooms}
                      </strong>{' '}
                      dorm
                    </span>
                  )}
                  {property.bathrooms != null && (
                    <span>
                      <strong className="text-ink font-medium">
                        {Number(property.bathrooms)}
                      </strong>{' '}
                      baños
                    </span>
                  )}
                  {property.area_m2 != null && (
                    <span>
                      <strong className="text-ink font-medium">
                        {Number(property.area_m2)}
                      </strong>{' '}
                      m²
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Offer terms */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Términos de la oferta
              </h3>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.7px] text-steel mb-0.5">
                    Monto
                  </div>
                  <div className="font-mono text-[14px] font-medium text-ink">
                    {fmtMoney(amount, offer.currency)}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.7px] text-steel mb-0.5">
                    Vigencia hasta
                  </div>
                  <div className="text-ink">
                    {fmtDateLong(validUntil)}
                  </div>
                </div>
              </div>

              {offer.conditions && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.7px] text-steel mb-1">
                    Condiciones
                  </div>
                  <p className="text-[12px] text-ink leading-relaxed whitespace-pre-wrap">
                    {offer.conditions}
                  </p>
                </div>
              )}

              {offer.notes && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.7px] text-steel mb-1">
                    Notas internas
                  </div>
                  <p className="text-[12px] text-steel italic leading-relaxed whitespace-pre-wrap">
                    {offer.notes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* PDF preview */}
          {offer.public_token && (
            <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
              <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft flex items-center justify-between">
                <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                  Carta de oferta (PDF)
                </h3>
                <a
                  href={`/offer/${offer.public_token}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-steel hover:text-ink underline-offset-2 hover:underline"
                >
                  <FileText className="h-[11px] w-[11px]" strokeWidth={1.5} />
                  Abrir en pestaña nueva
                </a>
              </div>
              <iframe
                src={`/offer/${offer.public_token}/pdf`}
                className="w-full h-[480px] bg-bone-soft"
                title="Carta de oferta"
              />
            </section>
          )}

          {/* Activity */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Actividad reciente del cliente · {interactions.length}
              </h3>
            </div>
            <div className="px-4 py-3">
              {interactions.length === 0 ? (
                <p className="py-2 text-[12px] text-steel text-center">
                  Sin interacciones registradas con este cliente.
                </p>
              ) : (
                <ul className="space-y-2">
                  {interactions.map((it) => (
                    <li key={it.id} className="flex items-start gap-2 text-[12px]">
                      <span className="font-mono text-[10px] uppercase tracking-[0.7px] text-steel min-w-[60px]">
                        {it.type}
                      </span>
                      <span className="text-ink line-clamp-2">
                        {it.content || '—'}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-steel-soft shrink-0">
                        {it.created_at &&
                          new Date(it.created_at).toLocaleDateString('es-PA', {
                            day: 'numeric',
                            month: 'short',
                          })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <div className="hidden lg:flex flex-col gap-3.5 sticky top-[76px]">
          {/* Actions */}
          <OfferActionsPanel
            offerId={offer.id}
            status={offer.status}
            ownerName={property.owner_name}
            ownerPhone={property.owner_phone}
            propertyTitle={property.title}
            buyerName={lead.full_name}
            amount={amount}
            currency={offer.currency}
            publicToken={offer.public_token}
          />

          {/* Buyer card */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Comprador
              </h3>
              <Link
                href={`/app/leads/${lead.id}`}
                className="text-[11px] text-steel hover:text-ink underline-offset-2 hover:underline"
              >
                Ver lead →
              </Link>
            </div>
            <div className="px-4 pb-3.5 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-bone-soft flex items-center justify-center text-[13px] font-medium text-steel shrink-0">
                  {lead.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium text-ink truncate">
                  {lead.full_name}
                </span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 py-1 text-[12px]">
                  <Phone className="h-[12px] w-[12px] text-steel" strokeWidth={1.5} />
                  <span className="text-ink font-mono text-[11px]">
                    {lead.phone}
                  </span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 py-1 text-[12px]">
                  <Mail className="h-[12px] w-[12px] text-steel" strokeWidth={1.5} />
                  <span className="text-ink text-[11px] truncate">
                    {lead.email}
                  </span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-bone-soft text-[11px] text-steel">
                Status:{' '}
                <span className="text-ink font-mono">{lead.status ?? '—'}</span>
                {lead.ai_score != null && (
                  <>
                    {' · '}score:{' '}
                    <span className="text-ink font-mono">{lead.ai_score}</span>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Owner card */}
          {(property.owner_name || property.owner_phone) && (
            <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
              <div className="px-4 pt-3.5 pb-2.5">
                <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                  Propietario
                </h3>
              </div>
              <div className="px-4 pb-3.5 space-y-1">
                {property.owner_name && (
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon
                      className="h-[14px] w-[14px] text-steel"
                      strokeWidth={1.5}
                    />
                    <span className="text-[13px] font-medium text-ink truncate">
                      {property.owner_name}
                    </span>
                  </div>
                )}
                {property.owner_phone && (
                  <div className="flex items-center gap-2 py-1 text-[12px]">
                    <Phone className="h-[12px] w-[12px] text-steel" strokeWidth={1.5} />
                    <span className="text-ink font-mono text-[11px]">
                      {property.owner_phone}
                    </span>
                  </div>
                )}
                {property.owner_email && (
                  <div className="flex items-center gap-2 py-1 text-[12px]">
                    <Mail className="h-[12px] w-[12px] text-steel" strokeWidth={1.5} />
                    <span className="text-ink text-[11px] truncate">
                      {property.owner_email}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Agent + meta */}
          {agent && (
            <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
              <div className="px-4 pt-3.5 pb-2.5">
                <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                  Agente
                </h3>
              </div>
              <div className="px-4 pb-3.5">
                <p className="text-[13px] text-ink font-medium">
                  {agent.full_name}
                </p>
                {agent.phone && (
                  <p className="font-mono text-[11px] text-steel mt-0.5">
                    {agent.phone}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-bone-soft text-[11px] text-steel space-y-1">
                  <div>
                    Creada:{' '}
                    <span className="text-ink font-mono">
                      {fmtDateLong(offer.created_at)}
                    </span>
                  </div>
                  <div>
                    Actualizada:{' '}
                    <span className="text-ink font-mono">
                      {fmtDateLong(offer.updated_at)}
                    </span>
                  </div>
                  {offer.deal_id && (
                    <div>
                      Operación:{' '}
                      <Link
                        href={`/app/operaciones/${offer.deal_id}`}
                        className="text-ink underline underline-offset-2"
                      >
                        Ver
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

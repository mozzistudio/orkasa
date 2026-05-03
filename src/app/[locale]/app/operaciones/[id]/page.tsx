import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OperacionStageSelector } from './operacion-stage-selector'
import { OperacionPropertiesPanel } from './operacion-properties-panel'
import { OperacionCloseActions } from './operacion-close-actions'
import type { Database } from '@/lib/database.types'

type Deal = Database['public']['Tables']['deals']['Row']
type LeadProperty = Database['public']['Tables']['lead_properties']['Row']
type Offer = Database['public']['Tables']['offers']['Row']
type Interaction = Database['public']['Tables']['lead_interactions']['Row']

const STAGE_LABEL: Record<string, string> = {
  contacto_inicial: 'Contacto inicial',
  visitas: 'Visitas',
  negociacion: 'Negociación',
  promesa_firmada: 'Promesa firmada',
  tramite_bancario: 'Trámite bancario',
  escritura_publica: 'Escritura pública',
  entrega_llaves: 'Entrega de llaves',
  post_cierre: 'Post cierre',
  closed_won: 'Cerrada · Ganada',
  closed_lost: 'Cerrada · Perdida',
}

function fmtMoney(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function OperacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .maybeSingle<Deal>()

  if (!deal) notFound()

  const [leadRes, leadPropsRes, offersRes, agentRes, allPropsRes] =
    await Promise.all([
      supabase
        .from('leads')
        .select('id, full_name, phone, email, status, ai_score, origin')
        .eq('id', deal.lead_id)
        .maybeSingle<{
          id: string
          full_name: string
          phone: string | null
          email: string | null
          status: string | null
          ai_score: number | null
          origin: string | null
        }>(),
      supabase
        .from('lead_properties')
        .select('*')
        .eq('deal_id', deal.id)
        .returns<LeadProperty[]>(),
      supabase
        .from('offers')
        .select('*')
        .eq('lead_id', deal.lead_id)
        .order('created_at', { ascending: false })
        .returns<Offer[]>(),
      deal.agent_id
        ? supabase
            .from('agents')
            .select('full_name, phone')
            .eq('id', deal.agent_id)
            .maybeSingle<{ full_name: string; phone: string | null }>()
        : Promise.resolve({ data: null }),
      supabase
        .from('properties')
        .select('id, title, address, city, neighborhood, price, currency, images')
        .eq('brokerage_id', deal.brokerage_id)
        .returns<
          Array<{
            id: string
            title: string
            address: string | null
            city: string | null
            neighborhood: string | null
            price: number | null
            currency: string | null
            images: unknown
          }>
        >(),
    ])

  const lead = leadRes.data
  const leadProperties = leadPropsRes.data ?? []
  const offers = offersRes.data ?? []
  const agent = agentRes.data
  const allProperties = allPropsRes.data ?? []

  const propertyById = new Map(allProperties.map((p) => [p.id, p]))

  // Interactions for the activity tab
  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', deal.lead_id)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<Interaction[]>()

  const consideredProperties = leadProperties.map((lp) => ({
    leadPropertyId: lp.id,
    propertyId: lp.property_id,
    title: propertyById.get(lp.property_id)?.title ?? 'Propiedad',
    price: propertyById.get(lp.property_id)?.price
      ? Number(propertyById.get(lp.property_id)!.price)
      : null,
    currency: propertyById.get(lp.property_id)?.currency ?? null,
    address:
      [
        propertyById.get(lp.property_id)?.neighborhood,
        propertyById.get(lp.property_id)?.city,
      ]
        .filter(Boolean)
        .join(', ') || null,
    status: lp.status,
    lostReason: lp.lost_reason,
    isWinning: deal.winning_property_id === lp.property_id,
  }))

  const propertiesNotInDeal = allProperties
    .filter((p) => !leadProperties.some((lp) => lp.property_id === p.id))
    .map((p) => ({ id: p.id, title: p.title }))

  const isClosed = deal.stage === 'closed_won' || deal.stage === 'closed_lost'

  return (
    <div className="mx-auto max-w-[1280px]">
      <Link
        href="/app/operaciones"
        className="inline-flex items-center gap-1.5 text-[12px] text-steel hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft className="h-[11px] w-[11px]" strokeWidth={1.5} />
        Volver a Operaciones
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Main column ── */}
        <div className="min-w-0 flex flex-col gap-4">
          {/* Hero */}
          <section className="rounded-[14px] border border-bone bg-paper overflow-hidden shadow-sm">
            <div className="px-6 py-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel">
                  Operación
                </span>
              </div>

              <h1 className="text-[26px] font-medium tracking-[-0.5px] leading-tight text-ink mb-1">
                {deal.title ?? `Operación ${lead?.full_name ?? ''}`}
              </h1>

              {lead && (
                <p className="text-[14px] text-steel mb-4">
                  Cliente:{' '}
                  <Link
                    href={`/app/leads/${lead.id}`}
                    className="text-ink font-medium hover:underline underline-offset-2"
                  >
                    {lead.full_name}
                  </Link>
                </p>
              )}

              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <OperacionStageSelector
                  dealId={deal.id}
                  currentStage={deal.stage}
                />
                {deal.amount && (
                  <span className="font-mono text-[20px] font-medium tabular-nums text-ink">
                    {fmtMoney(Number(deal.amount), deal.currency)}
                  </span>
                )}
              </div>

              {deal.winning_property_id && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-green-bg text-green-text text-[12px]">
                  <span className="font-mono text-[10px] tracking-[0.8px] uppercase font-medium">
                    Comprado:
                  </span>{' '}
                  <strong className="font-medium">
                    {propertyById.get(deal.winning_property_id)?.title ?? '—'}
                  </strong>
                </div>
              )}

              {deal.lost_reason && (
                <p className="mt-3 text-[12px] text-signal-deep">
                  Razón de cierre: {deal.lost_reason}
                </p>
              )}
            </div>
          </section>

          {/* Properties panel */}
          <OperacionPropertiesPanel
            dealId={deal.id}
            properties={consideredProperties}
            availableProperties={propertiesNotInDeal}
            disabled={isClosed}
          />

          {/* Offers list */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-bone-soft">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Ofertas · {offers.length}
              </h3>
            </div>
            <div className="px-4 py-3">
              {offers.length === 0 ? (
                <p className="py-2 text-[12px] text-steel text-center">
                  Sin ofertas aún en esta operación.
                </p>
              ) : (
                <div className="divide-y divide-bone-soft -mx-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="font-mono text-[14px] font-medium text-ink">
                            {fmtMoney(Number(offer.amount), offer.currency)}
                          </span>
                          <span className="ml-2 text-[12px] text-steel">
                            {offer.property_id
                              ? propertyById.get(offer.property_id)?.title ?? ''
                              : ''}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] tracking-[0.7px] uppercase text-steel">
                          {offer.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Activity */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Actividad reciente · {(interactions ?? []).length}
              </h3>
            </div>
            <div className="px-4 py-3">
              {(interactions ?? []).length === 0 ? (
                <p className="py-2 text-[12px] text-steel text-center">
                  Sin interacciones aún con este cliente.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(interactions ?? []).map((it) => (
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
          {/* Cliente */}
          {lead && (
            <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
              <div className="px-4 pt-3.5 pb-2.5">
                <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                  Cliente
                </h3>
              </div>
              <div className="px-4 pb-3.5 space-y-1">
                <Link
                  href={`/app/leads/${lead.id}`}
                  className="block text-[14px] font-medium text-ink hover:underline underline-offset-2 mb-2"
                >
                  {lead.full_name}
                </Link>
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
                  {lead.origin && (
                    <>
                      {' · '}origen:{' '}
                      <span className="text-ink font-mono">{lead.origin}</span>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Agente */}
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
              </div>
            </section>
          )}

          {/* Close actions */}
          {!isClosed && consideredProperties.length > 0 && (
            <OperacionCloseActions
              dealId={deal.id}
              currency={deal.currency}
              currentAmount={deal.amount ? Number(deal.amount) : null}
              properties={consideredProperties.map((p) => ({
                id: p.propertyId,
                title: p.title,
                price: p.price,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}

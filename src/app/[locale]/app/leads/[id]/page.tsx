import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Building2,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { LeadForm } from '@/components/app/lead-form'
import { LeadDeleteButton } from './delete-button'
import { AddInteractionForm } from './add-interaction-form'
import { updateLead } from '../actions'
import type { Database } from '@/lib/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type Interaction = Database['public']['Tables']['lead_interactions']['Row']
type Property = Database['public']['Tables']['properties']['Row']

type StoredImage = { path: string; url: string }

/** Cover URL extracted from the JSONB images field. */
function coverUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images[0] as StoredImage | undefined
  return first?.url ?? null
}

/**
 * Pick up to 3 properties that match the lead's interest property:
 * same neighborhood OR city, similar price (±25%), same property type,
 * active status, excluding the property of interest itself.
 */
function pickMatches(
  interest: Property | null,
  pool: Property[],
): Property[] {
  if (!interest) {
    // No anchor — surface 3 active properties as generic suggestions
    return pool
      .filter((p) => p.status === 'active' && p.id !== interest)
      .slice(0, 3)
  }
  const interestPrice = interest.price ? Number(interest.price) : null
  const minPrice = interestPrice ? interestPrice * 0.75 : 0
  const maxPrice = interestPrice ? interestPrice * 1.25 : Infinity

  return pool
    .filter((p) => p.id !== interest.id)
    .filter((p) => p.status === 'active')
    .filter((p) => {
      const sameLocation =
        (interest.neighborhood && p.neighborhood === interest.neighborhood) ||
        (interest.city && p.city === interest.city)
      const sameType = p.property_type === interest.property_type
      const priceFit = !p.price
        ? false
        : Number(p.price) >= minPrice && Number(p.price) <= maxPrice
      return (sameLocation || sameType) && priceFit
    })
    .sort((a, b) => {
      // Prefer same neighborhood, then same city, then highest score
      const aHood = a.neighborhood === interest.neighborhood ? 2 : 0
      const bHood = b.neighborhood === interest.neighborhood ? 2 : 0
      const aCity = a.city === interest.city ? 1 : 0
      const bCity = b.city === interest.city ? 1 : 0
      const aScore = a.ai_score ?? 0
      const bScore = b.ai_score ?? 0
      return bHood + bCity + bScore - (aHood + aCity + aScore)
    })
    .slice(0, 3)
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('leads')
  const { id } = await params
  const supabase = await createClient()

  const [leadRes, propertiesRes, agentsRes, interactionsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle<Lead>(),
    // Pull full property records — we need images, location, price for the card
    supabase
      .from('properties')
      .select(
        'id, title, property_type, listing_type, status, price, currency, ai_score, neighborhood, city, images, bedrooms, bathrooms, area_m2, address, brokerage_id, agent_id, country_code, created_at, updated_at, description, external_id, features, latitude, longitude',
      )
      .returns<Property[]>(),
    supabase
      .from('agents')
      .select('id, full_name')
      .returns<Array<{ id: string; full_name: string }>>(),
    supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .returns<Interaction[]>(),
  ])

  const lead = leadRes.data
  if (!lead) notFound()

  const updateWithId = updateLead.bind(null, id)

  const allProperties = propertiesRes.data ?? []
  const property = lead.property_id
    ? allProperties.find((p) => p.id === lead.property_id) ?? null
    : null
  const matches = pickMatches(property, allProperties)

  const assignedAgent = lead.assigned_agent_id
    ? (agentsRes.data ?? []).find((a) => a.id === lead.assigned_agent_id)
    : null

  const interactions = interactionsRes.data ?? []

  // The form expects `{id, title}[]` — slice the richer pool
  const propertiesForSelect = allProperties.map((p) => ({
    id: p.id,
    title: p.title,
  }))

  const dateLong = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('es-PA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/app/leads"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {t('title')}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-steel">
            [ {lead.id.slice(0, 8)} ]
          </p>
          <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink">
            {lead.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-steel">
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1.5 hover:text-signal"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {lead.email}
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 font-mono hover:text-signal"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                {lead.phone}
              </a>
            )}
          </div>
        </div>
        <LeadDeleteButton id={lead.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col: form + property + interactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property of interest — rich card */}
          <section className="rounded-[4px] border border-bone bg-paper">
            <header className="flex items-center justify-between border-b border-bone px-4 py-3">
              <div className="flex items-center gap-2">
                <Building2
                  className="h-4 w-4 text-ink"
                  strokeWidth={1.5}
                />
                <h3 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Propiedad de interés
                </h3>
              </div>
              {property && (
                <Link
                  href={`/app/properties/${property.id}`}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-steel transition-colors hover:text-signal"
                >
                  Ver ficha completa
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                </Link>
              )}
            </header>

            {property ? (
              <PropertyHeroCard property={property} t={t} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                <Building2
                  className="h-6 w-6 text-steel"
                  strokeWidth={1.5}
                />
                <p className="text-[13px] text-steel">
                  Sin propiedad asignada todavía. Asignala en el formulario para
                  ver matches.
                </p>
              </div>
            )}
          </section>

          {/* Matching properties */}
          {matches.length > 0 && (
            <section className="rounded-[4px] border border-bone bg-paper">
              <header className="flex items-center justify-between border-b border-bone px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="h-4 w-4 text-signal"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    Propiedades similares
                  </h3>
                  <span className="font-mono text-[11px] tabular-nums text-steel">
                    {matches.length}
                  </span>
                </div>
                {property && (
                  <p className="hidden font-mono text-[10px] uppercase tracking-wider text-steel md:block">
                    Mismo barrio o tipo · ±25% precio
                  </p>
                )}
              </header>
              <ul className="divide-y divide-bone">
                {matches.map((p) => (
                  <li key={p.id}>
                    <PropertyMatchRow property={p} t={t} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Edit form */}
          <div className="rounded-[4px] border border-bone bg-paper p-6">
            <LeadForm
              action={updateWithId}
              submitLabel={t('save')}
              defaults={{
                full_name: lead.full_name,
                email: lead.email,
                phone: lead.phone,
                origin: lead.origin,
                status: lead.status ?? 'new',
                property_id: lead.property_id,
                assigned_agent_id: lead.assigned_agent_id,
                ai_score: lead.ai_score,
                notes: lead.notes,
              }}
              properties={propertiesForSelect}
              agents={agentsRes.data ?? []}
            />
          </div>

          {/* Interactions */}
          <div className="rounded-[4px] border border-bone bg-paper">
            <div className="border-b border-bone px-4 py-3">
              <h3 className="text-[16px] font-medium tracking-[-0.3px] text-ink">
                {t('interaction.title')}
                <span className="ml-2 font-mono text-[11px] tabular-nums text-steel">
                  {interactions.length}
                </span>
              </h3>
            </div>
            <div className="p-4">
              <AddInteractionForm leadId={lead.id} />
            </div>
            <div className="border-t border-bone">
              {interactions.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-steel">
                  {t('interaction.empty')}
                </p>
              ) : (
                <ul className="divide-y divide-bone">
                  {interactions.map((it) => (
                    <li key={it.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                          {t(`interaction.type.${it.type}`, { fallback: it.type })}
                        </span>
                        <span className="font-mono text-[11px] text-steel">
                          {dateLong(it.created_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-ink">
                        {it.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right col: meta */}
        <div className="space-y-4">
          <SideCell label={t('table.status')}>
            <span className="font-mono text-[12px] uppercase tracking-wider text-ink">
              {t(`status.${lead.status ?? 'new'}`)}
            </span>
          </SideCell>
          <SideCell label={t('table.origin')}>
            <span className="font-mono text-[12px] uppercase tracking-wider text-steel">
              {t(`origin.${lead.origin}`)}
            </span>
          </SideCell>
          <SideCell label="Score IA">
            <span className="font-mono text-[18px] font-medium tabular-nums text-signal">
              {lead.ai_score ?? '—'}
            </span>
          </SideCell>
          <SideCell label={t('table.property')}>
            {property ? (
              <Link
                href={`/app/properties/${property.id}`}
                className="text-[13px] font-medium text-ink hover:text-signal"
              >
                {property.title}
              </Link>
            ) : (
              <span className="text-[13px] text-steel">{t('form.noProperty')}</span>
            )}
          </SideCell>
          <SideCell label={t('form.assignedAgent')}>
            <span className="text-[13px] text-ink">
              {assignedAgent?.full_name ?? t('form.noAssignment')}
            </span>
          </SideCell>
          <SideCell label="Creado">
            <span className="font-mono text-[11px] text-steel">
              {dateLong(lead.created_at)}
            </span>
          </SideCell>
        </div>
      </div>
    </div>
  )
}

function PropertyHeroCard({
  property,
  t,
}: {
  property: Property
  t: Awaited<ReturnType<typeof getTranslations<'leads'>>>
}) {
  const cover = coverUrl(property.images)
  const location = [property.neighborhood, property.city]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={`/app/properties/${property.id}`}
      className="block overflow-hidden transition-colors hover:bg-bone/30"
    >
      <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr] md:gap-5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-bone bg-coal md:aspect-square">
          {cover ? (
            <Image
              src={cover}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, 180px"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(0deg, transparent 49%, rgba(255,255,255,0.06) 50%, transparent 51%)',
                backgroundSize: '100% 16px',
              }}
            />
          )}
          {property.ai_score && (
            <div className="absolute right-2 top-2 rounded-[3px] bg-paper/90 px-1.5 py-0.5 font-mono text-[10px] font-medium text-signal backdrop-blur-sm">
              SCORE {property.ai_score}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex flex-col">
          <h4 className="text-[16px] font-medium tracking-[-0.2px] text-ink line-clamp-1">
            {property.title}
          </h4>
          {location && (
            <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-steel">
              <MapPin className="h-3 w-3" strokeWidth={1.5} />
              {location}
            </p>
          )}

          <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-bone pt-3">
            <Stat
              label="Tipo"
              value={t(`form.${property.property_type}`, {
                fallback: property.property_type,
              })}
            />
            <Stat
              label="Operación"
              value={property.listing_type === 'sale' ? 'Venta' : 'Alquiler'}
            />
            <Stat
              label="Precio"
              value={
                property.price
                  ? formatPrice(Number(property.price))
                  : '—'
              }
              accent
            />
            {property.bedrooms != null && (
              <Stat label="Dorm." value={property.bedrooms} />
            )}
            {property.bathrooms != null && (
              <Stat label="Baños" value={Number(property.bathrooms)} />
            )}
            {property.area_m2 != null && (
              <Stat
                label="Área"
                value={`${Number(property.area_m2)} m²`}
              />
            )}
          </dl>
        </div>
      </div>
    </Link>
  )
}

function PropertyMatchRow({
  property,
  t,
}: {
  property: Property
  t: Awaited<ReturnType<typeof getTranslations<'leads'>>>
}) {
  const cover = coverUrl(property.images)
  const location = [property.neighborhood, property.city]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={`/app/properties/${property.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bone/30"
    >
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[4px] border border-bone bg-coal">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">
          {property.title}
        </p>
        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-steel">
          {location || '—'} · {t(`form.${property.property_type}`, {
            fallback: property.property_type,
          })}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-[13px] tabular-nums font-medium text-ink">
          {property.price ? formatPrice(Number(property.price)) : '—'}
        </p>
        {property.ai_score != null && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-signal">
            score {property.ai_score}
          </p>
        )}
      </div>
    </Link>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-steel">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-mono text-[13px] tabular-nums ${
          accent ? 'font-medium text-ink' : 'text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function SideCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[4px] border border-bone bg-paper p-3">
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

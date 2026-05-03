import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  ArrowLeft,
  Phone,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { Composer } from './composer'
import { LeadTabs } from './lead-tabs'
import { LeadDeleteButton } from './delete-button'
import { TaskList } from './task-list'
import { getOpenTasksForLead } from '@/lib/tasks/trigger-engine'
import type { Database } from '@/lib/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type Interaction = Database['public']['Tables']['lead_interactions']['Row']
type Property = Database['public']['Tables']['properties']['Row']

type StoredImage = { path: string; url: string }

function coverUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images[0] as StoredImage | undefined
  return first?.url ?? null
}

function pickMatches(interest: Property | null, pool: Property[]): Property[] {
  if (!interest) {
    return pool
      .filter((p) => p.status === 'active')
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

const PIPELINE_STAGES = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'negotiating',
] as const

const PIPELINE_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contacto',
  qualified: 'Califi.',
  viewing_scheduled: 'Visita',
  negotiating: 'Cierre',
}

const STATUS_DISPLAY: Record<string, { label: string; style: string }> = {
  new: { label: 'Nuevo', style: 'bg-bone-soft text-steel' },
  contacted: { label: 'Contactado', style: 'bg-bone-soft text-steel' },
  qualified: { label: 'Calificado', style: 'bg-green-bg text-green-text' },
  viewing_scheduled: {
    label: 'Visita agendada',
    style: 'bg-amber-bg text-amber-text',
  },
  negotiating: {
    label: 'Negociando',
    style: 'bg-signal-bg text-signal-deep',
  },
  closed_won: { label: 'Cerrado ✓', style: 'bg-green-bg text-green-text' },
  closed_lost: { label: 'Perdido', style: 'bg-bone-soft text-steel-soft' },
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('leads')
  const { id } = await params
  const supabase = await createClient()

  const [leadRes, propertiesRes, agentsRes, interactionsRes] =
    await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle<Lead>(),
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

  const allProperties = propertiesRes.data ?? []
  const property = lead.property_id
    ? allProperties.find((p) => p.id === lead.property_id) ?? null
    : null
  const matches = pickMatches(property, allProperties)

  const agents = agentsRes.data ?? []
  const agentMap: Record<string, string> = {}
  for (const a of agents) agentMap[a.id] = a.full_name

  const assignedAgent = lead.assigned_agent_id
    ? agents.find((a) => a.id === lead.assigned_agent_id)
    : null

  const interactions = interactionsRes.data ?? []

  // Compute days since last contact
  const lastInteraction = interactions[0]
  const daysSinceContact = lastInteraction?.created_at
    ? Math.floor(
        (Date.now() - new Date(lastInteraction.created_at).getTime()) /
          86_400_000,
      )
    : null

  const isCooling = daysSinceContact !== null && daysSinceContact > 7

  // Pipeline index
  const status = lead.status ?? 'new'
  const pipelineIdx = PIPELINE_STAGES.indexOf(
    status as (typeof PIPELINE_STAGES)[number],
  )
  const statusDisplay = STATUS_DISPLAY[status] ?? STATUS_DISPLAY.new

  // Fetch DB-backed tasks
  const tasks = await getOpenTasksForLead(id)

  const dateLong = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('es-PA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—'

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Back link */}
      <Link
        href="/app/leads"
        className="inline-flex items-center gap-1.5 text-[12px] text-steel hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft className="h-[11px] w-[11px]" strokeWidth={1.5} />
        Volver a Clientes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Main column ── */}
        <div className="min-w-0 flex flex-col gap-4">
          {/* Hero Lead */}
          <section className="relative rounded-[14px] border border-bone bg-gradient-to-b from-paper to-paper-warm overflow-hidden">
            <div className="relative z-[1] px-6 py-6">
              {/* Status + meta */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`font-mono text-[10px] tracking-[1.3px] uppercase px-2.5 py-0.5 rounded-full font-medium ${statusDisplay.style}`}
                >
                  {statusDisplay.label}
                </span>
                {isCooling && (
                  <>
                    <span className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel">
                      ·
                    </span>
                    <span className="font-mono text-[10px] tracking-[1.3px] uppercase text-steel">
                      <span className="text-signal-deep font-medium">
                        {daysSinceContact} días sin contacto
                      </span>{' '}
                      — relanzá
                    </span>
                  </>
                )}
              </div>

              {/* Name + more button */}
              <div className="flex items-start justify-between gap-6 mb-2">
                <div>
                  <h1 className="text-[30px] font-medium tracking-[-0.6px] leading-tight text-ink mb-1">
                    {lead.full_name}
                  </h1>
                  <div className="text-[14px] text-steel flex items-center gap-1.5 flex-wrap">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-ink hover:underline"
                      >
                        {lead.phone}
                      </a>
                    )}
                    {lead.phone && lead.email && (
                      <span className="text-steel-soft">·</span>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-ink hover:underline"
                      >
                        {lead.email}
                      </a>
                    )}
                  </div>
                </div>
                <LeadDeleteButton id={lead.id} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-bone">
                {lead.phone && (
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[8px] bg-whatsapp text-white text-[13px] font-medium hover:bg-whatsapp-deep transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[8px] bg-ink text-white text-[13px] font-medium hover:bg-coal transition-colors"
                  >
                    <Phone
                      className="h-[13px] w-[13px]"
                      strokeWidth={1.6}
                    />
                    Llamar
                  </a>
                )}
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[8px] bg-white text-ink border border-bone text-[13px] font-medium hover:border-steel-soft transition-colors"
                >
                  <Calendar
                    className="h-[13px] w-[13px]"
                    strokeWidth={1.5}
                  />
                  Agendar visita
                </button>
              </div>
            </div>
          </section>

          {/* Composer */}
          <Composer leadId={lead.id} />

          {/* Main Tabs (Historia / Propiedades) */}
          <LeadTabs
            interactions={interactions}
            agentMap={agentMap}
            property={property}
            matches={matches}
          />

          {/* ── Tareas — standalone div, NOT a tab ── */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-5 py-3.5 border-b border-bone flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-ink"
                >
                  <rect x="2" y="3" width="12" height="11" rx="1" />
                  <path d="M5 7l2 2 4-4" />
                </svg>
                <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                  Tareas
                </h3>
                {tasks.length > 0 && (
                  <span className="font-mono text-[10px] px-1.5 py-px rounded-full bg-ink text-white">
                    {tasks.length}
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-2 pb-5">
              <TaskList
                tasks={tasks}
                leadName={lead.full_name}
                agentName={assignedAgent?.full_name}
              />
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <div className="hidden lg:flex flex-col gap-3.5 sticky top-[76px]">
          {/* About card */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5 flex justify-between items-center">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                Sobre {lead.full_name.split(' ')[0]}
              </h3>
            </div>
            <div className="px-4 pb-3.5">
              <AboutRow label="Cliente desde" value={dateLong(lead.created_at)} mono />
              <AboutRow
                label="Origen"
                value={
                  <span className="font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full bg-bone-soft text-steel">
                    {t(`origin.${lead.origin}`)}
                  </span>
                }
              />
              <AboutRow
                label="Asignado a"
                value={assignedAgent?.full_name ?? '—'}
              />
              <AboutRow label="Score IA" value={lead.ai_score != null ? String(lead.ai_score) : '—'} mono />
            </div>
          </section>

          {/* Pipeline card */}
          <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
            <div className="px-4 pt-3.5 pb-2.5">
              <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
                En el pipeline
              </h3>
            </div>
            <div className="px-4 pb-4">
              {/* Stage bars */}
              <div className="flex gap-[3px] mb-2.5">
                {PIPELINE_STAGES.map((stage, i) => (
                  <div
                    key={stage}
                    className={`flex-1 h-[5px] rounded-[2px] ${
                      i < pipelineIdx
                        ? 'bg-ink'
                        : i === pipelineIdx
                          ? 'bg-signal'
                          : 'bg-bone'
                    }`}
                  />
                ))}
              </div>
              {/* Labels */}
              <div className="flex justify-between font-mono text-[10px] tracking-[0.4px] text-steel-soft">
                {PIPELINE_STAGES.map((stage, i) => (
                  <span
                    key={stage}
                    className={
                      i === pipelineIdx
                        ? 'text-signal font-medium'
                        : undefined
                    }
                  >
                    {PIPELINE_LABELS[stage]}
                  </span>
                ))}
              </div>
              {/* Current info */}
              {daysSinceContact !== null && (
                <div className="mt-3.5 px-3 py-2.5 bg-paper-warm rounded-[7px] text-[12px] text-steel leading-normal">
                  Lleva{' '}
                  <strong className="text-ink font-medium">
                    {daysSinceContact} días
                  </strong>{' '}
                  en {statusDisplay.label}.
                  {interactions.length > 0 &&
                    ` ${interactions.length} interacciones registradas.`}
                </div>
              )}
            </div>
          </section>

          {/* Technical details (collapsible) */}
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

// ── Helper: About row ──

function AboutRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-[7px] text-[12px] items-center">
      <span className="text-steel">{label}</span>
      <span
        className={`text-ink text-right ${mono ? 'font-mono text-[11px]' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}


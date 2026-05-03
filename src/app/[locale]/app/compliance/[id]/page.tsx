import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import {
  computeDossierState,
  getDocHumanName,
  formatRelativeEs,
  screeningFlagToHumanQuestion,
  type DossierState,
} from '@/lib/compliance-copy'
import { DossierBanner } from '@/components/compliance/detail/dossier-banner'
import { DealHeaderCard } from '@/components/compliance/detail/deal-header-card'
import { FaltaSection } from '@/components/compliance/detail/falta-section'
import { TenemosSection } from '@/components/compliance/detail/tenemos-section'
import { ClientMiniCard } from '@/components/compliance/detail/client-mini-card'
import { RelatedPropertyCard } from '@/components/compliance/detail/related-property-card'
import { DossierTimeline, type TimelineEvent } from '@/components/compliance/detail/dossier-timeline'
import { TechnicalDetailsFold } from '@/components/compliance/detail/technical-details-fold'
import type { TodoItem } from '@/components/compliance/detail/todo-row'
import type { VerifiedDoc } from '@/components/compliance/detail/verified-doc-row'

type Check = Database['public']['Tables']['compliance_checks']['Row']
type Document = Database['public']['Tables']['compliance_documents']['Row']
type AuditEntry = Database['public']['Tables']['compliance_audit_log']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Agent = Database['public']['Tables']['agents']['Row']
type Interaction = Database['public']['Tables']['lead_interactions']['Row']

const INTERACTION_TO_TIMELINE: Record<
  string,
  { variant: TimelineEvent['variant']; label: string }
> = {
  visit: { variant: 'created', label: 'registró una visita' },
  call: { variant: 'requested', label: 'registró una llamada' },
  whatsapp: { variant: 'uploaded', label: 'envió por WhatsApp' },
  email: { variant: 'requested', label: 'envió un email' },
  note: { variant: 'default', label: 'agregó una nota' },
}

const ACTION_TO_TIMELINE: Record<
  string,
  { variant: TimelineEvent['variant']; text: (details?: unknown, actor?: string) => string }
> = {
  status_changed: {
    variant: 'verified',
    text: (_d, actor) =>
      actor
        ? `<strong>${actor}</strong> actualizó el estado del expediente`
        : 'Se actualizó el estado del expediente',
  },
  notes_updated: {
    variant: 'default',
    text: (_d, actor) =>
      actor
        ? `<strong>${actor}</strong> actualizó las notas`
        : 'Se actualizaron las notas',
  },
  doc_uploaded: {
    variant: 'uploaded',
    text: (details) => {
      const d = details as { kind?: string; fileName?: string }
      const name = getDocHumanName({ kind: d.kind ?? null, name: null })
      return `Cliente subió ${name.toLowerCase()}`
    },
  },
  doc_verified: {
    variant: 'verified',
    text: (details, actor) => {
      const d = details as { kind?: string }
      const name = getDocHumanName({ kind: d.kind ?? null, name: null })
      return actor
        ? `<strong>${actor}</strong> verificó ${name.toLowerCase()}`
        : `Se verificó ${name.toLowerCase()}`
    },
  },
  doc_rejected: {
    variant: 'flagged',
    text: (details, actor) => {
      const d = details as { kind?: string }
      const name = getDocHumanName({ kind: d.kind ?? null, name: null })
      return actor
        ? `<strong>${actor}</strong> rechazó ${name.toLowerCase()}`
        : `Se rechazó ${name.toLowerCase()}`
    },
  },
  whatsapp_reminder_sent: {
    variant: 'requested',
    text: (_d, actor) =>
      actor
        ? `<strong>${actor}</strong> mandó recordatorio por WhatsApp`
        : `Se mandó un recordatorio por WhatsApp`,
  },
  reminder_postponed: {
    variant: 'default',
    text: () => 'Recordatorio aplazado',
  },
  screening_rerun: {
    variant: 'flagged',
    text: () => 'Se re-ejecutó el screening automático',
  },
  dossier_approved: {
    variant: 'verified',
    text: (_d, actor) =>
      actor
        ? `<strong>${actor}</strong> aprobó el deal`
        : 'Se aprobó el deal',
  },
  dossier_rejected: {
    variant: 'flagged',
    text: (_d, actor) =>
      actor
        ? `<strong>${actor}</strong> rechazó el deal`
        : 'Se rechazó el deal',
  },
  flag_pep_cleared: {
    variant: 'verified',
    text: (details, actor) => {
      const d = details as { answer?: string }
      const answerText = d.answer === 'no'
        ? 'sin parientes en cargos públicos'
        : 'con parientes en cargos públicos — declaración pendiente'
      return actor
        ? `<strong>${actor}</strong> aclaró la pregunta PEP — ${answerText}`
        : `Se aclaró la pregunta PEP — ${answerText}`
    },
  },
  flag_high_amount_cleared: {
    variant: 'verified',
    text: (_d, actor) =>
      actor
        ? `<strong>${actor}</strong> reportó la operación a la UAF`
        : 'Se reportó la operación a la UAF',
  },
  flag_ubo_cleared: {
    variant: 'verified',
    text: (_d, actor) =>
      actor
        ? `<strong>${actor}</strong> verificó el beneficiario final`
        : 'Se verificó el beneficiario final',
  },
  created: {
    variant: 'created',
    text: () => 'Expediente abierto al pasar a <strong>Negociando</strong>',
  },
}

export default async function ComplianceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('id', id)
    .maybeSingle<Check>()

  if (!check) notFound()

  const [leadRes, docsRes, auditRes, agentsRes] = await Promise.all([
    check.lead_id
      ? supabase
          .from('leads')
          .select('*')
          .eq('id', check.lead_id)
          .maybeSingle<Lead>()
      : Promise.resolve({ data: null }),
    supabase
      .from('compliance_documents')
      .select('*')
      .eq('check_id', id)
      .order('created_at')
      .returns<Document[]>(),
    supabase
      .from('compliance_audit_log')
      .select('*')
      .eq('check_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<AuditEntry[]>(),
    supabase.from('agents').select('id, full_name').returns<Pick<Agent, 'id' | 'full_name'>[]>(),
  ])

  const lead = leadRes.data
  const documents = docsRes.data ?? []
  const audit = auditRes.data ?? []
  const agents = agentsRes.data ?? []

  // Pull lead interactions (visits, calls, notes, etc.) so they show up in
  // the dossier Historia alongside compliance audit events.
  const interactions: Interaction[] = lead
    ? (
        await supabase
          .from('lead_interactions')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false })
          .limit(20)
          .returns<Interaction[]>()
      ).data ?? []
    : []

  // Property lookup — fetch enough fields to render the related-property card
  let property: Property | null = null
  if (lead?.property_id) {
    const { data } = await supabase
      .from('properties')
      .select(
        'id, title, price, listing_type, neighborhood, city, bedrooms, bathrooms, area_m2, images',
      )
      .eq('id', lead.property_id)
      .maybeSingle<Property>()
    property = data ?? null
  }

  // Other deals count
  let otherDealsCount = 0
  if (lead) {
    const { count } = await supabase
      .from('compliance_checks')
      .select('id', { count: 'exact', head: true })
      .eq('lead_id', lead.id)
      .neq('id', id)
    otherDealsCount = count ?? 0
  }

  // Compute state
  const requiredDocs = documents.filter((d) => d.is_required !== false)
  const verifiedDocs = documents.filter((d) => d.status === 'verified')
  const missingRequired = requiredDocs.filter((d) => d.status !== 'verified')
  const optionalDocs = documents.filter((d) => d.is_required === false)

  // Build pending questions from screening flags. A flag stays "pending" until
  // the broker explicitly clears it via the PEP modal (logged as
  // `flag_pep_cleared` in the audit trail). Once cleared, the dossier moves
  // from `incomplete` → `flagged` (banner) and broker can approve with
  // justification.
  const clearedFlags = new Set(
    audit
      .filter((a) => a.action.startsWith('flag_') && a.action.endsWith('_cleared'))
      .map((a) => a.action.replace(/^flag_(.+)_cleared$/, '$1')),
  )
  const pendingQuestions: Array<{ flagType: 'pep' | 'high_amount' | 'ubo' }> = []
  if (check.pep_match && !clearedFlags.has('pep')) {
    pendingQuestions.push({ flagType: 'pep' })
  }

  const state: DossierState = computeDossierState({
    sanctionsMatch: check.sanctions_match ?? false,
    pepMatch: check.pep_match ?? false,
    documents,
    pendingQuestions: pendingQuestions.length,
  })

  const missingCount = missingRequired.length + pendingQuestions.length
  const totalRequired = requiredDocs.length + pendingQuestions.length

  // Build todo items
  const todoItems: TodoItem[] = []

  // Missing docs
  for (const doc of missingRequired) {
    const name = getDocHumanName(doc)
    todoItems.push({
      id: `doc-${doc.id}`,
      variant: 'missing-doc',
      title: `Pedirle a ${lead?.full_name?.split(' ')[0] ?? 'tu cliente'} ${name.toLowerCase()}`,
      meta: doc.created_at
        ? {
            askedAt: `Pedido el ${formatRelativeEs(doc.created_at)}`,
            daysSilent: doc.uploaded_at
              ? 0
              : Math.max(
                  0,
                  Math.floor(
                    (Date.now() - new Date(doc.created_at).getTime()) /
                      (1000 * 60 * 60 * 24),
                  ),
                ),
          }
        : undefined,
      explainer: doc.description ?? 'Documento necesario para avanzar con el trámite.',
      docName: name,
      leadId: lead?.id,
    })
  }

  // PEP / sanctions / etc.
  for (const q of pendingQuestions) {
    const flag = screeningFlagToHumanQuestion[
      q.flagType === 'pep' ? 'pep_match'
      : 'sanctions_match'
    ]
    todoItems.push({
      id: `flag-${q.flagType}`,
      variant: flag.icon,
      flagType: q.flagType,
      title: flag.title(lead?.full_name ?? 'tu cliente'),
      explainer: flag.explainer,
      leadId: lead?.id,
    })
  }

  // Verified docs
  const agentsById = new Map(agents.map((a) => [a.id, a.full_name]))
  const verifiedDocsList: VerifiedDoc[] = verifiedDocs.map((doc) => {
    const verifierName = doc.verified_by ? agentsById.get(doc.verified_by) : null
    const detail = verifierName
      ? `Verificada por <span class="text-ink">${verifierName}</span> · ${formatRelativeEs(doc.verified_at)}`
      : `Verificada <span class="text-ink">automáticamente</span> · ${formatRelativeEs(doc.verified_at)}`
    return {
      id: doc.id,
      humanName: getDocHumanName(doc),
      detail,
    }
  })

  // Build timeline from audit log + lead interactions, merged.
  const timelineEvents: TimelineEvent[] = audit.map((entry) => {
    const config = ACTION_TO_TIMELINE[entry.action]
    const actorName = entry.agent_id ? agentsById.get(entry.agent_id) : null
    return {
      id: `audit-${entry.id}`,
      text: config
        ? config.text(entry.details, actorName ?? undefined)
        : entry.action.replace(/_/g, ' '),
      time: entry.created_at,
      variant: config?.variant ?? 'default',
    }
  })

  for (const it of interactions) {
    const cfg = INTERACTION_TO_TIMELINE[it.type]
    if (!cfg) continue
    const actorName = it.agent_id ? agentsById.get(it.agent_id) : null
    timelineEvents.push({
      id: `int-${it.id}`,
      text: actorName
        ? `<strong>${actorName}</strong> ${cfg.label}`
        : cfg.label.charAt(0).toUpperCase() + cfg.label.slice(1),
      time: it.created_at,
      variant: cfg.variant,
    })
  }

  // Add the check creation as the last event if there's no audit-logged
  // 'created' event for it.
  const hasCreatedEvent = audit.some((a) => a.action === 'created')
  if (!hasCreatedEvent && check.created_at) {
    timelineEvents.push({
      id: 'created',
      text: 'Expediente abierto al pasar a <strong>Negociando</strong>',
      time: check.created_at,
      variant: 'created',
    })
  }

  // Sort merged events by time desc, take top 15
  timelineEvents.sort((a, b) => {
    const ta = a.time ? new Date(a.time).getTime() : 0
    const tb = b.time ? new Date(b.time).getTime() : 0
    return tb - ta
  })
  timelineEvents.splice(15)

  // Banner reason for flagged state
  let flagReason: string | null = null
  if (state === 'flagged' && check.pep_match && !pendingQuestions.length) {
    flagReason = `${lead?.full_name ?? 'El cliente'} podría ser familiar de un funcionario público — necesitamos confirmar antes de aprobar.`
  }

  // Reviewer for ready banner
  const reviewerName = check.reviewed_by ? agentsById.get(check.reviewed_by) ?? null : null

  return (
    <div className="mx-auto max-w-[1320px]">
      {/* Back link */}
      <Link
        href="/app/compliance"
        className="mb-3.5 inline-flex items-center gap-1.5 text-[12px] text-steel hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Volver a Cumplimiento
      </Link>

      {/* Banner — only for ready or flagged states */}
      {state === 'ready' && (
        <div className="mb-4">
          <DossierBanner
            state="ready"
            checkId={id}
            dealValue={Number(property?.price ?? 0)}
            reviewerName={reviewerName}
            reviewedAt={check.reviewed_at}
            flagReason={null}
          />
        </div>
      )}
      {state === 'flagged' && (
        <div className="mb-4">
          <DossierBanner
            state="flagged"
            checkId={id}
            dealValue={Number(property?.price ?? 0)}
            reviewerName={reviewerName}
            reviewedAt={check.reviewed_at}
            flagReason={flagReason}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-4">
          <DealHeaderCard
            checkId={id}
            clientName={lead?.full_name ?? 'Cliente'}
            clientPhone={lead?.phone ?? null}
            propertyTitle={property?.title ?? 'Propiedad'}
            propertyId={property?.id ?? null}
            dealValue={Number(property?.price ?? 0)}
            scenario={check.scenario ?? 'sale_buyer'}
            state={state}
            missingCount={missingCount}
            totalRequired={totalRequired}
          />

          {todoItems.length > 0 && (
            <FaltaSection
              items={todoItems}
              clientName={lead?.full_name ?? 'tu cliente'}
              clientPhone={lead?.phone ?? null}
              propertyTitle={property?.title ?? 'la propiedad'}
              checkId={id}
            />
          )}

          <TenemosSection
            verifiedDocs={verifiedDocsList}
            optionalDocsCount={optionalDocs.length}
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {lead && (
            <ClientMiniCard
              leadId={lead.id}
              clientName={lead.full_name}
              clientPhone={lead.phone}
              createdAt={lead.created_at}
              origin={lead.origin}
              assignedAgentName={
                lead.assigned_agent_id
                  ? agentsById.get(lead.assigned_agent_id) ?? null
                  : null
              }
              otherDealsCount={otherDealsCount}
              propertyTitle={property?.title ?? ''}
            />
          )}

          {property && (
            <RelatedPropertyCard
              propertyId={property.id}
              title={property.title}
              neighborhood={property.neighborhood}
              city={property.city}
              price={property.price ? Number(property.price) : null}
              listingType={
                (property.listing_type as 'sale' | 'rent' | null) ?? null
              }
              bedrooms={property.bedrooms}
              bathrooms={
                property.bathrooms != null ? Number(property.bathrooms) : null
              }
              areaM2={
                property.area_m2 != null ? Number(property.area_m2) : null
              }
              images={property.images}
            />
          )}

          <DossierTimeline events={timelineEvents} />

          <TechnicalDetailsFold
            details={{
              dossierId: `${(check.type ?? 'kyc').toUpperCase()}-${check.id.slice(0, 8).toUpperCase()}`,
              type:
                check.type === 'kyc' ? 'KYC base + SOF'
                : check.type === 'aml' ? 'AML reforzado'
                : check.type === 'sanctions' ? 'Sanciones'
                : 'PEP screening',
              ofacClean: !(check.sanctions_match ?? false),
              pepMatch: check.pep_match ?? false,
              pepScore: check.pep_match ? 87 : null,
              dueAt: check.due_at,
              legalFramework: 'Ley 23/2015',
            }}
          />
        </aside>
      </div>
    </div>
  )
}

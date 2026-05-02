import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileDown,
  Shield,
  History,
  Settings as SettingsIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { ComplianceHeader } from '@/components/compliance/compliance-header'
import { AwaitingClientPanel } from '@/components/compliance/awaiting-client-panel'
import { AwaitingBrokerPanel } from '@/components/compliance/awaiting-broker-panel'
import { DealBoard } from '@/components/compliance/deal-board'
import type {
  AwaitingClientItem,
  AwaitingBrokerItem,
  DealCardData,
  DealSeverity,
  CheckProgress,
} from '@/components/compliance/types'
import type { DocumentReminderType } from '@/lib/whatsapp-templates'

type Check = Database['public']['Tables']['compliance_checks']['Row']
type Doc = Database['public']['Tables']['compliance_documents']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Agent = Database['public']['Tables']['agents']['Row']

type OwnerFilter = 'todos' | 'mine' | 'team'
type ViewMode = 'kanban' | 'list'

// ── Human-readable status derivation ────────────────────────────────

type HumanStatus = {
  label: string
  description: string
  severity: DealSeverity
  awaitingParty: 'client' | 'broker' | 'system'
}

function docKindToReminderType(kind: string | null): DocumentReminderType {
  switch (kind) {
    case 'identity':
      return 'identity'
    case 'income_proof':
      return 'income_proof'
    case 'funds_origin':
      return 'funds_origin'
    case 'company_ubo':
      return 'company_ubo'
    default:
      return 'identity'
  }
}

type DocSlice = Pick<
  Doc,
  'id' | 'check_id' | 'name' | 'kind' | 'status' | 'is_required' | 'code' | 'updated_at'
> & { created_at?: string | null }

function humanize(
  checks: Check[],
  docs: DocSlice[],
  propertyPrice: number | null,
): HumanStatus {
  for (const c of checks) {
    if (c.sanctions_match) {
      return {
        label: 'Aparece en una lista internacional',
        description:
          'No podemos avanzar — necesita revisión legal antes de seguir.',
        severity: 'blocked',
        awaitingParty: 'broker',
      }
    }
  }

  for (const c of checks) {
    if (c.pep_match) {
      return {
        label: 'Posible familiar de funcionario',
        description:
          'El sistema lo marcó. Necesitamos preguntarle un poco más.',
        severity: 'waiting',
        awaitingParty: 'broker',
      }
    }
  }

  for (const c of checks) {
    if (c.status === 'rejected') {
      return {
        label: 'Rechazado — necesita revisión',
        description: 'Un check fue rechazado. Revisá el dossier.',
        severity: 'blocked',
        awaitingParty: 'broker',
      }
    }
  }

  const requiredDocs = docs.filter((d) => d.is_required)
  const expiredDocs = requiredDocs.filter((d) => d.status === 'expired')
  if (expiredDocs.length > 0) {
    const updatedAt = expiredDocs[0].updated_at ?? expiredDocs[0].created_at
    const days = updatedAt
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(updatedAt).getTime()) / 86400000,
          ),
        )
      : 1
    return {
      label: `Cédula vencida hace ${days} días`,
      description:
        'El cliente no la ha mandado todavía. Mandale un recordatorio.',
      severity: 'blocked',
      awaitingParty: 'client',
    }
  }

  const uboMissing = requiredDocs.some(
    (d) => d.kind === 'company_ubo' && d.status === 'pending',
  )
  if (uboMissing) {
    return {
      label: 'Falta saber quién es el dueño real',
      description:
        'Es una empresa offshore — necesitamos un papel que diga el nombre del dueño.',
      severity: 'blocked',
      awaitingParty: 'client',
    }
  }

  const pendingDocs = requiredDocs.filter(
    (d) => d.status === 'pending' || d.status === 'rejected',
  )
  if (pendingDocs.length > 0) {
    return {
      label: 'Esperando documentos del cliente',
      description:
        'Le pediste los papeles. Si no llegan en 3 días, te aviso.',
      severity: 'waiting',
      awaitingParty: 'client',
    }
  }

  const needsBrokerReview = checks.some(
    (c) => c.status === 'requires_action' || c.status === 'in_review',
  )
  if (needsBrokerReview) {
    if (
      propertyPrice != null &&
      propertyPrice >= 100_000 &&
      checks.some((c) => c.type === 'aml')
    ) {
      return {
        label: 'Operación > $100K — UAF activa',
        description:
          'Es estándar para montos altos. Ya estamos completando los formularios.',
        severity: 'waiting',
        awaitingParty: 'broker',
      }
    }
    return {
      label: 'En revisión',
      description: 'Tu admin lo subió. Revisalo cuando puedas.',
      severity: 'waiting',
      awaitingParty: 'broker',
    }
  }

  const allApproved = checks.every((c) => c.status === 'approved')
  if (allApproved && checks.length > 0) {
    return {
      label: 'Todo listo · solo falta tu firma',
      description: 'Verificado y listo para cerrar.',
      severity: 'ready',
      awaitingParty: 'broker',
    }
  }

  return {
    label: 'En proceso',
    description: 'Los checks están avanzando.',
    severity: 'waiting',
    awaitingParty: 'system',
  }
}

// ── Timing helpers ──────────────────────────────────────────────────

function timingLabel(dueAt: string | null, severity: DealSeverity): { label: string; urgent: boolean } {
  if (!dueAt) {
    if (severity === 'ready') return { label: 'Listo', urgent: false }
    return { label: '', urgent: false }
  }

  const now = Date.now()
  const due = new Date(dueAt).getTime()
  const diffMs = due - now
  const diffDays = Math.ceil(diffMs / 86400000)

  if (diffDays < 0) {
    return { label: `Atrasado ${Math.abs(diffDays)} días`, urgent: true }
  }
  if (diffDays === 0) {
    return { label: 'Vence hoy', urgent: true }
  }
  if (diffDays === 1) {
    return { label: 'Vence en 1 día', urgent: true }
  }
  return { label: `${diffDays} días para firmar`, urgent: false }
}

// ── Build checklist from docs ───────────────────────────────────────

function buildProgress(docs: DocSlice[]): CheckProgress[] {
  const required = docs.filter((d) => d.is_required)
  if (required.length === 0) return []

  return required.slice(0, 3).map((d) => {
    let status: CheckProgress['status'] = 'todo'
    if (d.status === 'verified') status = 'done'
    else if (d.status === 'rejected' || d.status === 'expired') status = 'fail'
    return {
      label: d.name ?? d.kind ?? 'Documento',
      status,
    }
  })
}

// ── Page ─────────────────────────────────────────────────────────────

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; owner?: string }>
}) {
  const params = await searchParams
  const view: ViewMode = params.view === 'list' ? 'list' : 'kanban'
  const owner: OwnerFilter = (['todos', 'mine', 'team'] as const).includes(
    params.owner as OwnerFilter,
  )
    ? (params.owner as OwnerFilter)
    : 'todos'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentAgent } = await supabase
    .from('agents')
    .select('id, full_name, role, brokerage_id')
    .eq('id', user.id)
    .maybeSingle<Pick<Agent, 'id' | 'full_name' | 'role' | 'brokerage_id'>>()

  if (!currentAgent) redirect('/login')

  // ── Parallel data fetch ──────────────────────────────────────────

  const [checksRes, leadsRes, propsRes, docsRes, agentsRes] =
    await Promise.all([
      supabase
        .from('compliance_checks')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Check[]>(),
      supabase
        .from('leads')
        .select(
          'id, full_name, email, phone, property_id, assigned_agent_id, status',
        )
        .returns<
          Pick<
            Lead,
            | 'id'
            | 'full_name'
            | 'email'
            | 'phone'
            | 'property_id'
            | 'assigned_agent_id'
            | 'status'
          >[]
        >(),
      supabase
        .from('properties')
        .select('id, title, price, currency, listing_type, neighborhood, city')
        .returns<
          Pick<
            Property,
            | 'id'
            | 'title'
            | 'price'
            | 'currency'
            | 'listing_type'
            | 'neighborhood'
            | 'city'
          >[]
        >(),
      supabase
        .from('compliance_documents')
        .select(
          'id, check_id, name, kind, status, is_required, code, updated_at',
        )
        .returns<
          Pick<
            Doc,
            | 'id'
            | 'check_id'
            | 'name'
            | 'kind'
            | 'status'
            | 'is_required'
            | 'code'
            | 'updated_at'
          >[]
        >(),
      supabase
        .from('agents')
        .select('id, full_name')
        .returns<Pick<Agent, 'id' | 'full_name'>[]>(),
    ])

  const checks = checksRes.data ?? []
  const leads = leadsRes.data ?? []
  const properties = propsRes.data ?? []
  const docs = docsRes.data ?? []
  const agents = agentsRes.data ?? []

  const leadsById = new Map(leads.map((l) => [l.id, l]))
  const propsById = new Map(properties.map((p) => [p.id, p]))
  const agentsById = new Map(agents.map((a) => [a.id, a]))

  // Group docs by check_id
  const docsByCheckId = new Map<string, typeof docs>()
  for (const d of docs) {
    const arr = docsByCheckId.get(d.check_id) ?? []
    arr.push(d)
    docsByCheckId.set(d.check_id, arr)
  }

  // ── Group checks by lead_id to form "deals" ──────────────────────

  const checksByLeadId = new Map<string, Check[]>()
  for (const c of checks) {
    if (!c.lead_id) continue
    const arr = checksByLeadId.get(c.lead_id) ?? []
    arr.push(c)
    checksByLeadId.set(c.lead_id, arr)
  }

  const awaitingClientItems: AwaitingClientItem[] = []
  const awaitingBrokerItems: AwaitingBrokerItem[] = []
  const blockedDeals: DealCardData[] = []
  const waitingDeals: DealCardData[] = []
  const readyDeals: DealCardData[] = []

  for (const [leadId, leadChecks] of checksByLeadId) {
    const lead = leadsById.get(leadId)
    if (!lead) continue

    const prop = lead.property_id ? propsById.get(lead.property_id) : null
    const propertyTitle = prop
      ? `${prop.neighborhood ?? prop.city ?? ''} ${prop.title ?? ''}`.trim()
      : 'Sin propiedad'
    const propertyPrice = prop?.price ? Number(prop.price) : null
    const listingType = (prop?.listing_type as 'sale' | 'rent' | null) ?? null

    // Collect all docs for this deal
    const dealDocs: DocSlice[] = []
    for (const c of leadChecks) {
      const cd = docsByCheckId.get(c.id)
      if (cd) dealDocs.push(...cd)
    }

    const status = humanize(leadChecks, dealDocs, propertyPrice)
    const requiredDocs = dealDocs.filter((d) => d.is_required)
    const pendingDocs = requiredDocs.filter(
      (d) =>
        d.status === 'pending' ||
        d.status === 'rejected' ||
        d.status === 'expired',
    )
    const doneDocs = requiredDocs.filter((d) => d.status === 'verified')

    const firstPendingKind = pendingDocs[0]?.kind ?? null
    const pendingDocType = docKindToReminderType(firstPendingKind)

    // Determine nearest due date across checks
    const dueDates = leadChecks
      .filter((c) => c.due_at && c.status !== 'approved')
      .map((c) => c.due_at!)
    const nearestDue = dueDates.length > 0 ? dueDates.sort()[0] : null
    const timing = timingLabel(nearestDue, status.severity)

    const assignedAgent = lead.assigned_agent_id
      ? agentsById.get(lead.assigned_agent_id)
      : null

    const progress = buildProgress(dealDocs)

    const dealCard: DealCardData = {
      leadId,
      leadName: lead.full_name,
      phone: lead.phone,
      propertyTitle,
      propertyPrice,
      listingType,
      severity: status.severity,
      statusLabel: status.label,
      statusDescription: status.description,
      checkIds: leadChecks.map((c) => c.id),
      assignedAgentId: lead.assigned_agent_id,
      assignedAgentName: assignedAgent?.full_name ?? null,
      progress,
      progressDone: doneDocs.length,
      progressTotal: Math.max(requiredDocs.length, 4),
      timingLabel: timing.label,
      timingUrgent: timing.urgent,
      pendingDocType,
    }

    // Partition
    if (status.severity === 'blocked') blockedDeals.push(dealCard)
    else if (status.severity === 'ready') readyDeals.push(dealCard)
    else waitingDeals.push(dealCard)

    // Action panels
    if (status.awaitingParty === 'client' && pendingDocs.length > 0) {
      const timingVariant: 'late' | 'soon' | 'ok' = timing.urgent
        ? 'late'
        : nearestDue
          ? 'soon'
          : 'ok'

      awaitingClientItems.push({
        leadId,
        leadName: lead.full_name,
        phone: lead.phone,
        pendingDocNames: pendingDocs.map(
          (d) => d.name ?? d.kind ?? 'documento',
        ),
        pendingDocType,
        propertyTitle,
        propertyPrice,
        listingType,
        timingLabel: timing.label,
        timingVariant,
      })
    }

    if (status.awaitingParty === 'broker' && status.severity !== 'blocked') {
      const isReady = status.severity === 'ready'
      const timingVariant: 'late' | 'soon' | 'ok' = isReady
        ? 'ok'
        : timing.urgent
          ? 'late'
          : 'soon'

      awaitingBrokerItems.push({
        leadId,
        leadName: lead.full_name,
        checkId: leadChecks[0].id,
        actionType: isReady ? 'approve' : 'review',
        propertyTitle,
        timingLabel: isReady
          ? 'Todo listo · verificado'
          : timing.label || 'Para hoy',
        timingVariant,
      })
    }
  }

  const firstName = currentAgent.full_name?.split(' ')[0] ?? 'agente'
  const totalDeals =
    blockedDeals.length + waitingDeals.length + readyDeals.length

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-7 md:px-7 md:pb-[60px]">
      <ComplianceHeader
        firstName={firstName}
        totalDeals={totalDeals}
        awaitingClient={awaitingClientItems.length}
        awaitingBroker={awaitingBrokerItems.length}
      />

      {/* Two-column action grid */}
      <div className="mb-8 grid grid-cols-1 gap-[14px] md:grid-cols-2">
        <AwaitingClientPanel
          items={awaitingClientItems}
          emptyMessage="Ningún cliente con documentos pendientes"
        />
        <AwaitingBrokerPanel
          items={awaitingBrokerItems}
          emptyMessage="Nada pendiente — sos un crack"
        />
      </div>

      {/* Deal board */}
      <DealBoard
        blocked={blockedDeals}
        waiting={waitingDeals}
        ready={readyDeals}
        initialView={view}
        initialOwner={owner}
        currentAgentId={currentAgent.id}
      />

      {/* Vista avanzada */}
      <div className="mt-8 border-t border-bone pt-6">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
          Vista avanzada
        </p>
        <div className="flex flex-wrap gap-2">
          <AdvancedLink href="/app/compliance/reports" icon={<FileDown className="h-3.5 w-3.5" />} label="Reportes" />
          <AdvancedLink href="/app/compliance/sanctions" icon={<Shield className="h-3.5 w-3.5" />} label="Sanciones" />
          <AdvancedLink href="/app/compliance/audit-log" icon={<History className="h-3.5 w-3.5" />} label="Auditoría" />
          <AdvancedLink href="/app/compliance/policies" icon={<SettingsIcon className="h-3.5 w-3.5" />} label="Reglas" />
        </div>
      </div>
    </div>
  )
}

function AdvancedLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-[4px] border border-bone px-3 py-2 text-[12px] text-steel hover:border-steel hover:text-ink"
    >
      {icon}
      {label}
    </Link>
  )
}

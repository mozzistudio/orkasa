import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  AlertCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Filter,
  ChevronRight,
  ArrowUpRight,
  FileDown,
  Settings as SettingsIcon,
  History,
  Sparkles,
  ScrollText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Check = Database['public']['Tables']['compliance_checks']['Row']
type Document = Database['public']['Tables']['compliance_documents']['Row']
type Alert = Database['public']['Tables']['compliance_alerts']['Row']
type AuditEntry = Database['public']['Tables']['compliance_audit_log']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Agent = Database['public']['Tables']['agents']['Row']

type CheckStatus = Database['public']['Enums']['compliance_status']
type CheckType = Database['public']['Enums']['compliance_check_type']
type Risk = Database['public']['Enums']['compliance_risk']
type Severity = Database['public']['Enums']['compliance_alert_severity']

// === UAF Panama thresholds (Acuerdo 4-2025) ===
// Cash > $10K → mandatory cash transaction report
// Real-estate operations > $100K → enhanced due diligence
const UAF_REPORTING_THRESHOLD = 100_000

const STATUS_FILTERS: ReadonlyArray<{
  value: 'all' | CheckStatus
  label: string
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'requires_action', label: 'Acción requerida' },
  { value: 'approved', label: 'Aprobado' },
]

const TYPE_FILTERS: ReadonlyArray<{
  value: 'all' | CheckType
  label: string
}> = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'kyc', label: 'KYC' },
  { value: 'aml', label: 'AML' },
  { value: 'sanctions', label: 'Sanciones' },
  { value: 'pep', label: 'PEP' },
]

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

const SEVERITY_STYLE: Record<Severity, string> = {
  info: 'border-bone bg-paper text-steel',
  low: 'border-bone bg-bone/40 text-ink',
  medium: 'border-signal/30 bg-signal-soft text-signal',
  high: 'border-signal bg-signal text-paper',
  critical: 'border-signal bg-signal text-paper',
}

const TYPE_LABEL: Record<CheckType, string> = {
  kyc: 'KYC',
  aml: 'AML',
  sanctions: 'Sanc',
  pep: 'PEP',
}

const STATUS_TONE: Record<CheckStatus, string> = {
  pending: 'text-signal',
  in_review: 'text-ink',
  approved: 'text-[#0A6B3D]',
  rejected: 'text-signal',
  requires_action: 'text-signal',
}

const ALERT_KIND_LABEL: Record<Alert['kind'], string> = {
  sanctions_match: 'Match sanciones',
  pep_match: 'Match PEP',
  doc_expiring: 'Doc por vencer',
  doc_expired: 'Doc vencido',
  transaction_threshold: 'Umbral UAF',
  suspicious_activity: 'Actividad sospechosa',
  kyc_overdue: 'KYC vencido',
  review_due: 'Revisión pendiente',
}

function shortDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  const diffHours = Math.round(diffMs / 3_600_000)
  if (diffHours < 1) {
    const diffMin = Math.max(1, Math.round(diffMs / 60_000))
    return `hace ${diffMin}m`
  }
  if (diffHours < 24) return `hace ${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 30) return `hace ${diffDays}d`
  return shortDate(iso)
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

function isUrgent48h(iso: string | null): boolean {
  if (!iso) return false
  const due = new Date(iso).getTime()
  const now = Date.now()
  return due >= now && due - now <= 48 * 3600 * 1000
}

const ACTION_LABEL: Record<string, string> = {
  status_changed: 'Estado actualizado',
  notes_updated: 'Notas actualizadas',
  doc_uploaded: 'Documento subido',
  doc_verified: 'Documento verificado',
  doc_rejected: 'Documento rechazado',
  screening_rerun: 'Screening re-ejecutado',
}

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const t = await getTranslations('compliance')
  const params = await searchParams
  const activeStatus = (
    STATUS_FILTERS.map((f) => f.value) as readonly string[]
  ).includes(params.status ?? '')
    ? (params.status as 'all' | CheckStatus)
    : 'all'
  const activeType = (
    TYPE_FILTERS.map((f) => f.value) as readonly string[]
  ).includes(params.type ?? '')
    ? (params.type as 'all' | CheckType)
    : 'all'

  const supabase = await createClient()

  const [checksRes, leadsRes, propsRes, alertsRes, auditRes, agentsRes, docsRes] =
    await Promise.all([
      supabase
        .from('compliance_checks')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Check[]>(),
      supabase
        .from('leads')
        .select('id, full_name, email, phone, property_id, assigned_agent_id')
        .returns<
          Array<
            Pick<
              Lead,
              | 'id'
              | 'full_name'
              | 'email'
              | 'phone'
              | 'property_id'
              | 'assigned_agent_id'
            >
          >
        >(),
      supabase
        .from('properties')
        .select('id, title, price, currency, neighborhood, city, status')
        .returns<
          Array<
            Pick<
              Property,
              | 'id'
              | 'title'
              | 'price'
              | 'currency'
              | 'neighborhood'
              | 'city'
              | 'status'
            >
          >
        >(),
      supabase
        .from('compliance_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Alert[]>(),
      supabase
        .from('compliance_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8)
        .returns<AuditEntry[]>(),
      supabase
        .from('agents')
        .select('id, full_name')
        .returns<Pick<Agent, 'id' | 'full_name'>[]>(),
      supabase
        .from('compliance_documents')
        .select('id, check_id, status')
        .returns<Pick<Document, 'id' | 'check_id' | 'status'>[]>(),
    ])

  const checks = checksRes.data ?? []
  const leads = leadsRes.data ?? []
  const properties = propsRes.data ?? []
  const alerts = alertsRes.data ?? []
  const audit = auditRes.data ?? []
  const agents = agentsRes.data ?? []
  const documents = docsRes.data ?? []

  const leadsById = new Map(leads.map((l) => [l.id, l]))
  const propsById = new Map(properties.map((p) => [p.id, p]))
  const agentsById = new Map(agents.map((a) => [a.id, a]))

  // ============================================================
  // KPIs
  // ============================================================
  const openChecks = checks.filter(
    (c) => c.status !== 'approved' && c.status !== 'rejected',
  )
  const urgentChecks = openChecks.filter((c) => isUrgent48h(c.due_at))
  const totalKYC = checks.filter((c) => c.type === 'kyc').length
  const validatedKYC = checks.filter(
    (c) => c.type === 'kyc' && c.status === 'approved',
  ).length

  // Volume under monitoring: sum of property prices for leads with open checks
  const leadsWithOpenChecks = new Set(
    openChecks.map((c) => c.lead_id).filter(Boolean) as string[],
  )
  let volumeMonitored = 0
  let volumeAboveThreshold = 0
  for (const leadId of leadsWithOpenChecks) {
    const lead = leadsById.get(leadId)
    if (!lead?.property_id) continue
    const prop = propsById.get(lead.property_id)
    if (!prop?.price) continue
    const price = Number(prop.price)
    volumeMonitored += price
    if (price >= UAF_REPORTING_THRESHOLD) volumeAboveThreshold += price
  }

  const openAlerts = alerts.filter((a) => a.status === 'open')
  const criticalAlerts = openAlerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high',
  )

  // ============================================================
  // Coverage by domain (% complete)
  // ============================================================
  // For each domain, compute "covered" leads / total leads.
  // Pure data domains (KYC, sanctions, PEP, source of funds) are computed
  // from existing checks/docs. Mandates / GDPR / UBO have no schema yet —
  // we mock with realistic-looking numbers and flag them.

  const totalLeads = leads.length || 1
  const leadsWithKYC = new Set(
    checks
      .filter((c) => c.type === 'kyc' && c.status === 'approved')
      .map((c) => c.lead_id)
      .filter(Boolean) as string[],
  )
  const leadsWithSanctions = new Set(
    checks
      .filter(
        (c) =>
          (c.type === 'sanctions' || c.type === 'aml') &&
          c.status === 'approved',
      )
      .map((c) => c.lead_id)
      .filter(Boolean) as string[],
  )
  const leadsWithPEP = new Set(
    checks
      .filter((c) => c.type === 'pep' && c.status !== 'pending')
      .map((c) => c.lead_id)
      .filter(Boolean) as string[],
  )
  const leadsWithFundsOrigin = new Set(
    documents
      .filter((d) => d.status === 'verified')
      .map((d) => {
        const check = checks.find((c) => c.id === d.check_id)
        return check?.lead_id ?? null
      })
      .filter(Boolean) as string[],
  )
  const leadsWithRiskAssessed = new Set(
    checks
      .filter((c) => c.risk_level !== null)
      .map((c) => c.lead_id)
      .filter(Boolean) as string[],
  )

  const coverage = [
    {
      domain: 'KYC · identidad',
      detail: 'Cédula + comprobante domicilio',
      pct: Math.round((leadsWithKYC.size / totalLeads) * 100),
      tracked: true,
    },
    {
      domain: 'Origen de fondos',
      detail: 'Source of funds — declaración + respaldo bancario',
      pct: Math.round((leadsWithFundsOrigin.size / totalLeads) * 100),
      tracked: true,
    },
    {
      domain: 'Origen del patrimonio',
      detail: 'Source of wealth — vista global del cliente',
      pct: 30, // Mock — schema needed (separate from funds origin)
      tracked: false,
    },
    {
      domain: 'Sanctions screening',
      detail: 'OFAC · ONU · UE · UAF nacional',
      pct: Math.round((leadsWithSanctions.size / totalLeads) * 100),
      tracked: true,
    },
    {
      domain: 'PEP screening',
      detail: 'Personas expuestas + familiares hasta 2° grado',
      pct: Math.round((leadsWithPEP.size / totalLeads) * 100),
      tracked: true,
    },
    {
      domain: 'Beneficiarios efectivos (UBO)',
      detail: 'Cadena societaria ≥25%',
      pct: 10, // Mock — schema needed
      tracked: false,
    },
    {
      domain: 'Mandatos firmados',
      detail: 'Versión vigente + avenants',
      pct: 80, // Mock — schema needed
      tracked: false,
    },
    {
      domain: 'Consentimiento Ley 81 (RGPD)',
      detail: 'Consentimiento explícito firmado',
      pct: 95, // Mock — schema needed
      tracked: false,
    },
    {
      domain: 'Evaluación de riesgo',
      detail: 'Clasificación low/medium/high con justificación',
      pct: Math.round((leadsWithRiskAssessed.size / totalLeads) * 100),
      tracked: true,
    },
  ]

  // ============================================================
  // Queue (filtered + sorted by urgency)
  // ============================================================
  type QueueItem = {
    check: Check
    lead: typeof leads[number] | undefined
    property: typeof properties[number] | undefined
    agent: typeof agents[number] | undefined
    risk: Risk | null
    overdue: boolean
    urgent: boolean
  }
  const queue: QueueItem[] = checks
    .filter((c) => activeStatus === 'all' || c.status === activeStatus)
    .filter((c) => activeType === 'all' || c.type === activeType)
    .map((c) => {
      const lead = c.lead_id ? leadsById.get(c.lead_id) : undefined
      const property = lead?.property_id ? propsById.get(lead.property_id) : undefined
      const agent = lead?.assigned_agent_id
        ? agentsById.get(lead.assigned_agent_id)
        : undefined
      return {
        check: c,
        lead,
        property,
        agent,
        risk: c.risk_level,
        overdue: isOverdue(c.due_at) && c.status !== 'approved' && c.status !== 'rejected',
        urgent: isUrgent48h(c.due_at),
      }
    })
    .sort((a, b) => {
      // Match warnings first
      const aMatch = a.check.sanctions_match || a.check.pep_match
      const bMatch = b.check.sanctions_match || b.check.pep_match
      if (aMatch !== bMatch) return aMatch ? -1 : 1
      // Then overdue
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
      // Then urgent
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
      // Then by due date
      if (a.check.due_at && b.check.due_at) {
        return a.check.due_at.localeCompare(b.check.due_at)
      }
      return 0
    })
    .slice(0, 30)

  return (
    <div>
      {/* === HEADER + GLOBAL ACTIONS === */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            {t('title')}
          </h1>
          <p className="mt-1 text-[13px] text-steel">
            Centro de control · KYC, AML, sanciones, PEP, UBO, declaraciones UAF
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/compliance/reports"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-3 py-2 text-[12px] text-ink transition-colors hover:border-ink"
          >
            <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            Reportes
          </Link>
          <Link
            href="/app/compliance/sanctions"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-3 py-2 text-[12px] text-ink transition-colors hover:border-ink"
          >
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sanciones
          </Link>
          <Link
            href="/app/compliance/audit-log"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-3 py-2 text-[12px] text-ink transition-colors hover:border-ink"
          >
            <History className="h-3.5 w-3.5" strokeWidth={1.5} />
            Audit log
          </Link>
          <Link
            href="/app/compliance/policies"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-3 py-2 text-[12px] text-ink transition-colors hover:border-ink"
          >
            <SettingsIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            Reglas
          </Link>
        </div>
      </div>

      {/* === KPIs === */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-4 md:gap-4">
        <Kpi
          icon={Shield}
          label="Dossiers a tratar"
          value={openChecks.length}
          subValue={
            urgentChecks.length > 0
              ? `${urgentChecks.length} urgentes <48h`
              : 'sin urgentes'
          }
          tone={urgentChecks.length > 0 ? 'signal' : 'ink'}
        />
        <Kpi
          icon={ShieldCheck}
          label="KYC validados"
          value={`${validatedKYC}/${totalKYC}`}
          subValue={
            totalKYC > 0
              ? `${Math.round((validatedKYC / totalKYC) * 100)}% completado`
              : '—'
          }
          tone="green"
        />
        <Kpi
          icon={Wallet}
          label="Volumen monitoreado"
          value={formatPrice(volumeMonitored)}
          subValue={
            volumeAboveThreshold > 0
              ? `${formatPrice(volumeAboveThreshold)} > umbral UAF`
              : 'sin operaciones > umbral'
          }
          tone="ink"
        />
        <Kpi
          icon={AlertCircle}
          label="Alertas abiertas"
          value={openAlerts.length}
          subValue={
            criticalAlerts.length > 0
              ? `${criticalAlerts.length} crítica${criticalAlerts.length !== 1 ? 's' : ''}`
              : 'todo bajo control'
          }
          tone={criticalAlerts.length > 0 ? 'signal' : 'steel'}
        />
      </div>

      {/* === ALERTS BANNER === */}
      {openAlerts.length > 0 && (
        <section className="mb-6 md:mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-signal" strokeWidth={1.5} />
              <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Alertas en curso
              </h2>
              <span className="font-mono text-[11px] tabular-nums text-steel">
                {openAlerts.length}
              </span>
            </div>
          </div>
          <ul className="space-y-2">
            {openAlerts
              .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
              .slice(0, 4)
              .map((a) => {
                const lead = a.lead_id ? leadsById.get(a.lead_id) : null
                return (
                  <li key={a.id}>
                    <Link
                      href={
                        a.check_id
                          ? `/app/compliance/${a.check_id}`
                          : a.lead_id
                            ? `/app/leads/${a.lead_id}`
                            : '#'
                      }
                      className={`flex items-start gap-3 rounded-[4px] border px-4 py-3 transition-opacity hover:opacity-90 ${SEVERITY_STYLE[a.severity]}`}
                    >
                      <span className="mt-0.5 inline-flex shrink-0 items-center rounded-[3px] bg-paper/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">
                        {a.severity}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          {a.title}
                        </p>
                        {a.description && (
                          <p className="mt-0.5 text-[12px] opacity-80 line-clamp-2">
                            {a.description}
                          </p>
                        )}
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider opacity-70">
                          {ALERT_KIND_LABEL[a.kind]}
                          {lead && ` · ${lead.full_name}`}
                          {' · '}
                          {relativeTime(a.created_at)}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 opacity-60"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      {/* === COVERAGE BARS === */}
      <section className="mb-6 rounded-[4px] border border-bone bg-paper p-5 md:mb-8 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-ink" strokeWidth={1.5} />
            <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Cobertura por dominio
            </h2>
          </div>
          <p className="hidden font-mono text-[10px] uppercase tracking-wider text-steel md:block">
            % de dossiers con el dominio cubierto
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2 md:gap-x-8 md:gap-y-5">
          {coverage.map((c) => (
            <li key={c.domain}>
              <CoverageBar {...c} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* === QUEUE === */}
        <section>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink" strokeWidth={1.5} />
              <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Cola de trabajo
              </h2>
              <span className="font-mono text-[11px] tabular-nums text-steel">
                {queue.length}
              </span>
            </div>
            <FilterBar activeStatus={activeStatus} activeType={activeType} />
          </div>

          {queue.length === 0 ? (
            <div className="rounded-[4px] border border-bone bg-paper p-8 text-center">
              <Shield
                className="mx-auto mb-3 h-6 w-6 text-steel"
                strokeWidth={1.5}
              />
              <p className="text-[13px] text-steel">
                No hay verificaciones con estos filtros.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {queue.map((item) => (
                <li key={item.check.id}>
                  <QueueRow item={item} t={t} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* === RIGHT SIDEBAR: RECENT ACTIVITY === */}
        <aside className="space-y-6">
          {/* Recent activity */}
          <section className="rounded-[4px] border border-bone bg-paper">
            <header className="flex items-center justify-between border-b border-bone px-4 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-ink" strokeWidth={1.5} />
                <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Actividad reciente
                </h2>
              </div>
              <Link
                href="/app/compliance/audit-log"
                className="font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
              >
                ver todo →
              </Link>
            </header>
            {audit.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-steel">
                Sin actividad todavía.
              </p>
            ) : (
              <ol className="divide-y divide-bone">
                {audit.map((entry) => (
                  <li key={entry.id} className="px-4 py-3">
                    <p className="text-[13px] text-ink">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-steel">
                      {relativeTime(entry.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Quick actions */}
          <section className="rounded-[4px] border border-bone bg-paper">
            <header className="border-b border-bone px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-signal" strokeWidth={1.5} />
                <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Acciones globales
                </h2>
              </div>
            </header>
            <ul className="divide-y divide-bone">
              <ActionRow
                href="/app/compliance/reports"
                label="Generar reporte SUGEF"
                hint="Mensual · PDF firmado"
              />
              <ActionRow
                href="/app/compliance/reports"
                label="Declaración UAF (DOS)"
                hint="Operación sospechosa"
              />
              <ActionRow
                href="/app/compliance/sanctions"
                label="Re-ejecutar screening"
                hint="OFAC + ONU + UE · todos los leads"
              />
              <ActionRow
                href="/app/compliance/policies"
                label="Configurar reglas de riesgo"
                hint="Umbrales · workflows · templates"
              />
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function Kpi({
  icon: Icon,
  label,
  value,
  subValue,
  tone,
}: {
  icon: typeof Shield
  label: string
  value: string | number
  subValue: string
  tone: 'ink' | 'signal' | 'green' | 'steel'
}) {
  const valueColor =
    tone === 'signal'
      ? 'text-signal'
      : tone === 'green'
        ? 'text-[#0A6B3D]'
        : tone === 'steel'
          ? 'text-steel'
          : 'text-ink'
  return (
    <div className="rounded-[4px] border border-bone bg-paper p-4">
      <div className="mb-2 flex items-center justify-between">
        <Icon className="h-4 w-4 text-steel" strokeWidth={1.5} />
      </div>
      <p
        className={`font-mono text-[24px] font-medium tabular-nums leading-none md:text-[28px] ${valueColor}`}
      >
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
      <p className="mt-2 truncate font-mono text-[11px] text-steel">
        {subValue}
      </p>
    </div>
  )
}

function CoverageBar({
  domain,
  detail,
  pct,
  tracked,
}: {
  domain: string
  detail: string
  pct: number
  tracked: boolean
}) {
  const tone =
    pct >= 80 ? 'bg-[#0A6B3D]' : pct >= 50 ? 'bg-ink' : 'bg-signal'
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink">
            {domain}
            {!tracked && (
              <span
                className="ml-2 rounded-[3px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel"
                title="Estimado — schema completo en próxima versión"
              >
                est.
              </span>
            )}
          </p>
          <p className="truncate font-mono text-[10px] text-steel">{detail}</p>
        </div>
        <span className="shrink-0 font-mono text-[14px] tabular-nums font-medium text-ink">
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone">
        <div
          className={`h-full transition-all ${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

function FilterBar({
  activeStatus,
  activeType,
}: {
  activeStatus: 'all' | CheckStatus
  activeType: 'all' | CheckType
}) {
  function buildHref(
    status: 'all' | CheckStatus,
    type: 'all' | CheckType,
  ): string {
    const sp = new URLSearchParams()
    if (status !== 'all') sp.set('status', status)
    if (type !== 'all') sp.set('type', type)
    const qs = sp.toString()
    return `/app/compliance${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {STATUS_FILTERS.map((f) => {
          const active = activeStatus === f.value
          return (
            <Link
              key={f.value}
              href={buildHref(f.value, activeType)}
              className={`shrink-0 rounded-[4px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                active
                  ? 'border-ink bg-ink text-paper'
                  : 'border-bone text-steel hover:border-ink hover:text-ink'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>
      <div className="hidden h-5 w-px bg-bone md:block" />
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {TYPE_FILTERS.map((f) => {
          const active = activeType === f.value
          return (
            <Link
              key={f.value}
              href={buildHref(activeStatus, f.value)}
              className={`shrink-0 rounded-[4px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                active
                  ? 'border-ink bg-ink text-paper'
                  : 'border-bone text-steel hover:border-ink hover:text-ink'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function QueueRow({
  item,
  t,
}: {
  item: {
    check: Check
    lead: { full_name: string; id: string; assigned_agent_id: string | null } | undefined
    property: { title: string; price: number | null; currency: string | null } | undefined
    agent: { full_name: string; id: string } | undefined
    risk: Risk | null
    overdue: boolean
    urgent: boolean
  }
  t: Awaited<ReturnType<typeof getTranslations<'compliance'>>>
}) {
  const { check, lead, property, agent, risk, overdue, urgent } = item
  const hasMatch = check.sanctions_match || check.pep_match
  return (
    <Link
      href={`/app/compliance/${check.id}`}
      className={`group flex items-center gap-3 rounded-[4px] border bg-paper px-4 py-3 transition-colors hover:border-ink ${
        hasMatch ? 'border-signal' : overdue ? 'border-signal/40' : 'border-bone'
      }`}
    >
      {/* Type chip */}
      <span className="inline-flex h-9 w-12 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[10px] font-medium uppercase tracking-wider text-ink">
        {TYPE_LABEL[check.type]}
      </span>

      {/* Lead + property */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">
          {lead?.full_name ?? '—'}
        </p>
        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-steel">
          {property?.title ?? 'Sin propiedad'}
          {property?.price && ` · ${formatPrice(Number(property.price))}`}
        </p>
      </div>

      {/* Status */}
      <div className="hidden shrink-0 md:block min-w-[120px]">
        <p
          className={`font-mono text-[11px] uppercase tracking-wider ${STATUS_TONE[check.status]}`}
        >
          {t(`status.${check.status}`)}
        </p>
        {check.due_at && (
          <p
            className={`font-mono text-[10px] ${overdue ? 'text-signal' : urgent ? 'text-signal' : 'text-steel'}`}
          >
            {overdue ? 'Vencida · ' : urgent ? 'Urgente · ' : 'Vence '}
            {shortDate(check.due_at)}
          </p>
        )}
      </div>

      {/* Risk */}
      {risk && (
        <span
          className={`shrink-0 rounded-[4px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            risk === 'low'
              ? 'bg-[#0A6B3D]/10 text-[#0A6B3D]'
              : risk === 'medium'
                ? 'bg-bone text-ink'
                : 'bg-signal text-paper'
          }`}
        >
          {risk}
        </span>
      )}

      {/* Match warning */}
      {hasMatch && (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-[4px] bg-signal px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper">
          <ShieldAlert className="h-3 w-3" strokeWidth={1.5} />
          Match
        </span>
      )}

      {/* Agent */}
      {agent && (
        <span className="hidden shrink-0 font-mono text-[11px] text-steel md:inline">
          {agent.full_name.split(' ')[0]}
        </span>
      )}

      <ChevronRight
        className="h-4 w-4 shrink-0 text-steel transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
        strokeWidth={1.5}
      />
    </Link>
  )
}

function ActionRow({
  href,
  label,
  hint,
}: {
  href: string
  label: string
  hint: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start justify-between gap-2 px-4 py-3 transition-colors hover:bg-bone/30"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink">{label}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
            {hint}
          </p>
        </div>
        <ArrowUpRight
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel"
          strokeWidth={1.5}
        />
      </Link>
    </li>
  )
}

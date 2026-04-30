import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type CheckType = 'kyc' | 'aml' | 'sanctions' | 'pep'
type CheckStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'requires_action'
type Risk = 'low' | 'medium' | 'high' | 'critical'

type Check = {
  id: string
  lead_id: string | null
  type: CheckType
  status: CheckStatus
  risk_level: Risk | null
  due_at: string | null
  created_at: string | null
  sanctions_match: boolean | null
  pep_match: boolean | null
}

const STATUS_FILTERS: ReadonlyArray<{
  value: 'all' | CheckStatus
  label: string
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'requires_action', label: 'Acción requerida' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
]

const STATUS_COLOR: Record<CheckStatus, string> = {
  pending: 'text-signal',
  in_review: 'text-ink',
  approved: 'text-[#0A6B3D]',
  rejected: 'text-signal',
  requires_action: 'text-signal',
}

const TYPE_LABEL: Record<CheckType, string> = {
  kyc: 'KYC',
  aml: 'AML',
  sanctions: 'Sanc',
  pep: 'PEP',
}

const RISK_COLOR: Record<Risk, string> = {
  low: 'bg-[#0A6B3D]/10 text-[#0A6B3D]',
  medium: 'bg-bone text-ink',
  high: 'bg-signal/10 text-signal',
  critical: 'bg-signal text-paper',
}

function shortDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const t = await getTranslations('compliance')
  const params = await searchParams
  const activeFilter = (
    STATUS_FILTERS.map((f) => f.value) as readonly string[]
  ).includes(params.filter ?? '')
    ? (params.filter as 'all' | CheckStatus)
    : 'all'

  const supabase = await createClient()

  const [checksRes, leadsRes] = await Promise.all([
    supabase
      .from('compliance_checks')
      .select(
        'id, lead_id, type, status, risk_level, due_at, created_at, sanctions_match, pep_match',
      )
      .order('created_at', { ascending: false })
      .returns<Check[]>(),
    supabase
      .from('leads')
      .select('id, full_name, email, phone')
      .returns<Array<{ id: string; full_name: string; email: string | null; phone: string | null }>>(),
  ])

  const leadsById = new Map((leadsRes.data ?? []).map((l) => [l.id, l]))
  const allChecks = checksRes.data ?? []

  // === Stats ===
  const stats = {
    pending: allChecks.filter((c) => c.status === 'pending').length,
    inReview: allChecks.filter((c) => c.status === 'in_review').length,
    requiresAction: allChecks.filter((c) => c.status === 'requires_action').length,
    approved: allChecks.filter((c) => c.status === 'approved').length,
    overdue: allChecks.filter(
      (c) => c.status !== 'approved' && c.status !== 'rejected' && isOverdue(c.due_at),
    ).length,
    sanctionsHits: allChecks.filter((c) => c.sanctions_match).length,
    pepHits: allChecks.filter((c) => c.pep_match).length,
  }

  // === Filter ===
  const filtered =
    activeFilter === 'all'
      ? allChecks
      : allChecks.filter((c) => c.status === activeFilter)

  // === Group by lead ===
  // Multiple checks per lead (kyc, aml, sanctions, pep) — show them as a row
  // per lead with chips for each type's status.
  type LeadGroup = {
    leadId: string
    leadName: string
    leadEmail: string | null
    checks: Check[]
    overallRisk: Risk | null
    nextDue: string | null
    hasOverdue: boolean
    hasMatch: boolean
  }
  const groups = new Map<string, LeadGroup>()
  for (const check of filtered) {
    if (!check.lead_id) continue
    const lead = leadsById.get(check.lead_id)
    if (!lead) continue
    const existing = groups.get(check.lead_id) ?? {
      leadId: check.lead_id,
      leadName: lead.full_name,
      leadEmail: lead.email,
      checks: [],
      overallRisk: null,
      nextDue: null,
      hasOverdue: false,
      hasMatch: false,
    }
    existing.checks.push(check)
    // Highest risk wins
    const ranks: Record<Risk, number> = { low: 1, medium: 2, high: 3, critical: 4 }
    if (
      check.risk_level &&
      (!existing.overallRisk ||
        ranks[check.risk_level] > ranks[existing.overallRisk])
    ) {
      existing.overallRisk = check.risk_level
    }
    if (check.due_at && (!existing.nextDue || check.due_at < existing.nextDue)) {
      existing.nextDue = check.due_at
    }
    if (
      isOverdue(check.due_at) &&
      check.status !== 'approved' &&
      check.status !== 'rejected'
    ) {
      existing.hasOverdue = true
    }
    if (check.sanctions_match || check.pep_match) {
      existing.hasMatch = true
    }
    groups.set(check.lead_id, existing)
  }

  const leadGroups = Array.from(groups.values()).sort((a, b) => {
    // Critical/match first, then overdue, then by next due
    if (a.hasMatch !== b.hasMatch) return a.hasMatch ? -1 : 1
    if (a.hasOverdue !== b.hasOverdue) return a.hasOverdue ? -1 : 1
    if (a.nextDue && b.nextDue) return a.nextDue.localeCompare(b.nextDue)
    if (a.nextDue) return -1
    if (b.nextDue) return 1
    return 0
  })

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 text-[13px] text-steel">{t('subtitle')}</p>
      </div>

      {/* === STATS GRID === */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-4 md:gap-4">
        <StatCard
          icon={Clock}
          label="Pendiente"
          value={stats.pending}
          tone="signal"
        />
        <StatCard
          icon={Shield}
          label="En revisión"
          value={stats.inReview}
          tone="ink"
        />
        <StatCard
          icon={ShieldAlert}
          label="Acción requerida"
          value={stats.requiresAction}
          tone="signal"
        />
        <StatCard
          icon={ShieldCheck}
          label="Aprobado"
          value={stats.approved}
          tone="green"
        />
      </div>

      {/* Sub-stats row: overdue + matches */}
      {(stats.overdue > 0 || stats.sanctionsHits > 0 || stats.pepHits > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-2 md:mb-8">
          {stats.overdue > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-signal/40 bg-signal-soft px-3 py-1.5 font-mono text-[11px] text-signal">
              <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
              {stats.overdue} vencido{stats.overdue !== 1 ? 's' : ''}
            </span>
          )}
          {stats.sanctionsHits > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-signal bg-signal text-paper px-3 py-1.5 font-mono text-[11px]">
              <ShieldAlert className="h-3 w-3" strokeWidth={1.5} />
              {stats.sanctionsHits} sanciones
            </span>
          )}
          {stats.pepHits > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-signal bg-signal text-paper px-3 py-1.5 font-mono text-[11px]">
              <ShieldAlert className="h-3 w-3" strokeWidth={1.5} />
              {stats.pepHits} PEP
            </span>
          )}
        </div>
      )}

      {/* === FILTER TABS === */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide md:mb-6">
        <Filter className="h-3 w-3 shrink-0 text-steel" strokeWidth={1.5} />
        {STATUS_FILTERS.map((f) => {
          const count =
            f.value === 'all'
              ? allChecks.length
              : allChecks.filter((c) => c.status === f.value).length
          const isActive = activeFilter === f.value
          return (
            <Link
              key={f.value}
              href={
                f.value === 'all'
                  ? '/app/compliance'
                  : `/app/compliance?filter=${f.value}`
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                isActive
                  ? 'border-ink bg-ink text-paper'
                  : 'border-bone text-steel hover:border-ink hover:text-ink'
              }`}
            >
              {f.label}
              <span
                className={`tabular-nums ${
                  isActive ? 'text-paper/70' : 'text-steel'
                }`}
              >
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* === LEAD GROUPS === */}
      {leadGroups.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-12 text-center">
          <Shield
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="mx-auto max-w-md text-[13px] text-steel">
            {activeFilter === 'all'
              ? t('empty')
              : 'No hay verificaciones con este filtro.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {leadGroups.map((g) => (
            <li key={g.leadId}>
              <article
                className={`rounded-[4px] border bg-paper p-4 transition-colors hover:border-ink md:p-5 ${
                  g.hasMatch
                    ? 'border-signal'
                    : g.hasOverdue
                      ? 'border-signal/40'
                      : 'border-bone'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/leads/${g.leadId}`}
                      className="block truncate text-[15px] font-medium text-ink transition-colors hover:text-signal"
                    >
                      {g.leadName}
                    </Link>
                    {g.leadEmail && (
                      <p className="truncate font-mono text-[11px] text-steel">
                        {g.leadEmail}
                      </p>
                    )}
                  </div>
                  {g.overallRisk && (
                    <span
                      className={`shrink-0 rounded-[4px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${RISK_COLOR[g.overallRisk]}`}
                    >
                      {g.overallRisk}
                    </span>
                  )}
                </div>

                {/* Per-check chip row */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {g.checks.map((c) => (
                    <Link
                      key={c.id}
                      href={`/app/compliance/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-2.5 py-1 transition-colors hover:border-ink"
                    >
                      <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-ink">
                        {TYPE_LABEL[c.type]}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-wider ${STATUS_COLOR[c.status]}`}
                      >
                        · {t(`status.${c.status}`)}
                      </span>
                      {(c.sanctions_match || c.pep_match) && (
                        <ShieldAlert
                          className="h-3 w-3 text-signal"
                          strokeWidth={1.5}
                        />
                      )}
                    </Link>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-bone pt-3">
                  <p className="font-mono text-[11px] text-steel">
                    {g.nextDue ? (
                      <>
                        {g.hasOverdue ? (
                          <span className="text-signal">
                            Vencida · {shortDate(g.nextDue)}
                          </span>
                        ) : (
                          <>Vence {shortDate(g.nextDue)}</>
                        )}
                      </>
                    ) : (
                      'Sin fecha límite'
                    )}
                  </p>
                  <Link
                    href={`/app/compliance/${g.checks[0]?.id ?? ''}`}
                    className="font-mono text-[11px] text-ink transition-colors hover:text-signal"
                  >
                    Revisar →
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Shield
  label: string
  value: number
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
        className={`font-mono text-[28px] font-medium tabular-nums leading-none md:text-[32px] ${valueColor}`}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
    </div>
  )
}

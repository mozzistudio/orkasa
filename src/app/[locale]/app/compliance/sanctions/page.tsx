import Link from 'next/link'
import {
  ArrowLeft,
  Globe,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type Check = Database['public']['Tables']['compliance_checks']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Alert = Database['public']['Tables']['compliance_alerts']['Row']

/**
 * Sanctions screening configuration. Each list has a name, jurisdiction,
 * cadence, and current "active" status. In a real impl this comes from a
 * settings table and the actual fetch happens server-side via cron — for
 * now it's static config that drives the UI.
 */
const SANCTIONS_LISTS = [
  {
    code: 'OFAC_SDN',
    name: 'OFAC SDN',
    jurisdiction: 'Estados Unidos',
    description: 'Specially Designated Nationals — Office of Foreign Assets Control',
    cadence: 'Diario',
    lastSync: '2026-04-30T03:12:00Z',
    active: true,
  },
  {
    code: 'OFAC_NON_SDN',
    name: 'OFAC Non-SDN',
    jurisdiction: 'Estados Unidos',
    description: 'Sectoral Sanctions, Foreign Sanctions Evaders, etc.',
    cadence: 'Semanal',
    lastSync: '2026-04-28T02:00:00Z',
    active: true,
  },
  {
    code: 'UN_CONSOLIDATED',
    name: 'UN Consolidated',
    jurisdiction: 'ONU',
    description: 'Lista consolidada del Consejo de Seguridad de las Naciones Unidas',
    cadence: 'Diario',
    lastSync: '2026-04-30T01:45:00Z',
    active: true,
  },
  {
    code: 'EU_CFSP',
    name: 'EU Consolidated',
    jurisdiction: 'Unión Europea',
    description: 'Common Foreign and Security Policy — sanciones financieras',
    cadence: 'Diario',
    lastSync: '2026-04-30T02:30:00Z',
    active: true,
  },
  {
    code: 'PA_UAF',
    name: 'UAF Panamá',
    jurisdiction: 'Panamá',
    description: 'Lista local de la Unidad de Análisis Financiero',
    cadence: 'Semanal',
    lastSync: '2026-04-29T14:00:00Z',
    active: true,
  },
  {
    code: 'PA_PEP',
    name: 'PA-PEP',
    jurisdiction: 'Panamá',
    description: 'Personas expuestas políticamente — registro nacional',
    cadence: 'Mensual',
    lastSync: '2026-04-15T10:00:00Z',
    active: true,
  },
  {
    code: 'INTERPOL_REDNOTICE',
    name: 'Interpol Red Notice',
    jurisdiction: 'Internacional',
    description: 'Notificaciones rojas — personas buscadas internacionalmente',
    cadence: 'Diario',
    lastSync: '2026-04-30T04:00:00Z',
    active: false,
  },
] as const

function dateLong(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function SanctionsPage() {
  const supabase = await createClient()

  const [alertsRes, checksRes, leadsRes] = await Promise.all([
    supabase
      .from('compliance_alerts')
      .select('*')
      .in('kind', ['sanctions_match', 'pep_match'])
      .order('created_at', { ascending: false })
      .returns<Alert[]>(),
    supabase
      .from('compliance_checks')
      .select('*')
      .returns<Check[]>(),
    supabase
      .from('leads')
      .select('id, full_name, email')
      .returns<Pick<Lead, 'id' | 'full_name' | 'email'>[]>(),
  ])

  const alerts = alertsRes.data ?? []
  const checks = checksRes.data ?? []
  const leads = leadsRes.data ?? []
  const leadsById = new Map(leads.map((l) => [l.id, l]))

  // Stats
  const totalScreened = checks.filter(
    (c) => c.type === 'sanctions' || c.type === 'pep',
  ).length
  const totalClean = checks.filter(
    (c) =>
      (c.type === 'sanctions' || c.type === 'pep') &&
      c.status === 'approved' &&
      !c.sanctions_match &&
      !c.pep_match,
  ).length
  const totalMatches = alerts.filter((a) => a.status === 'open').length
  const falsePositives = alerts.filter((a) => a.status === 'false_positive').length

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/app/compliance"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Compliance
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4 md:mb-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Sanctions screening
          </p>
          <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
            Listas y resultados de screening
          </h1>
          <p className="mt-1 text-[13px] text-steel">
            OFAC · ONU · UE · UAF Panamá. Sincronización automática + match
            engine fuzzy con review manual.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] bg-ink px-3 py-2 text-[12px] text-paper transition-colors hover:bg-coal"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
          Re-screen todos
        </button>
      </header>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="Screenings totales" value={totalScreened} />
        <Stat label="Limpios" value={totalClean} tone="green" />
        <Stat label="Matches abiertos" value={totalMatches} tone="signal" />
        <Stat label="Falsos positivos" value={falsePositives} tone="steel" />
      </div>

      {/* Lists configuration */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-ink" strokeWidth={1.5} />
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Listas activas
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-steel">
            {SANCTIONS_LISTS.filter((l) => l.active).length}/
            {SANCTIONS_LISTS.length}
          </span>
        </div>
        <div className="overflow-hidden rounded-[4px] border border-bone bg-paper">
          <ul className="divide-y divide-bone">
            {SANCTIONS_LISTS.map((list) => (
              <li
                key={list.code}
                className="flex items-start gap-4 px-4 py-3 md:px-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[10px] font-medium text-ink">
                  {list.jurisdiction.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-medium text-ink">
                      {list.name}
                    </h3>
                    {list.active ? (
                      <span className="inline-flex items-center gap-1 rounded-[3px] bg-[#0A6B3D]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#0A6B3D]">
                        <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2} />
                        Activa
                      </span>
                    ) : (
                      <span className="rounded-[3px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-steel">
                    {list.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-steel">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" strokeWidth={1.5} />
                      {list.cadence}
                    </span>
                    <span>·</span>
                    <span>Último sync: {dateLong(list.lastSync)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
                >
                  Configurar
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Match results */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-signal" strokeWidth={1.5} />
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Resultados recientes
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-steel">
            {alerts.length}
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-[4px] border border-bone bg-paper p-12 text-center">
            <ShieldCheck
              className="mx-auto mb-3 h-6 w-6 text-[#0A6B3D]"
              strokeWidth={1.5}
            />
            <p className="text-[13px] text-steel">
              Sin resultados de screening. Todos los leads están limpios.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => {
              const lead = a.lead_id ? leadsById.get(a.lead_id) : null
              const details = (a.details as Record<string, unknown> | null) ?? {}
              const matchType = (details.match_type as string) ?? 'unknown'
              const confidence = (details.confidence as number) ?? null
              const list = (details.list as string) ?? null
              const matchedName = (details.matched_name as string) ?? null

              const isResolved = a.status === 'resolved'
              const isFalsePositive = a.status === 'false_positive'

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
                    className={`block rounded-[4px] border bg-paper p-4 transition-colors hover:border-ink ${
                      isResolved || isFalsePositive
                        ? 'border-bone opacity-70'
                        : a.severity === 'critical' || a.severity === 'high'
                          ? 'border-signal'
                          : 'border-bone'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-medium text-ink">
                            {lead?.full_name ?? '—'}
                          </h3>
                          {a.status === 'open' && (
                            <span
                              className={`rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                                a.severity === 'critical' ||
                                a.severity === 'high'
                                  ? 'bg-signal text-paper'
                                  : 'bg-signal-soft text-signal'
                              }`}
                            >
                              {a.severity}
                            </span>
                          )}
                          {isFalsePositive && (
                            <span className="inline-flex items-center gap-1 rounded-[3px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel">
                              <XCircle className="h-2.5 w-2.5" strokeWidth={2} />
                              Falso positivo
                            </span>
                          )}
                          {isResolved && (
                            <span className="inline-flex items-center gap-1 rounded-[3px] bg-[#0A6B3D]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#0A6B3D]">
                              <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2} />
                              Resuelto
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] text-ink">{a.title}</p>
                        {a.description && (
                          <p className="mt-1 text-[12px] text-steel">
                            {a.description}
                          </p>
                        )}
                        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-steel">
                          {list && (
                            <div>
                              <dt className="inline text-steel">Lista:</dt>{' '}
                              <dd className="inline text-ink">{list}</dd>
                            </div>
                          )}
                          {matchedName && (
                            <div>
                              <dt className="inline text-steel">Match:</dt>{' '}
                              <dd className="inline text-ink">{matchedName}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="inline text-steel">Tipo:</dt>{' '}
                            <dd className="inline text-ink">{matchType}</dd>
                          </div>
                          {confidence != null && (
                            <div>
                              <dt className="inline text-steel">Confianza:</dt>{' '}
                              <dd className="inline text-ink">
                                {Math.round(confidence * 100)}%
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'signal' | 'green' | 'steel'
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
      <p
        className={`font-mono text-[28px] font-medium tabular-nums leading-none ${valueColor}`}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
    </div>
  )
}

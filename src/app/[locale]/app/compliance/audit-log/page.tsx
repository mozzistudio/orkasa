import Link from 'next/link'
import { ArrowLeft, History, Filter, Download, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type AuditEntry = Database['public']['Tables']['compliance_audit_log']['Row']
type Agent = Database['public']['Tables']['agents']['Row']
type Check = Database['public']['Tables']['compliance_checks']['Row']
type Lead = Database['public']['Tables']['leads']['Row']

const ACTION_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'status_changed', label: 'Cambios de estado' },
  { value: 'doc_uploaded', label: 'Documentos subidos' },
  { value: 'doc_verified', label: 'Documentos verificados' },
  { value: 'doc_rejected', label: 'Documentos rechazados' },
  { value: 'screening_rerun', label: 'Re-screenings' },
  { value: 'notes_updated', label: 'Notas' },
] as const

const ACTION_LABEL: Record<string, string> = {
  status_changed: 'Estado actualizado',
  notes_updated: 'Notas actualizadas',
  doc_uploaded: 'Documento subido',
  doc_verified: 'Documento verificado',
  doc_rejected: 'Documento rechazado',
  screening_rerun: 'Screening re-ejecutado',
}

const ACTION_TONE: Record<string, string> = {
  status_changed: 'bg-bone text-ink',
  doc_uploaded: 'bg-bone text-ink',
  doc_verified: 'bg-[#0A6B3D]/10 text-[#0A6B3D]',
  doc_rejected: 'bg-signal/10 text-signal',
  screening_rerun: 'bg-signal-soft text-signal',
  notes_updated: 'bg-bone text-steel',
}

function dateLong(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function detailPreview(details: unknown): string | null {
  if (!details || typeof details !== 'object') return null
  const obj = details as Record<string, unknown>
  if (Object.keys(obj).length === 0) return null
  const parts: string[] = []
  if (typeof obj.status === 'string') parts.push(`status=${obj.status}`)
  if (typeof obj.risk_level === 'string')
    parts.push(`risk=${obj.risk_level}`)
  if (typeof obj.kind === 'string') parts.push(obj.kind as string)
  if (typeof obj.fileName === 'string')
    parts.push(`file=${obj.fileName}`)
  if (parts.length === 0) {
    // Fallback: serialize first key
    const [k, v] = Object.entries(obj)[0] ?? []
    if (k && v !== undefined) parts.push(`${k}=${String(v)}`)
  }
  return parts.join(' · ')
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>
}) {
  const params = await searchParams
  const activeAction = (
    ACTION_FILTERS.map((f) => f.value) as readonly string[]
  ).includes(params.action ?? '')
    ? (params.action as string)
    : 'all'

  const supabase = await createClient()

  let query = supabase
    .from('compliance_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (activeAction !== 'all') {
    query = query.eq('action', activeAction)
  }

  const [auditRes, agentsRes, checksRes, leadsRes] = await Promise.all([
    query.returns<AuditEntry[]>(),
    supabase
      .from('agents')
      .select('id, full_name, email')
      .returns<Pick<Agent, 'id' | 'full_name' | 'email'>[]>(),
    supabase
      .from('compliance_checks')
      .select('id, lead_id, type')
      .returns<Pick<Check, 'id' | 'lead_id' | 'type'>[]>(),
    supabase
      .from('leads')
      .select('id, full_name')
      .returns<Pick<Lead, 'id' | 'full_name'>[]>(),
  ])

  const audit = auditRes.data ?? []
  const agents = agentsRes.data ?? []
  const checks = checksRes.data ?? []
  const leads = leadsRes.data ?? []

  const agentsById = new Map(agents.map((a) => [a.id, a]))
  const checksById = new Map(checks.map((c) => [c.id, c]))
  const leadsById = new Map(leads.map((l) => [l.id, l]))

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/app/compliance"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Compliance
      </Link>

      <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Audit log
          </p>
          <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
            Historial inmutable
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-steel">
            Toda acción crítica de compliance queda registrada con timestamp,
            usuario y diff. Append-only, sin posibilidad de borrar — solo
            anular con nuevo registro trazado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-3 py-2 text-[12px] text-ink transition-colors hover:border-ink"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export CSV
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-2 text-[12px] text-paper transition-colors hover:bg-coal"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export PDF
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <Filter className="h-3 w-3 shrink-0 text-steel" strokeWidth={1.5} />
        {ACTION_FILTERS.map((f) => {
          const isActive = activeAction === f.value
          return (
            <Link
              key={f.value}
              href={
                f.value === 'all'
                  ? '/app/compliance/audit-log'
                  : `/app/compliance/audit-log?action=${f.value}`
              }
              className={`shrink-0 rounded-[4px] border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                isActive
                  ? 'border-ink bg-ink text-paper'
                  : 'border-bone text-steel hover:border-ink hover:text-ink'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Timeline */}
      {audit.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-12 text-center">
          <ShieldCheck
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-steel">
            Sin entradas con este filtro.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[4px] border border-bone bg-paper">
          <ol className="divide-y divide-bone">
            {audit.map((entry) => {
              const agent = entry.agent_id
                ? agentsById.get(entry.agent_id)
                : null
              const check = checksById.get(entry.check_id)
              const lead = check?.lead_id ? leadsById.get(check.lead_id) : null
              const preview = detailPreview(entry.details)
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-4 px-4 py-3 md:px-5"
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      ACTION_TONE[entry.action] ?? 'bg-bone text-ink'
                    }`}
                  >
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[13px] text-ink">
                        {agent?.full_name ?? 'Sistema'}
                      </span>
                      {check && (
                        <Link
                          href={`/app/compliance/${check.id}`}
                          className="truncate font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-signal"
                        >
                          {check.type.toUpperCase()}
                          {lead && ` · ${lead.full_name}`}
                        </Link>
                      )}
                    </div>
                    {preview && (
                      <p className="mt-1 truncate font-mono text-[11px] text-steel">
                        {preview}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-steel">
                    {dateLong(entry.created_at)}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between font-mono text-[11px] text-steel">
        <p>{audit.length} entradas mostradas</p>
        <p className="inline-flex items-center gap-1.5">
          <History className="h-3 w-3" strokeWidth={1.5} />
          Retención: 10 años (Acuerdo 4-2025 UAF)
        </p>
      </div>
    </div>
  )
}

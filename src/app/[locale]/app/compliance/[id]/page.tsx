import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Circle,
  XCircle,
  History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { categoryLabel, scenarioLabel, type DocCategory, type Scenario } from '@/lib/compliance-docs'
import { ComplianceWorkflow } from './workflow'
import { ComplianceDocUpload } from '@/components/app/compliance-doc-upload'

type Check = Database['public']['Tables']['compliance_checks']['Row']
type Document = Database['public']['Tables']['compliance_documents']['Row']
type AuditEntry = Database['public']['Tables']['compliance_audit_log']['Row']
type Lead = Database['public']['Tables']['leads']['Row']

const TYPE_LABEL = {
  kyc: 'KYC',
  aml: 'AML',
  sanctions: 'Sanciones',
  pep: 'PEP',
} as const

function dateLong(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ACTION_LABEL: Record<string, string> = {
  status_changed: 'Estado actualizado',
  notes_updated: 'Notas actualizadas',
  doc_uploaded: 'Documento subido',
  doc_verified: 'Documento verificado',
  doc_rejected: 'Documento rechazado',
  screening_rerun: 'Screening re-ejecutado',
}

export default async function ComplianceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('compliance')
  const { id } = await params
  const supabase = await createClient()

  const { data: check } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('id', id)
    .maybeSingle<Check>()

  if (!check) notFound()

  const [leadRes, docsRes, auditRes] = await Promise.all([
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
  ])

  const lead = leadRes.data
  const documents = docsRes.data ?? []
  const audit = auditRes.data ?? []

  const docVerified = documents.filter((d) => d.status === 'verified').length
  const docRequired = documents.length

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/app/compliance"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Compliance
      </Link>

      {/* Header */}
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-steel">
          [ {TYPE_LABEL[check.type]} · {check.id.slice(0, 8)} ]
        </p>
        <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
          Verificación {TYPE_LABEL[check.type]}
        </h1>
        {lead && (
          <p className="mt-1 text-[14px] text-steel">
            {t('table.lead')}:{' '}
            <Link
              href={`/app/leads/${lead.id}`}
              className="font-medium text-ink transition-colors hover:text-signal"
            >
              {lead.full_name}
            </Link>
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        {/* === LEFT COLUMN === */}
        <div className="space-y-6">
          {/* Lead snapshot */}
          {lead && (
            <section className="rounded-[4px] border border-bone bg-paper p-5">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Información del cliente
              </h2>
              <dl className="grid gap-4 md:grid-cols-2">
                <Field
                  icon={Mail}
                  label="Email"
                  value={lead.email ?? '—'}
                />
                <Field
                  icon={Phone}
                  label="Teléfono"
                  value={lead.phone ?? '—'}
                />
                <Field
                  icon={Building2}
                  label="Origen"
                  value={lead.origin}
                />
                <Field
                  icon={FileText}
                  label="Estado del lead"
                  value={lead.status ?? 'new'}
                />
              </dl>
            </section>
          )}

          {/* Document checklist — grouped by category */}
          <section className="rounded-[4px] border border-bone bg-paper">
            <header className="flex items-center justify-between border-b border-bone px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-ink" strokeWidth={1.5} />
                <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Documentos requeridos
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-wider text-steel">
                  {scenarioLabel((check.scenario ?? 'sale_buyer') as Scenario)}
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-steel">
                {docVerified}/{docRequired} verificados
              </span>
            </header>

            {documents.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-steel">
                Sin checklist de documentos para este tipo de verificación.
              </p>
            ) : (
              <div className="divide-y divide-bone">
                {groupDocsByCategory(documents).map((group) => (
                  <div key={group.category} className="px-5 py-4">
                    <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                      {categoryLabel(group.category)}
                      <span className="ml-2 tabular-nums text-steel">
                        {group.items.filter((d) => d.status === 'verified').length}/
                        {group.items.filter((d) => d.is_required ?? true).length}
                      </span>
                    </h3>
                    <ul className="space-y-3">
                      {group.items.map((doc) => (
                        <DocRow
                          key={doc.id}
                          doc={doc}
                          checkId={check.id}
                          brokerageId={check.brokerage_id}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Workflow (client) */}
          <ComplianceWorkflow
            checkId={check.id}
            initialStatus={check.status}
            initialRisk={check.risk_level}
            initialNotes={check.notes ?? ''}
            sanctionsMatch={check.sanctions_match ?? false}
            pepMatch={check.pep_match ?? false}
          />

          {/* Audit log */}
          {audit.length > 0 && (
            <section className="rounded-[4px] border border-bone bg-paper p-5">
              <div className="mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-steel" strokeWidth={1.5} />
                <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Historial
                </h2>
              </div>
              <ol className="space-y-3">
                {audit.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 border-l-2 border-bone pl-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink">
                        {ACTION_LABEL[entry.action] ?? entry.action}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-steel">
                        {dateLong(entry.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* === RIGHT SIDEBAR === */}
        <aside className="space-y-4">
          {/* Status pill card */}
          <div className="rounded-[4px] border border-bone bg-paper p-4">
            <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Estado actual
            </p>
            <p className="mt-2 text-[18px] font-medium text-ink">
              {t(`status.${check.status}`)}
            </p>
            {check.risk_level && (
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-steel">
                Riesgo: {t(`risk.${check.risk_level}`)}
              </p>
            )}
          </div>

          {/* Screening result card */}
          <div className="rounded-[4px] border border-bone bg-paper p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Screening
            </p>
            <div className="space-y-2">
              <ScreeningRow
                label="OFAC + ONU + UE"
                positive={check.sanctions_match ?? false}
              />
              <ScreeningRow label="PEP" positive={check.pep_match ?? false} />
            </div>
          </div>

          {/* Due date */}
          <div className="rounded-[4px] border border-bone bg-paper p-4">
            <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Vencimiento
            </p>
            <p className="mt-2 font-mono text-[15px] tabular-nums text-ink">
              {dateLong(check.due_at)}
            </p>
            {check.due_at && new Date(check.due_at) < new Date() && (
              <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-signal">
                <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
                Vencida
              </p>
            )}
          </div>

          {/* Created */}
          <div className="rounded-[4px] border border-bone bg-paper p-4">
            <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Creada
            </p>
            <p className="mt-2 font-mono text-[12px] tabular-nums text-steel">
              {dateLong(check.created_at)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-steel"
        strokeWidth={1.5}
      />
      <div className="min-w-0 flex-1">
        <dt className="font-mono text-[10px] uppercase tracking-wider text-steel">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-[13px] text-ink">{value}</dd>
      </div>
    </div>
  )
}

/**
 * Group documents by category, preserving the order they appear in the
 * data (which mirrors the taxonomy declaration order).
 */
function groupDocsByCategory(docs: Document[]): Array<{
  category: DocCategory
  items: Document[]
}> {
  const order: DocCategory[] = []
  const map = new Map<DocCategory, Document[]>()
  for (const d of docs) {
    const cat = (d.category as DocCategory | null) ?? 'other'
    if (!map.has(cat)) {
      order.push(cat)
      map.set(cat, [])
    }
    map.get(cat)!.push(d)
  }
  return order.map((cat) => ({ category: cat, items: map.get(cat) ?? [] }))
}

function DocRow({
  doc,
  checkId,
  brokerageId,
}: {
  doc: Document
  checkId: string
  brokerageId: string
}) {
  const isUploaded = doc.status !== 'pending'
  const isVerified = doc.status === 'verified'
  const isRejected = doc.status === 'rejected'

  const Icon = isVerified
    ? CheckCircle2
    : isRejected
      ? XCircle
      : Circle

  const iconColor = isVerified
    ? 'text-[#0A6B3D]'
    : isRejected
      ? 'text-signal'
      : isUploaded
        ? 'text-ink'
        : 'text-steel'

  // Display name falls back to the legacy kind label when the new `name`
  // column is null (old rows seeded before the schema migration)
  const displayName = doc.name ?? doc.kind

  return (
    <li className="flex flex-col gap-2 rounded-[4px] border border-bone bg-paper p-3 md:flex-row md:items-start md:gap-3">
      <Icon
        className={`mt-0.5 hidden h-5 w-5 shrink-0 md:block ${iconColor}`}
        strokeWidth={1.5}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 md:hidden ${iconColor}`}
            strokeWidth={1.5}
          />
          <p className="text-[13px] font-medium text-ink">
            {displayName}
            {doc.is_required === false && (
              <span className="ml-2 rounded-[3px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel">
                Opcional
              </span>
            )}
            {doc.is_corporate_only && (
              <span className="ml-2 rounded-[3px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel">
                PJ
              </span>
            )}
          </p>
        </div>
        {doc.description && !isUploaded && (
          <p className="mt-0.5 text-[12px] text-steel">{doc.description}</p>
        )}
        {doc.notes && (
          <p className="mt-1 text-[11px] text-signal">{doc.notes}</p>
        )}
      </div>

      {/* Upload + review controls */}
      <div className="shrink-0 md:w-[260px]">
        <ComplianceDocUpload
          documentId={doc.id}
          brokerageId={brokerageId}
          checkId={checkId}
          initialStatus={doc.status}
          initialFileName={doc.file_name}
          initialFilePath={doc.file_path}
        />
      </div>
    </li>
  )
}

function ScreeningRow({
  label,
  positive,
}: {
  label: string
  positive: boolean
}) {
  const Icon = positive ? ShieldAlert : ShieldCheck
  const color = positive ? 'text-signal' : 'text-[#0A6B3D]'
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[11px] text-ink">{label}</span>
      <span className={`inline-flex items-center gap-1 ${color}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {positive ? 'Match' : 'Limpio'}
        </span>
      </span>
    </div>
  )
}

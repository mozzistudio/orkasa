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
import { ComplianceWorkflow } from './workflow'

type Check = Database['public']['Tables']['compliance_checks']['Row']
type Document = Database['public']['Tables']['compliance_documents']['Row']
type AuditEntry = Database['public']['Tables']['compliance_audit_log']['Row']
type Lead = Database['public']['Tables']['leads']['Row']

const DOC_LABEL: Record<Document['kind'], string> = {
  identity: 'Identificación (cédula / pasaporte)',
  address_proof: 'Comprobante de domicilio (<3 meses)',
  income_proof: 'Comprobante de ingresos',
  funds_origin: 'Declaración de origen de fondos',
  company_existence: 'Certificado de existencia (PJ)',
  company_ubo: 'Identificación de beneficiario final',
  pep_declaration: 'Declaración PEP',
  other: 'Otro',
}

const DOC_HINT: Record<Document['kind'], string> = {
  identity: 'Cédula vigente o pasaporte. Frente y dorso, lectura clara.',
  address_proof:
    'Factura de servicios públicos o estado bancario, máximo 3 meses de antigüedad.',
  income_proof:
    'Estados bancarios últimos 6 meses, declaración de renta o nómina.',
  funds_origin:
    'Declaración firmada explicando el origen de los fondos para esta operación.',
  company_existence:
    'Certificado emitido por el Registro Público, vigencia máxima 30 días.',
  company_ubo:
    'Identificación de cada persona natural con ≥25% de participación.',
  pep_declaration:
    'Declaración firmada sobre exposición política propia y de familiares.',
  other: '',
}

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

          {/* Document checklist */}
          <section className="rounded-[4px] border border-bone bg-paper p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Documentos requeridos
              </h2>
              <span className="font-mono text-[11px] tabular-nums text-steel">
                {docVerified}/{docRequired} verificados
              </span>
            </div>

            {documents.length === 0 ? (
              <p className="text-[13px] text-steel">
                Sin checklist de documentos para este tipo de verificación.
              </p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <DocRow key={doc.id} doc={doc} />
                ))}
              </ul>
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

function DocRow({ doc }: { doc: Document }) {
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

  return (
    <li className="flex items-start gap-3 rounded-[4px] border border-bone bg-paper p-3">
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`}
        strokeWidth={1.5}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">
          {DOC_LABEL[doc.kind]}
        </p>
        {DOC_HINT[doc.kind] && !isUploaded && (
          <p className="mt-0.5 text-[12px] text-steel">{DOC_HINT[doc.kind]}</p>
        )}
        {doc.file_name && (
          <p className="mt-1 truncate font-mono text-[11px] text-steel">
            {doc.file_name}
          </p>
        )}
        {doc.notes && (
          <p className="mt-1 text-[11px] text-signal">{doc.notes}</p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-[4px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
          isVerified
            ? 'bg-[#0A6B3D]/10 text-[#0A6B3D]'
            : isRejected
              ? 'bg-signal/10 text-signal'
              : isUploaded
                ? 'bg-bone text-ink'
                : 'bg-bone/50 text-steel'
        }`}
      >
        {doc.status === 'verified'
          ? 'Verificado'
          : doc.status === 'uploaded'
            ? 'Subido'
            : doc.status === 'rejected'
              ? 'Rechazado'
              : doc.status === 'expired'
                ? 'Vencido'
                : 'Pendiente'}
      </span>
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

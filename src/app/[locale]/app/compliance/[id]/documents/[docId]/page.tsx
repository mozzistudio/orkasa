import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Tag,
  Folder,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { categoryLabel, type DocCategory } from '@/lib/compliance-docs'
import { getDocumentSignedUrl } from '@/app/[locale]/app/compliance/actions'
import { DocumentReviewActions } from './review-actions'
import { DocumentPreview } from './preview'
import type { Database } from '@/lib/database.types'

type Document = Database['public']['Tables']['compliance_documents']['Row']
type Check = Database['public']['Tables']['compliance_checks']['Row']
type Lead = Database['public']['Tables']['leads']['Row']
type Agent = Database['public']['Tables']['agents']['Row']
type Audit = Database['public']['Tables']['compliance_audit_log']['Row']
type DocStatus = Database['public']['Enums']['compliance_doc_status']

const STATUS_LABEL: Record<DocStatus, string> = {
  pending: 'Pendiente',
  uploaded: 'Por revisar',
  verified: 'Verificado',
  rejected: 'Rechazado',
  expired: 'Vencido',
}

const STATUS_TONE: Record<DocStatus, string> = {
  pending: 'bg-bone/50 text-steel',
  uploaded: 'bg-bone text-ink',
  verified: 'bg-[#0A6B3D]/10 text-[#0A6B3D]',
  rejected: 'bg-signal/10 text-signal',
  expired: 'bg-bone text-steel',
}

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

const ACTION_LABEL: Record<string, string> = {
  doc_uploaded: 'Documento subido',
  doc_verified: 'Documento verificado',
  doc_rejected: 'Documento rechazado',
  doc_expired: 'Documento marcado vencido',
}

export default async function DocumentValidationPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id: checkId, docId } = await params
  const supabase = await createClient()

  // Fetch the doc, the parent check + lead, and (best-effort) per-doc audit
  // entries. Audit entries don't have a doc_id column today — we filter on
  // check_id and match by kind in details, which is good enough for the
  // immediate timeline.
  const [docRes, checkRes] = await Promise.all([
    supabase
      .from('compliance_documents')
      .select('*')
      .eq('id', docId)
      .maybeSingle<Document>(),
    supabase
      .from('compliance_checks')
      .select('*')
      .eq('id', checkId)
      .maybeSingle<Check>(),
  ])

  const doc = docRes.data
  const check = checkRes.data
  if (!doc || !check) notFound()

  const [leadRes, verifierRes, auditRes] = await Promise.all([
    check.lead_id
      ? supabase
          .from('leads')
          .select('id, full_name, email')
          .eq('id', check.lead_id)
          .maybeSingle<Pick<Lead, 'id' | 'full_name' | 'email'>>()
      : Promise.resolve({ data: null }),
    doc.verified_by
      ? supabase
          .from('agents')
          .select('id, full_name')
          .eq('id', doc.verified_by)
          .maybeSingle<Pick<Agent, 'id' | 'full_name'>>()
      : Promise.resolve({ data: null }),
    supabase
      .from('compliance_audit_log')
      .select('*')
      .eq('check_id', checkId)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<Audit[]>(),
  ])

  const lead = leadRes.data
  const verifier = verifierRes.data

  // Filter audit to this doc (matches by `kind` in details when available)
  const docAudit = (auditRes.data ?? []).filter((entry) => {
    if (!entry.action.startsWith('doc_')) return false
    const details = (entry.details as Record<string, unknown> | null) ?? {}
    return details.kind === doc.code || details.fileName === doc.file_name
  })

  // Preview signed URL — only attempt if there's an actual file. Demo paths
  // get a sentinel that the preview component handles.
  let signedUrl: string | null = null
  let isDemo = false
  if (doc.file_path) {
    const result = await getDocumentSignedUrl(doc.id)
    if (result.url?.startsWith('#demo-')) {
      isDemo = true
    } else if (result.url) {
      signedUrl = result.url
    }
  }

  const isImage =
    !!doc.file_name &&
    /\.(jpe?g|png|webp|heic|gif)$/i.test(doc.file_name)
  const isPdf =
    !!doc.file_name && /\.pdf$/i.test(doc.file_name)

  const docName = doc.name ?? doc.kind
  const cat = (doc.category as DocCategory | null) ?? 'other'

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/app/compliance/${checkId}`}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Volver al expediente
      </Link>

      {/* Header */}
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
          {categoryLabel(cat)}
          {lead && ` · ${lead.full_name}`}
        </p>
        <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
          {docName}
        </h1>
        {doc.description && (
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-steel">
            {doc.description}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* === LEFT: PREVIEW === */}
        <section>
          <header className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Vista previa
            </h2>
            <span
              className={`rounded-[4px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_TONE[doc.status]}`}
            >
              {STATUS_LABEL[doc.status]}
            </span>
          </header>
          <DocumentPreview
            signedUrl={signedUrl}
            fileName={doc.file_name}
            isImage={isImage}
            isPdf={isPdf}
            isDemo={isDemo}
            hasFile={!!doc.file_path}
          />
        </section>

        {/* === RIGHT: METADATA + ACTIONS === */}
        <aside className="space-y-4">
          {/* Metadata card */}
          <div className="rounded-[4px] border border-bone bg-paper p-4">
            <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Información
            </h3>
            <dl className="space-y-3">
              <Field
                icon={FileText}
                label="Archivo"
                value={doc.file_name ?? 'Sin archivo'}
                mono
              />
              <Field
                icon={Tag}
                label="Código"
                value={doc.code ?? '—'}
                mono
              />
              <Field
                icon={Folder}
                label="Categoría"
                value={categoryLabel(cat)}
              />
              <Field
                icon={Calendar}
                label="Subido"
                value={dateLong(doc.uploaded_at)}
              />
              <Field
                icon={Calendar}
                label="Verificado"
                value={dateLong(doc.verified_at)}
              />
              <Field
                icon={User}
                label="Verificado por"
                value={verifier?.full_name ?? '—'}
              />
              <Field
                icon={Tag}
                label="Estado"
                value={STATUS_LABEL[doc.status]}
              />
              {doc.notes && (
                <div className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-signal">
                    Nota anterior
                  </p>
                  <p className="mt-1 text-[12px] text-signal">{doc.notes}</p>
                </div>
              )}
            </dl>
          </div>

          {/* Validation actions (client) */}
          <DocumentReviewActions
            documentId={doc.id}
            checkId={checkId}
            initialStatus={doc.status}
            initialNotes={doc.notes ?? ''}
            hasFile={!!doc.file_path}
          />

          {/* Quick context: link to parent check + lead */}
          <div className="rounded-[4px] border border-bone bg-paper p-4">
            <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Contexto
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link
                  href={`/app/compliance/${checkId}`}
                  className="block text-ink transition-colors hover:text-signal"
                >
                  Expediente {check.type.toUpperCase()} →
                </Link>
              </li>
              {lead && (
                <li>
                  <Link
                    href={`/app/leads/${lead.id}`}
                    className="block text-ink transition-colors hover:text-signal"
                  >
                    Lead: {lead.full_name} →
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      {/* Audit history specific to this doc */}
      {docAudit.length > 0 && (
        <section className="mt-8 rounded-[4px] border border-bone bg-paper p-5">
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Historial del documento
          </h2>
          <ol className="space-y-3">
            {docAudit.map((entry) => (
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

      {/* Demo notice when applicable */}
      {isDemo && (
        <p className="mt-6 inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-bone/30 px-3 py-2 font-mono text-[11px] text-steel">
          <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
          Documento de muestra · no se incluye archivo real para preview.
        </p>
      )}
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof FileText
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel"
        strokeWidth={1.5}
      />
      <div className="min-w-0 flex-1">
        <dt className="font-mono text-[10px] uppercase tracking-wider text-steel">
          {label}
        </dt>
        <dd
          className={`mt-0.5 truncate text-[13px] text-ink ${mono ? 'font-mono text-[12px]' : ''}`}
        >
          {value}
        </dd>
      </div>
    </div>
  )
}

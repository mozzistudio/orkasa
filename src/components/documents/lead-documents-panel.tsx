'use client'

import { useState, useTransition } from 'react'
import { Check, Clock, Download, ExternalLink, FileText } from 'lucide-react'
import { getDocumentSignedUrl } from '@/app/[locale]/app/compliance/actions'
import { getDocHumanName } from '@/lib/compliance-copy'

export type LeadDocumentRow = {
  id: string
  code: string | null
  kind: string | null
  name: string | null
  category: string | null
  status: string
  file_path: string | null
  file_name: string | null
  uploaded_at: string | null
  verified_at: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  identity: 'Identidad',
  capacity: 'Capacidad financiera',
  sof: 'Origen de fondos',
  sow: 'Origen de patrimonio',
  sanctions_pep: 'Sanciones · PEP',
  property_proof: 'Documentos de la propiedad',
  property_status: 'Paz y salvos',
  corporate: 'Persona jurídica',
  transaction: 'Documentos de la operación',
  audit_trail: 'Auditoría',
  other: 'Otros',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  uploaded: 'Subido',
  verified: 'Verificado',
  rejected: 'Rechazado',
  expired: 'Vencido',
}

type Props = {
  documents: LeadDocumentRow[]
  /** When true, shows only documents that have been uploaded (file_path set).
   *  When false, shows all rows including ones still pending. */
  uploadedOnly?: boolean
}

export function LeadDocumentsPanel({ documents, uploadedOnly = true }: Props) {
  const filtered = uploadedOnly
    ? documents.filter((d) => !!d.file_path)
    : documents

  // Dedupe: same code may appear across multiple compliance checks.
  const seen = new Set<string>()
  const deduped: LeadDocumentRow[] = []
  for (const doc of filtered) {
    const key = `${doc.code ?? doc.kind ?? doc.id}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(doc)
  }

  // Sort: verified first, then uploaded, then others. Within same status, by name.
  const STATUS_ORDER: Record<string, number> = {
    verified: 0,
    uploaded: 1,
    pending: 2,
    rejected: 3,
    expired: 4,
  }
  deduped.sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99
    const sb = STATUS_ORDER[b.status] ?? 99
    if (sa !== sb) return sa - sb
    return getDocHumanName(a).localeCompare(getDocHumanName(b))
  })

  // Group by category for clarity.
  const byCategory = new Map<string, LeadDocumentRow[]>()
  for (const doc of deduped) {
    const cat = doc.category ?? 'other'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(doc)
  }

  if (deduped.length === 0) {
    return (
      <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
        <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft">
          <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
            Documentos
          </h3>
        </div>
        <p className="px-4 py-3 text-[12px] text-steel text-center">
          No hay documentos subidos aún.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5 border-b border-bone-soft flex items-center justify-between">
        <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
          Documentos · {deduped.length}
        </h3>
        <span className="font-mono text-[10px] tabular-nums text-steel-soft">
          {deduped.filter((d) => d.status === 'verified').length} verificados
        </span>
      </div>

      <div className="divide-y divide-bone-soft">
        {[...byCategory.entries()].map(([cat, docs]) => (
          <div key={cat}>
            <div className="px-4 pt-2.5 pb-1.5">
              <span className="font-mono text-[9px] tracking-[1.2px] uppercase text-steel-soft">
                {CATEGORY_LABEL[cat] ?? cat}
              </span>
            </div>
            <ul>
              {docs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function DocumentRow({ doc }: { doc: LeadDocumentRow }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const humanName = getDocHumanName({
    name: doc.name,
    code: doc.code,
    kind: doc.kind,
  })

  function handleOpen(action: 'view' | 'download') {
    setError(null)
    startTransition(async () => {
      const res = await getDocumentSignedUrl(doc.id)
      if (res.error) {
        setError(res.error)
        return
      }
      if (!res.url) {
        setError('No URL')
        return
      }
      // Demo placeholder URLs start with `#demo-` — show a soft message.
      if (res.url.startsWith('#demo-')) {
        setError('Documento de demostración (sin archivo real)')
        return
      }
      if (action === 'download') {
        const a = document.createElement('a')
        a.href = res.url
        a.download = doc.file_name ?? humanName
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      }
    })
  }

  return (
    <li className="px-4 py-2.5 flex items-start gap-3 hover:bg-paper-warm transition-colors">
      <StatusIcon status={doc.status} />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium leading-tight text-ink line-clamp-1">
          {humanName}
        </div>
        <div className="mt-0.5 text-[10.5px] text-steel">
          <span className="font-mono uppercase tracking-[0.6px]">
            {STATUS_LABEL[doc.status] ?? doc.status}
          </span>
          {doc.file_name && (
            <>
              {' · '}
              <span className="text-steel-soft">{doc.file_name}</span>
            </>
          )}
        </div>
        {error && (
          <p className="mt-1 text-[10px] text-signal-deep">{error}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => handleOpen('view')}
          disabled={pending}
          title="Ver documento"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-bone bg-paper-warm text-steel hover:bg-paper hover:text-ink disabled:opacity-50"
        >
          <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => handleOpen('download')}
          disabled={pending}
          title="Descargar"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-bone bg-paper-warm text-steel hover:bg-paper hover:text-ink disabled:opacity-50"
        >
          <Download className="h-3 w-3" strokeWidth={1.5} />
        </button>
      </div>
    </li>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <span className="mt-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-green-mark text-white shrink-0">
        <Check className="h-[10px] w-[10px]" strokeWidth={3} />
      </span>
    )
  }
  if (status === 'uploaded') {
    return (
      <span className="mt-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-amber-mark text-white shrink-0">
        <FileText className="h-[9px] w-[9px]" strokeWidth={2} />
      </span>
    )
  }
  if (status === 'rejected' || status === 'expired') {
    return (
      <span className="mt-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-signal text-white shrink-0">
        <FileText className="h-[9px] w-[9px]" strokeWidth={2} />
      </span>
    )
  }
  return (
    <span className="mt-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full border border-bone bg-paper text-steel-soft shrink-0">
      <Clock className="h-[9px] w-[9px]" strokeWidth={2} />
    </span>
  )
}

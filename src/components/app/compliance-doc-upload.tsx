'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Check,
  X,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  markDocumentUploaded,
  setDocumentStatus,
  getDocumentSignedUrl,
} from '@/app/[locale]/app/compliance/actions'
import type { Database } from '@/lib/database.types'

type DocStatus = Database['public']['Enums']['compliance_doc_status']

type Props = {
  documentId: string
  brokerageId: string
  checkId: string
  /** Initial state of the doc. */
  initialStatus: DocStatus
  initialFileName?: string | null
  initialFilePath?: string | null
  /**
   * Compliance officer perspective — verify / reject. Hidden for the
   * agent-only view (still TODO when role differentiation lands).
   */
  canReview?: boolean
}

const ACCEPTED_MIME =
  'application/pdf,image/jpeg,image/png,image/webp,image/heic'
const MAX_BYTES = 20 * 1024 * 1024 // 20 MB matches the bucket cap

function safeName(original: string): string {
  return original
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80)
}

export function ComplianceDocUpload({
  documentId,
  brokerageId,
  checkId,
  initialStatus,
  initialFileName,
  initialFilePath,
  canReview = true,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<DocStatus>(initialStatus)
  const [fileName, setFileName] = useState<string | null>(
    initialFileName ?? null,
  )
  const [filePath, setFilePath] = useState<string | null>(
    initialFilePath ?? null,
  )

  async function handleFile(file: File) {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError('El archivo excede 20 MB.')
      return
    }
    setUploading(true)
    const supabase = createClient()
    const path = `${brokerageId}/${checkId}/${Date.now()}-${safeName(file.name)}`

    const { error: upErr } = await supabase.storage
      .from('compliance-documents')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (upErr) {
      setUploading(false)
      setError(upErr.message)
      return
    }

    // Persist metadata via server action (also writes audit-log entry)
    startTransition(async () => {
      const result = await markDocumentUploaded(documentId, path, file.name)
      setUploading(false)
      if (result.error) {
        setError(result.error)
        return
      }
      setStatus('uploaded')
      setFileName(file.name)
      setFilePath(path)
      router.refresh()
    })
  }

  async function openFile() {
    if (!filePath) return
    const result = await getDocumentSignedUrl(documentId)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.url?.startsWith('#demo-')) {
      // Demo file — show a soft toast-ish hint instead of opening 404
      setError(
        `Demo: ${fileName ?? 'archivo'} (los documentos de muestra no son descargables)`,
      )
      return
    }
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  function review(next: DocStatus) {
    setError(null)
    startTransition(async () => {
      const result = await setDocumentStatus(documentId, next)
      if (result.error) {
        setError(result.error)
        return
      }
      setStatus(next)
      router.refresh()
    })
  }

  // === Rendering ===
  const isUploaded = status !== 'pending'
  const isVerified = status === 'verified'
  const isRejected = status === 'rejected'
  const busy = uploading || pending

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        {/* File chip — clickable when uploaded */}
        {isUploaded && fileName ? (
          <button
            type="button"
            onClick={openFile}
            className="inline-flex max-w-full items-center gap-1.5 truncate rounded-[4px] border border-bone bg-bone/40 px-2.5 py-1 font-mono text-[11px] text-ink transition-colors hover:border-ink"
            title={fileName}
          >
            <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{fileName}</span>
          </button>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-wider text-steel">
            Sin archivo
          </span>
        )}

        {/* Upload / replace */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
          ) : isUploaded ? (
            <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
          ) : (
            <Upload className="h-3 w-3" strokeWidth={1.5} />
          )}
          {isUploaded ? 'Reemplazar' : 'Subir'}
        </button>

        {/* Review actions — only when there's a file to review and not in
            terminal state */}
        {canReview && isUploaded && status !== 'verified' && (
          <button
            type="button"
            onClick={() => review('verified')}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-[#0A6B3D]/30 bg-[#0A6B3D]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#0A6B3D] transition-colors hover:bg-[#0A6B3D] hover:text-paper disabled:opacity-60"
          >
            <Check className="h-3 w-3" strokeWidth={2} />
            Validar
          </button>
        )}
        {canReview && isUploaded && status !== 'rejected' && (
          <button
            type="button"
            onClick={() => review('rejected')}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-signal/30 bg-signal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-signal transition-colors hover:bg-signal hover:text-paper disabled:opacity-60"
          >
            <X className="h-3 w-3" strokeWidth={2} />
            Rechazar
          </button>
        )}
      </div>

      {error && (
        <p className="font-mono text-[11px] text-signal">{error}</p>
      )}

      {/* Status hint when verified/rejected */}
      {isVerified && (
        <p className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#0A6B3D]">
          <Check className="h-3 w-3" strokeWidth={2} />
          Verificado
        </p>
      )}
      {isRejected && (
        <p className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-signal">
          <X className="h-3 w-3" strokeWidth={2} />
          Rechazado · pedir re-subida
        </p>
      )}
    </div>
  )
}

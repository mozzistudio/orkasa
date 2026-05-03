'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, X } from 'lucide-react'
import {
  TEMPLATES,
  type SignatureTemplate,
  type SignatureDocument,
} from '@/lib/signatures/types'
import { buildReminderUrl } from '@/lib/whatsapp-templates'
import {
  createSignatureDocument,
  markSignatureSent,
  cancelSignatureDocument,
} from './signature-actions'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  viewed: 'Visto',
  signed: 'Firmado',
  expired: 'Expirado',
  cancelled: 'Cancelado',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-bone-soft text-steel',
  sent: 'bg-amber-bg text-amber-text',
  viewed: 'bg-amber-bg text-amber-text',
  signed: 'bg-green-bg text-green-text',
  expired: 'bg-bone-soft text-steel',
  cancelled: 'bg-bone-soft text-steel',
}

export function OwnerDocuments({
  propertyId,
  signatures,
  ownerName,
  ownerPhone,
  propertyTitle,
}: {
  propertyId: string
  signatures: SignatureDocument[]
  ownerName: string | null
  ownerPhone: string | null
  propertyTitle: string
}) {
  const router = useRouter()
  const [showPicker, setShowPicker] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreate(type: SignatureTemplate) {
    setError(null)
    startTransition(async () => {
      const result = await createSignatureDocument(propertyId, type)
      if (result.error) {
        setError(result.error)
        return
      }
      setShowPicker(false)
      router.refresh()
    })
  }

  function handleSendWhatsApp(sig: SignatureDocument) {
    if (!ownerPhone) return
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${baseUrl}/sign/${sig.signing_token}`
    const message = `Hola ${ownerName ?? sig.signer_name}, te escribo de Orkasa. Para avanzar con ${propertyTitle}, por favor firmá este documento: ${sig.title}.\n\nLink: ${link}\n\nEs rápido, podés firmar desde el celular. Cualquier duda me escribís.`
    startTransition(async () => {
      await markSignatureSent(propertyId, sig.id)
      window.open(buildReminderUrl(ownerPhone, message), '_blank')
      router.refresh()
    })
  }

  function handleCancel(sig: SignatureDocument) {
    if (!confirm(`¿Cancelar "${sig.title}"?`)) return
    startTransition(async () => {
      await cancelSignatureDocument(propertyId, sig.id)
      router.refresh()
    })
  }

  function handleCopyLink(sig: SignatureDocument) {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${baseUrl}/sign/${sig.signing_token}`
    navigator.clipboard.writeText(link)
  }

  const activeSigs = signatures.filter((s) => s.status !== 'cancelled')

  return (
    <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
        <h3 className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
          Documentos
        </h3>
        {!showPicker && (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            disabled={!ownerName}
            className="text-[11px] text-steel hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-0.5"
            title={
              !ownerName
                ? 'Agregá un nombre del propietario primero'
                : undefined
            }
          >
            <Plus className="h-[11px] w-[11px]" strokeWidth={1.5} />
            Crear
          </button>
        )}
      </div>

      <div className="px-4 pb-3.5">
        {showPicker && (
          <div className="mb-3 space-y-1.5 rounded-[8px] border border-bone bg-paper-warm p-2">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="font-mono text-[9px] tracking-[1.2px] uppercase text-steel">
                Elegí plantilla
              </span>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-steel hover:text-ink"
              >
                <X className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </div>
            {(Object.values(TEMPLATES) as Array<(typeof TEMPLATES)[SignatureTemplate]>).map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => handleCreate(t.type)}
                disabled={pending}
                className="w-full text-left px-2.5 py-2 rounded-[6px] hover:bg-paper transition-colors disabled:opacity-50"
              >
                <div className="text-[12px] font-medium text-ink">
                  {t.label}
                </div>
                <div className="text-[11px] text-steel leading-snug mt-0.5">
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="mb-2 rounded-[4px] bg-signal-bg px-2 py-1.5 text-[11px] text-signal-deep">
            {error}
          </p>
        )}

        {activeSigs.length === 0 && !showPicker && (
          <p className="py-3 text-[12px] text-steel text-center">
            Sin documentos. Tocá "Crear" para empezar.
          </p>
        )}

        {activeSigs.map((sig) => {
          const meta = TEMPLATES[sig.template_type]
          const status = sig.status
          const isFinal = status === 'signed'
          return (
            <div
              key={sig.id}
              className="flex flex-col gap-2 py-2.5 border-b border-bone-soft last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <FileText
                  className="h-[13px] w-[13px] text-steel mt-0.5 shrink-0"
                  strokeWidth={1.5}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-ink leading-tight truncate">
                    {meta.label}
                  </div>
                  <div className="font-mono text-[10px] text-steel mt-0.5">
                    {sig.signed_at
                      ? `Firmado ${new Date(sig.signed_at).toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}`
                      : sig.sent_at
                        ? `Enviado ${new Date(sig.sent_at).toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}`
                        : `Creado ${sig.created_at ? new Date(sig.created_at).toLocaleDateString('es-PA', { day: 'numeric', month: 'short' }) : ''}`}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-[9px] tracking-[0.7px] uppercase px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[status]}`}
                >
                  {STATUS_LABEL[status]}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pl-[19px]">
                <a
                  href={`/sign/${sig.signing_token}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-steel hover:text-ink underline-offset-2 hover:underline"
                >
                  Ver PDF
                </a>
                {!isFinal && status !== 'expired' && (
                  <>
                    <span className="text-steel-soft">·</span>
                    {ownerPhone ? (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(sig)}
                        disabled={pending}
                        className="text-[11px] text-whatsapp-deep hover:text-whatsapp underline-offset-2 hover:underline"
                      >
                        {status === 'draft'
                          ? 'Enviar por WhatsApp'
                          : 'Reenviar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(sig)}
                        className="text-[11px] text-steel hover:text-ink underline-offset-2 hover:underline"
                      >
                        Copiar link
                      </button>
                    )}
                    <span className="text-steel-soft">·</span>
                    <button
                      type="button"
                      onClick={() => handleCancel(sig)}
                      disabled={pending}
                      className="text-[11px] text-steel hover:text-signal-deep underline-offset-2 hover:underline"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

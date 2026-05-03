'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { addLeadInteraction } from '@/app/[locale]/app/leads/actions'
import { buildReminderUrl } from '@/lib/whatsapp-templates'

const DOC_LABELS: Record<string, string> = {
  identity: 'Cédula / Pasaporte',
  address_proof: 'Comprobante de domicilio',
  income_proof: 'Comprobante de ingresos',
  bank_statements: 'Estados de cuenta bancarios',
  funds_origin: 'Declaración origen de fondos',
  tax_return: 'Declaración de renta',
  company_existence: 'Certificado de existencia',
  company_ubo: 'Beneficiario final',
  pep_declaration: 'Declaración PEP',
  seller_title: 'Escritura / Título de propiedad',
  seller_paz_y_salvo: 'Paz y salvo',
}

type Props = {
  open: boolean
  onClose: () => void
  leadId: string
  docCodes?: string[]
  target?: string
  phone?: string
  clientName?: string
}

export function RequestDocModal({
  open,
  onClose,
  leadId,
  docCodes = [],
  target = 'buyer',
  phone,
  clientName,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  const docLabels = docCodes.map((code) => DOC_LABELS[code] ?? code)

  function buildWhatsAppMessage() {
    const name = clientName ?? 'Cliente'
    const docs = docLabels.join('\n- ')
    return `Hola ${name}, te escribo de Orkasa. Para avanzar con tu trámite necesitamos los siguientes documentos:\n\n- ${docs}\n\nPodés enviarlos por acá o subirlos al portal. ¡Gracias!`
  }

  function handleWhatsApp() {
    if (!phone) return
    window.open(buildReminderUrl(phone, buildWhatsAppMessage()), '_blank')
    handleMarkRequested()
  }

  function handleMarkRequested() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('type', 'doc_request')
      fd.set(
        'content',
        `Documentos solicitados (${target}): ${docLabels.join(', ')}`,
      )
      await addLeadInteraction(leadId, fd)
      setSent(true)
      setTimeout(onClose, 800)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSent(false); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar documentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            {target === 'seller' ? 'Al vendedor' : 'Al comprador'}
          </p>

          <ul className="space-y-1.5">
            {docLabels.map((label) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-[4px] border border-bone bg-paper-warm px-3 py-2 text-[13px] text-ink"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                {label}
              </li>
            ))}
          </ul>

          {sent && (
            <p className="text-[12px] text-green-text font-medium">
              Solicitud registrada
            </p>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            {phone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={isPending || sent}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#25D366] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#20BD5A] disabled:opacity-50"
              >
                {isPending ? 'Enviando...' : 'Enviar por WhatsApp'}
              </button>
            )}
            <button
              type="button"
              onClick={handleMarkRequested}
              disabled={isPending || sent}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-[4px] border border-bone bg-paper px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-bone-soft disabled:opacity-50"
            >
              {isPending ? 'Marcando...' : 'Marcar como pedido'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

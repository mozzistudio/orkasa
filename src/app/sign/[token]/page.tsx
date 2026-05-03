import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATES } from '@/lib/signatures/types'
import type { SignatureDocument } from '@/lib/signatures/types'
import { SignForm } from './sign-form'
import { markViewed } from './actions'

export const dynamic = 'force-dynamic'

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('signature_documents')
    .select('*')
    .eq('signing_token', token)
    .maybeSingle<SignatureDocument>()

  if (!doc) notFound()

  // Track first view
  if (doc.status === 'sent') {
    await markViewed(token)
  }

  const meta = TEMPLATES[doc.template_type]
  const isSigned = doc.status === 'signed'
  const isExpired =
    doc.expires_at != null && new Date(doc.expires_at) < new Date()
  const isCancelled = doc.status === 'cancelled' || doc.status === 'expired'

  return (
    <div className="min-h-screen bg-paper-warm">
      <header className="border-b border-bone bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-ink text-white flex items-center justify-center font-mono text-[14px] font-medium">
            O
          </div>
          <div>
            <div className="text-[14px] font-medium text-ink leading-tight">
              orkasa
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
              Firma electrónica · Ley 51 de 2008
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <section className="rounded-[12px] border border-bone bg-paper p-6">
          <div className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel mb-2">
            {meta.label}
          </div>
          <h1 className="text-[22px] font-medium tracking-[-0.4px] text-ink">
            {doc.title}
          </h1>
          <p className="mt-1 text-[13px] text-steel">
            Para firmar:{' '}
            <strong className="text-ink font-medium">
              {doc.signer_name}
            </strong>
          </p>
        </section>

        <section className="rounded-[12px] border border-bone bg-paper overflow-hidden">
          <div className="px-4 py-3 border-b border-bone flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-[1.4px] uppercase text-steel">
              Documento
            </div>
            <a
              href={`/sign/${token}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-steel hover:text-ink underline-offset-4 hover:underline"
            >
              Descargar PDF
            </a>
          </div>
          <iframe
            src={`/sign/${token}/pdf`}
            className="w-full h-[600px] bg-bone-soft"
            title="Documento a firmar"
          />
        </section>

        {isCancelled && (
          <section className="rounded-[12px] border border-bone bg-paper p-6 text-center">
            <p className="text-[14px] text-signal-deep font-medium">
              Este documento ha sido cancelado.
            </p>
          </section>
        )}

        {!isCancelled && isExpired && !isSigned && (
          <section className="rounded-[12px] border border-bone bg-paper p-6 text-center">
            <p className="text-[14px] text-signal-deep font-medium">
              Este enlace ha expirado. Pedí uno nuevo a tu corredor.
            </p>
          </section>
        )}

        {isSigned && (
          <section className="rounded-[12px] border border-green-mark bg-green-bg p-6">
            <div className="font-mono text-[10px] tracking-[1.4px] uppercase text-green-text mb-1">
              ✓ Firmado
            </div>
            <p className="text-[14px] text-green-text">
              Firmado por <strong>{doc.signature_typed}</strong> el{' '}
              {doc.signed_at
                ? new Date(doc.signed_at).toLocaleString('es-PA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
              .
            </p>
            <p className="text-[12px] text-green-text/80 mt-2">
              Una copia con el certificado de firma está disponible para descargar arriba.
            </p>
          </section>
        )}

        {!isSigned && !isExpired && !isCancelled && (
          <SignForm
            token={token}
            defaultName={doc.signer_name}
            documentTitle={doc.title}
          />
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="font-mono text-[10px] tracking-[1.2px] uppercase text-steel">
          orkasa · firma electrónica simple
        </p>
      </footer>
    </div>
  )
}

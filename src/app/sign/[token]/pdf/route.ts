import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildTemplate, stampSignedPdf } from '@/lib/signatures/pdf-templates'
import type { SignatureDocument, TemplateData } from '@/lib/signatures/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('signature_documents')
    .select('*')
    .eq('signing_token', token)
    .maybeSingle<SignatureDocument>()

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const templateData = doc.template_data as TemplateData | null
  if (!templateData) {
    return NextResponse.json(
      { error: 'Template data missing' },
      { status: 500 },
    )
  }

  const original = await buildTemplate(doc.template_type, templateData)

  let pdfBytes: Uint8Array = original
  if (doc.status === 'signed' && doc.signature_typed && doc.signed_at) {
    pdfBytes = await stampSignedPdf(original, {
      typedName: doc.signature_typed,
      signedAt: new Date(doc.signed_at),
      ip: doc.signature_ip ?? 'unknown',
      userAgent: doc.signature_user_agent ?? 'unknown',
      documentTitle: doc.title,
      signerPhone: doc.signer_phone,
      signerEmail: doc.signer_email,
    })
  }

  // Convert Uint8Array to a proper ArrayBuffer that Response accepts
  const buf = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${doc.title.replace(/[^\w-]/g, '_')}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}

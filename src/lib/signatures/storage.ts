import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const BUCKET = 'signature-documents'

export async function uploadPdf(
  supabase: SupabaseClient<Database>,
  brokerageId: string,
  fileName: string,
  pdfBytes: Uint8Array,
): Promise<{ path: string } | { error: string }> {
  const path = `${brokerageId}/${fileName}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (error) return { error: error.message }
  return { path }
}

export async function getSignedPdfUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}

export async function downloadPdf(
  supabase: SupabaseClient<Database>,
  path: string,
): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}

export function pdfFileName(
  signatureId: string,
  signed: boolean,
): string {
  return signed
    ? `${signatureId}-signed.pdf`
    : `${signatureId}-original.pdf`
}

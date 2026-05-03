'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SignatureDocument } from '@/lib/signatures/types'

export async function markViewed(token: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('signature_documents')
    .update({
      status: 'viewed',
      viewed_at: new Date().toISOString(),
    })
    .eq('signing_token', token)
    .eq('status', 'sent')
}

export async function signDocument(
  token: string,
  typedName: string,
): Promise<{ error?: string }> {
  if (!typedName.trim()) return { error: 'Nombre requerido' }

  const supabase = await createClient()
  const h = await headers()
  const ip =
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    'unknown'
  const userAgent = h.get('user-agent') ?? 'unknown'

  const { data: doc } = await supabase
    .from('signature_documents')
    .select('*')
    .eq('signing_token', token)
    .maybeSingle<SignatureDocument>()

  if (!doc) return { error: 'Documento no encontrado' }
  if (doc.status === 'signed') return { error: 'Documento ya firmado' }
  if (doc.status === 'cancelled') return { error: 'Documento cancelado' }
  if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
    return { error: 'Este enlace ha expirado' }
  }

  const { error } = await supabase
    .from('signature_documents')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signature_typed: typedName,
      signature_ip: ip,
      signature_user_agent: userAgent,
    })
    .eq('signing_token', token)

  if (error) return { error: error.message }

  revalidatePath(`/sign/${token}`)
  revalidatePath(`/app/properties/${doc.property_id}`)
  return {}
}

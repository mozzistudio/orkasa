'use server'

import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATES, type SignatureTemplate, type TemplateData } from '@/lib/signatures/types'

export async function createSignatureDocument(
  propertyId: string,
  templateType: SignatureTemplate,
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: property, error: propErr } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle()

  if (propErr || !property) return { error: 'Propiedad no encontrada' }
  if (!property.owner_name) {
    return { error: 'Falta el nombre del propietario en la ficha de la propiedad' }
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ full_name: string; brokerage_id: string | null }>()

  const { data: brokerage } = property.brokerage_id
    ? await supabase
        .from('brokerages')
        .select('name')
        .eq('id', property.brokerage_id)
        .maybeSingle<{ name: string }>()
    : { data: null }

  const meta = TEMPLATES[templateType]
  const title = meta.defaultTitle(property.title)

  const templateData: TemplateData = {
    property: {
      title: property.title,
      address: property.address,
      neighborhood: property.neighborhood,
      city: property.city,
      price: property.price ? Number(property.price) : null,
      currency: property.currency,
      property_type: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
      area_m2: property.area_m2 ? Number(property.area_m2) : null,
    },
    owner: {
      name: property.owner_name,
      phone: property.owner_phone,
      email: property.owner_email,
    },
    brokerage: { name: brokerage?.name ?? 'Orkasa' },
    agent: { name: agent?.full_name ?? null },
  }

  const token = randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: created, error } = await supabase
    .from('signature_documents')
    .insert({
      property_id: propertyId,
      brokerage_id: property.brokerage_id,
      agent_id: user.id,
      template_type: templateType,
      title,
      signing_token: token,
      signer_name: property.owner_name,
      signer_phone: property.owner_phone,
      signer_email: property.owner_email,
      template_data: templateData,
      expires_at: expiresAt,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }

  revalidatePath(`/app/properties/${propertyId}`)
  return { id: created.id }
}

export async function markSignatureSent(
  propertyId: string,
  signatureId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('signature_documents')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', signatureId)

  if (error) return { error: error.message }
  revalidatePath(`/app/properties/${propertyId}`)
  return {}
}

export async function cancelSignatureDocument(
  propertyId: string,
  signatureId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('signature_documents')
    .update({ status: 'cancelled' })
    .eq('id', signatureId)

  if (error) return { error: error.message }
  revalidatePath(`/app/properties/${propertyId}`)
  return {}
}

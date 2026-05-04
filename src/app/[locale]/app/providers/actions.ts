'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const SERVICE_TYPES = [
  'notario',
  'abogado',
  'banco',
  'tasador',
  'inspector',
  'topografo',
  'registro_publico',
  'aseguradora',
  'contador',
  'otro',
] as const

type ServiceType = (typeof SERVICE_TYPES)[number]

function isValidServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value)
}

function str(formData: FormData, key: string): string | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  return v.length > 0 ? v : null
}

type BrokerageAuth =
  | { ok: true; brokerageId: string }
  | { ok: false; error: string }

async function getBrokerageId(): Promise<BrokerageAuth> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) return { ok: false, error: 'No brokerage' }
  return { ok: true, brokerageId: agent.brokerage_id }
}

export async function createProvider(
  formData: FormData,
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const auth = await getBrokerageId()
  if (!auth.ok) return { error: auth.error }

  const serviceType = (formData.get('service_type') as string) ?? ''
  if (!isValidServiceType(serviceType)) {
    return { error: 'Tipo de servicio inválido' }
  }
  const name = str(formData, 'name')
  if (!name) return { error: 'Nombre requerido' }

  const isPrimary = formData.get('is_primary') === 'on'

  const { data, error } = await supabase
    .from('providers')
    .insert({
      brokerage_id: auth.brokerageId,
      service_type: serviceType,
      name,
      company: str(formData, 'company'),
      phone: str(formData, 'phone'),
      email: str(formData, 'email'),
      tax_id: str(formData, 'tax_id'),
      license_number: str(formData, 'license_number'),
      address: str(formData, 'address'),
      city: str(formData, 'city'),
      notes: str(formData, 'notes'),
      is_primary: isPrimary,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        error: 'Ya hay un proveedor primario para este tipo. Desmarcalo primero.',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/app/providers')
  return { id: data.id }
}

export async function updateProvider(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const auth = await getBrokerageId()
  if (!auth.ok) return { error: auth.error }

  const serviceType = (formData.get('service_type') as string) ?? ''
  if (!isValidServiceType(serviceType)) {
    return { error: 'Tipo de servicio inválido' }
  }
  const name = str(formData, 'name')
  if (!name) return { error: 'Nombre requerido' }

  const isPrimary = formData.get('is_primary') === 'on'

  const { error } = await supabase
    .from('providers')
    .update({
      service_type: serviceType,
      name,
      company: str(formData, 'company'),
      phone: str(formData, 'phone'),
      email: str(formData, 'email'),
      tax_id: str(formData, 'tax_id'),
      license_number: str(formData, 'license_number'),
      address: str(formData, 'address'),
      city: str(formData, 'city'),
      notes: str(formData, 'notes'),
      is_primary: isPrimary,
    })
    .eq('id', id)
    .eq('brokerage_id', auth.brokerageId)

  if (error) {
    if (error.code === '23505') {
      return {
        error: 'Ya hay un proveedor primario para este tipo. Desmarcalo primero.',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/app/providers')
  return {}
}

export async function deleteProvider(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const auth = await getBrokerageId()
  if (!auth.ok) return { error: auth.error }

  const { error } = await supabase
    .from('providers')
    .delete()
    .eq('id', id)
    .eq('brokerage_id', auth.brokerageId)

  if (error) return { error: error.message }
  revalidatePath('/app/providers')
  return {}
}

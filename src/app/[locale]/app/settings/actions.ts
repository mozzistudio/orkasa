'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const phone = ((formData.get('phone') as string) || '').trim() || null

  if (!fullName) return { error: 'Nombre requerido' }

  const { error } = await supabase
    .from('agents')
    .update({ full_name: fullName, phone })
    .eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/app/settings')
  revalidatePath('/app')
  return {}
}

export async function updateBrokerage(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const name = (formData.get('brokerage_name') as string)?.trim()
  const ruc = ((formData.get('ruc') as string) || '').trim() || null
  const country = (formData.get('country') as string)?.trim() || 'PA'

  if (!name) return { error: 'Nombre de agencia requerido' }

  // We need brokerage_id from the agent
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()

  if (!agent?.brokerage_id) return { error: 'No brokerage' }

  const { error } = await supabase
    .from('brokerages')
    .update({ name, ruc, country_code: country })
    .eq('id', agent.brokerage_id)

  if (error) return { error: error.message }

  revalidatePath('/app/settings')
  return {}
}

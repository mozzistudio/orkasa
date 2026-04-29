'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  getProviderMeta,
  type IntegrationProvider,
} from '@/lib/integrations'
import type { Database } from '@/lib/database.types'

type Insert = Database['public']['Tables']['integrations']['Insert']

export async function connectIntegration(
  provider: IntegrationProvider,
  formData: FormData,
): Promise<{ error?: string }> {
  const meta = getProviderMeta(provider)
  if (!meta) return { error: 'Unknown provider' }
  if (!meta.available) {
    return {
      error:
        'Esta integración aún no está disponible. Estará en una próxima release.',
    }
  }

  const supabase = await createClient()
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

  // Read all credential fields declared in provider meta
  const credentials: Record<string, string> = {}
  for (const f of meta.credentialFields ?? []) {
    const v = (formData.get(f.key) as string)?.trim()
    if (!v) {
      return { error: `Falta el campo "${f.label}"` }
    }
    credentials[f.key] = v
  }

  const accountLabel =
    (formData.get('account_label') as string)?.trim() || meta.label

  const insert: Insert = {
    brokerage_id: agent.brokerage_id,
    provider,
    status: 'connected',
    credentials,
    account_label: accountLabel,
  }

  // Upsert (one per brokerage+provider)
  const { error } = await supabase
    .from('integrations')
    .upsert(insert, { onConflict: 'brokerage_id,provider' })

  if (error) return { error: error.message }

  revalidatePath('/app/integrations')
  return {}
}

export async function disconnectIntegration(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('integrations').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/integrations')
  return {}
}

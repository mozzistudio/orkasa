'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result =
  | { ok: true; message?: string }
  | { ok: false; error: string }

async function requireBrokerage(): Promise<{
  brokerageId: string
  agentId: string
} | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()
  if (!agent?.brokerage_id) return { error: 'Sin brokerage asignado' }
  return { brokerageId: agent.brokerage_id, agentId: user.id }
}

export async function archiveProperty(id: string): Promise<Result> {
  const ctx = await requireBrokerage()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('brokerage_id', ctx.brokerageId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/properties')
  return { ok: true, message: 'Propiedad archivada' }
}

export async function duplicateProperty(id: string): Promise<Result> {
  const ctx = await requireBrokerage()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const supabase = await createClient()
  const { data: original } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('brokerage_id', ctx.brokerageId)
    .maybeSingle()
  if (!original) return { ok: false, error: 'Propiedad no encontrada' }

  const {
    id: _id,
    created_at: _ca,
    updated_at: _ua,
    ...rest
  } = original
  const { error } = await supabase.from('properties').insert({
    ...rest,
    title: `${rest.title} (copia)`,
    status: 'draft',
    is_boosted: false,
    price_history: [],
    listing_expires_at: null,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/properties')
  return { ok: true, message: 'Propiedad duplicada' }
}

export async function boostProperty(id: string): Promise<Result> {
  const ctx = await requireBrokerage()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update({ is_boosted: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('brokerage_id', ctx.brokerageId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/properties')
  return { ok: true, message: 'Listing boosteado' }
}

export async function renewListing(id: string, daysAhead = 30): Promise<Result> {
  const ctx = await requireBrokerage()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const supabase = await createClient()
  const expiresAt = new Date(
    Date.now() + daysAhead * 24 * 60 * 60 * 1000,
  ).toISOString()
  const { error } = await supabase
    .from('properties')
    .update({ listing_expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('brokerage_id', ctx.brokerageId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/properties')
  return { ok: true, message: `Listing renovado por ${daysAhead} días` }
}

export async function publishDraft(id: string): Promise<Result> {
  const ctx = await requireBrokerage()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('brokerage_id', ctx.brokerageId)
    .eq('status', 'draft')
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/properties')
  return { ok: true, message: 'Propiedad publicada' }
}

export async function bulkArchiveProperties(ids: string[]): Promise<Result> {
  const ctx = await requireBrokerage()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  if (ids.length === 0) return { ok: false, error: 'Sin propiedades seleccionadas' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('brokerage_id', ctx.brokerageId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/properties')
  return { ok: true, message: `${ids.length} propiedades archivadas` }
}

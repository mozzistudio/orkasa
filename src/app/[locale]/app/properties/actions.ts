'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

const PropertyTypes = ['apartment', 'house', 'condo', 'land', 'commercial'] as const
const ListingTypes = ['sale', 'rent'] as const
const PropertyStatuses = [
  'draft',
  'active',
  'pending',
  'sold',
  'rented',
  'archived',
] as const

const imageSchema = z.array(
  z.object({ path: z.string(), url: z.string().url() }),
)

const propertySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  property_type: z.enum(PropertyTypes),
  listing_type: z.enum(ListingTypes),
  status: z.enum(PropertyStatuses).default('draft'),
  price: z.coerce.number().positive().nullable().optional(),
  currency: z.string().min(3).max(3).default('USD'),
  bedrooms: z.coerce.number().int().min(0).nullable().optional(),
  bathrooms: z.coerce.number().min(0).nullable().optional(),
  area_m2: z.coerce.number().positive().nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  neighborhood: z.string().max(120).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  external_id: z.string().max(60).nullable().optional(),
  images: z
    .string()
    .optional()
    .transform((s) => {
      if (!s) return []
      try {
        return imageSchema.parse(JSON.parse(s))
      } catch {
        return []
      }
    }),
})

type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

function readForm(formData: FormData) {
  const raw = Object.fromEntries(formData)
  // Coerce empty strings to null so optional fields don't become ''
  const cleaned: Record<string, FormDataEntryValue | null> = {}
  for (const [k, v] of Object.entries(raw)) {
    cleaned[k] = typeof v === 'string' && v.trim() === '' ? null : v
  }
  return cleaned
}

export async function createProperty(
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Look up the brokerage_id for this user (RLS-friendly)
  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()

  if (!agent?.brokerage_id) {
    return { error: 'No brokerage associated with this account' }
  }

  const parsed = propertySchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  // The form pre-generates a UUID for the new row (so image uploads can use
  // the eventual property_id in the storage path). Use it if provided.
  const preGeneratedId = formData.get('property_id')
  const id =
    typeof preGeneratedId === 'string' && preGeneratedId.length > 0
      ? preGeneratedId
      : undefined

  const insert: PropertyInsert = {
    ...parsed.data,
    ...(id ? { id } : {}),
    brokerage_id: agent.brokerage_id,
    agent_id: user.id,
  }

  const { data: created, error } = await supabase
    .from('properties')
    .insert(insert)
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }

  revalidatePath('/app/properties')
  revalidatePath('/app')

  // Optional `next` field steers post-save redirect:
  // - 'publish' → go straight to the publication wizard (Phase 2 of the flow)
  // - default   → go to property detail page
  const next = formData.get('next')
  if (next === 'publish') {
    redirect(`/app/properties/${created.id}/publish`)
  }
  redirect(`/app/properties/${created.id}`)
}

export async function updateProperty(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const parsed = propertySchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const update: PropertyUpdate = parsed.data

  const { error } = await supabase
    .from('properties')
    .update(update)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/app/properties')
  revalidatePath(`/app/properties/${id}`)
  revalidatePath('/app')
  redirect(`/app/properties/${id}`)
}

export async function deleteProperty(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('properties').delete().eq('id', id)
  revalidatePath('/app/properties')
  revalidatePath('/app')
  redirect('/app/properties')
}

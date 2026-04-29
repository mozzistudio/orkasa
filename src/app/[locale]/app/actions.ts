'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function seedDemoData(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('seed_demo_data')
  if (error) {
    return { error: error.message }
  }
  revalidatePath('/app')
  revalidatePath('/app/properties')
  return {}
}

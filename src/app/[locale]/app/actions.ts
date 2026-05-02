'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function logDashboardWhatsApp(
  leadId: string,
  templateType: string,
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('lead_interactions').insert({
    lead_id: leadId,
    agent_id: user.id,
    type: 'whatsapp',
    content: `Reactivación WhatsApp (${templateType})`,
    metadata: { source: 'dashboard', template: templateType },
  })
}

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

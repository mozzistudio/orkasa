'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const VALID_STATUSES = [
  'pending',
  'in_review',
  'approved',
  'rejected',
  'requires_action',
] as const

export async function updateComplianceStatus(
  id: string,
  status: (typeof VALID_STATUSES)[number],
  riskLevel?: 'low' | 'medium' | 'high' | 'critical' | null,
): Promise<{ error?: string }> {
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return { error: 'Invalid status' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_checks')
    .update({
      status,
      risk_level: riskLevel ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/app/compliance')
  return {}
}

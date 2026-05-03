import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const ACTIVE_LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'negotiating',
] as const

type AssignableAgent = {
  id: string
  full_name: string
  active_count: number
  last_assigned_at: string | null
}

/**
 * Round-robin agent picker. Pass an explicit client (e.g. service-role)
 * when calling from a webhook or cron — otherwise the cookie-bound
 * default is used.
 */
export async function pickNextAgent(
  brokerageId: string,
  client?: SupabaseClient<Database>,
): Promise<{ id: string; full_name: string } | null> {
  const supabase = client ?? (await createClient())

  const { data: agents } = await supabase
    .from('agents')
    .select('id, full_name')
    .eq('brokerage_id', brokerageId)
    .returns<Array<{ id: string; full_name: string }>>()

  if (!agents || agents.length === 0) return null

  const counts = await Promise.all(
    agents.map(async (agent) => {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('brokerage_id', brokerageId)
        .eq('assigned_agent_id', agent.id)
        .in('status', ACTIVE_LEAD_STATUSES)

      const { data: lastLead } = await supabase
        .from('leads')
        .select('created_at')
        .eq('brokerage_id', brokerageId)
        .eq('assigned_agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string }>()

      return {
        id: agent.id,
        full_name: agent.full_name,
        active_count: count ?? 0,
        last_assigned_at: lastLead?.created_at ?? null,
      } as AssignableAgent
    }),
  )

  counts.sort((a, b) => {
    if (a.active_count !== b.active_count) {
      return a.active_count - b.active_count
    }
    if (a.last_assigned_at === null && b.last_assigned_at === null) return 0
    if (a.last_assigned_at === null) return -1
    if (b.last_assigned_at === null) return 1
    return (
      new Date(a.last_assigned_at).getTime() -
      new Date(b.last_assigned_at).getTime()
    )
  })

  const winner = counts[0]
  return winner ? { id: winner.id, full_name: winner.full_name } : null
}

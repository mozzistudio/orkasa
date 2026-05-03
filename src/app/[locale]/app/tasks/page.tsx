import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TaskPageList } from './task-page-list'

type TaskWithContext = {
  id: string
  lead_id: string
  brokerage_id: string
  agent_id: string | null
  deal_id: string | null
  step_number: number
  phase: string
  title: string
  description: string | null
  cta_action: string
  cta_metadata: Record<string, unknown>
  due_at: string | null
  escalation_at: string | null
  auto_complete_on: string | null
  status: string
  completed_at: string | null
  completed_by: string | null
  trigger_reason: Record<string, unknown>
  property_id: string | null
  offer_id: string | null
  viewing_id: string | null
  created_at: string
  updated_at: string
  lead_name: string
  lead_phone: string | null
  property_title: string | null
  property_price: number | null
}

export default async function TasksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()

  if (!agent?.brokerage_id) return null

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('brokerage_id', agent.brokerage_id)
    .in('status', ['open', 'escalated'])
    .order('due_at', { ascending: true, nullsFirst: false })
    .returns<TaskWithContext[]>()

  const allTasks = tasks ?? []

  const leadIds = [...new Set(allTasks.map((t) => t.lead_id))]
  const propertyIds = [...new Set(allTasks.map((t) => t.property_id).filter(Boolean))] as string[]

  const [leadsRes, propertiesRes] = await Promise.all([
    leadIds.length > 0
      ? supabase
          .from('leads')
          .select('id, full_name, phone')
          .in('id', leadIds)
          .returns<Array<{ id: string; full_name: string; phone: string | null }>>()
      : { data: [] },
    propertyIds.length > 0
      ? supabase
          .from('properties')
          .select('id, title, price')
          .in('id', propertyIds)
          .returns<Array<{ id: string; title: string; price: number | null }>>()
      : { data: [] },
  ])

  const leadsById = new Map((leadsRes.data ?? []).map((l) => [l.id, l]))
  const propsById = new Map((propertiesRes.data ?? []).map((p) => [p.id, p]))

  const enriched: TaskWithContext[] = allTasks.map((t) => {
    const lead = leadsById.get(t.lead_id)
    const prop = t.property_id ? propsById.get(t.property_id) : null
    return {
      ...t,
      lead_name: lead?.full_name ?? 'Lead',
      lead_phone: lead?.phone ?? null,
      property_title: prop?.title ?? null,
      property_price: prop?.price ?? null,
    }
  })

  const escalated = enriched.filter((t) => t.status === 'escalated')
  const open = enriched.filter((t) => t.status === 'open')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          Tareas
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {enriched.length}
          </span>
        </h1>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-8 text-center md:p-12">
          <CheckCircle2
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-steel">
            Sin tareas pendientes. ¡Todo al día!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {escalated.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-signal font-medium">
                  Escaladas
                </span>
                <span className="font-mono text-[10px] tabular-nums text-signal">
                  {escalated.length}
                </span>
              </div>
              <div className="rounded-[4px] border border-signal/20 bg-signal-bg/30">
                <TaskPageList tasks={escalated} />
              </div>
            </section>
          )}

          <section>
            {escalated.length > 0 && (
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel font-medium">
                  Abiertas
                </span>
                <span className="font-mono text-[10px] tabular-nums text-steel">
                  {open.length}
                </span>
              </div>
            )}
            <div className="rounded-[4px] border border-bone bg-paper">
              <TaskPageList tasks={open} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

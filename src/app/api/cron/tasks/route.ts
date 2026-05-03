import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TASK_CATALOG } from '@/lib/tasks/task-catalog'
import { processTaskEvent } from '@/lib/tasks/trigger-engine'
import type { Database, Json } from '@/lib/database.types'

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function openTaskCount(
  supabase: ReturnType<typeof serviceClient>,
  leadId: string,
): Promise<number> {
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('lead_id', leadId)
    .eq('status', 'open')
  return count ?? 0
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = serviceClient()
  const now = new Date().toISOString()
  const results = {
    escalated: 0,
    postClosingCreated: 0,
    visitRemindersCreated: 0,
  }

  // ── 1. Escalate overdue tasks ──────────────────────────────────────
  const { data: overdue } = await supabase
    .from('tasks')
    .select('id, brokerage_id, agent_id, lead_id, title')
    .eq('status', 'open')
    .lt('escalation_at', now)
    .returns<
      Array<{
        id: string
        brokerage_id: string
        agent_id: string | null
        lead_id: string
        title: string
      }>
    >()

  if (overdue?.length) {
    await supabase
      .from('tasks')
      .update({ status: 'escalated', updated_at: now })
      .in(
        'id',
        overdue.map((t) => t.id),
      )

    for (const task of overdue) {
      await supabase.from('task_audit_log').insert({
        task_id: task.id,
        brokerage_id: task.brokerage_id,
        agent_id: null,
        action: 'escalated',
        details: { reason: 'cron_escalation' },
      })

      await supabase.from('notifications').insert({
        brokerage_id: task.brokerage_id,
        agent_id: task.agent_id,
        type: 'task_escalated',
        title: `Tarea escalada · ${task.title}`,
        body: 'Una tarea sobrepasó el plazo de escalación',
        entity_type: 'task',
        entity_id: task.id,
        metadata: { leadId: task.lead_id },
      })
    }
    results.escalated = overdue.length
  }

  // ── 2. Post-closing follow-ups (steps 29–34) ──────────────────────
  // Delegates to the trigger engine: per closed deal, fire a `cron_tick` event
  // and let each catalog entry's `triggerCondition` decide whether to create
  // its task (based on `daysSinceClosed` and `lastDoneStepDates`).
  const { data: closedDeals } = await supabase
    .from('deals')
    .select('id, lead_id, property_id, brokerage_id, agent_id, closed_at')
    .eq('stage', 'post_cierre')
    .not('closed_at', 'is', null)
    .returns<
      Array<{
        id: string
        lead_id: string
        property_id: string | null
        brokerage_id: string
        agent_id: string | null
        closed_at: string
      }>
    >()

  if (closedDeals?.length) {
    for (const deal of closedDeals) {
      const beforeCount = await openTaskCount(supabase, deal.lead_id)
      await processTaskEvent(
        {
          event: 'cron_tick',
          leadId: deal.lead_id,
          brokerageId: deal.brokerage_id,
          agentId: deal.agent_id ?? '',
          dealId: deal.id,
          propertyId: deal.property_id ?? undefined,
        },
        supabase,
      ).catch(() => {})
      const afterCount = await openTaskCount(supabase, deal.lead_id)
      results.postClosingCreated += Math.max(0, afterCount - beforeCount)
    }
  }

  // ── 3. Visit reminders (24h before) ────────────────────────────────
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString()
  const { data: upcomingViewings } = await supabase
    .from('viewings')
    .select('id, lead_id, property_id, agent_id, scheduled_at')
    .gt('scheduled_at', now)
    .lt('scheduled_at', tomorrow)
    .returns<
      Array<{
        id: string
        lead_id: string | null
        property_id: string
        agent_id: string | null
        scheduled_at: string
      }>
    >()

  if (upcomingViewings?.length) {
    for (const viewing of upcomingViewings) {
      if (!viewing.lead_id) continue

      const { data: existing } = await supabase
        .from('tasks')
        .select('id')
        .eq('lead_id', viewing.lead_id)
        .eq('step_number', 6)
        .eq('status', 'open')
        .maybeSingle<{ id: string }>()

      if (existing) continue

      const { data: lead } = await supabase
        .from('leads')
        .select('full_name, phone, brokerage_id')
        .eq('id', viewing.lead_id)
        .maybeSingle<{
          full_name: string
          phone: string | null
          brokerage_id: string
        }>()

      if (!lead) continue

      const catalogEntry = TASK_CATALOG.find((e) => e.stepNumber === 6)
      if (!catalogEntry) continue

      const firstName = lead.full_name.split(' ')[0]
      const title = catalogEntry.titleTemplate({
        firstName,
        leadName: lead.full_name,
      })

      const ctaMetadata: Record<string, unknown> = {
        template: 'preVisitReminder',
        viewingId: viewing.id,
      }
      if (lead.phone) ctaMetadata.phone = lead.phone

      try {
        const { data: created } = await supabase
          .from('tasks')
          .insert({
            lead_id: viewing.lead_id,
            brokerage_id: lead.brokerage_id,
            agent_id: viewing.agent_id,
            step_number: 6,
            phase: 'visitas',
            title,
            description: catalogEntry.description,
            cta_action: 'open_whatsapp',
            cta_metadata: ctaMetadata as Json,
            due_at: now,
            escalation_at: viewing.scheduled_at,
            auto_complete_on: 'interaction:whatsapp',
            status: 'open',
            trigger_reason: { event: 'cron_tick', viewingId: viewing.id },
            property_id: viewing.property_id,
            viewing_id: viewing.id,
          })
          .select('id')
          .maybeSingle<{ id: string }>()

        if (created) {
          await supabase.from('task_audit_log').insert({
            task_id: created.id,
            brokerage_id: lead.brokerage_id,
            agent_id: null,
            action: 'created',
            details: { stepNumber: 6, event: 'cron_tick' },
          })
          results.visitRemindersCreated++
        }
      } catch {
        // dedup constraint
      }
    }
  }

  return NextResponse.json({ ok: true, ...results })
}

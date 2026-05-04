import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/app/empty-state'
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting'
import { TodoListPanel } from '@/components/dashboard/todo-list-panel'
import { CoolingLeadsPanel } from '@/components/dashboard/cooling-leads-panel'
import { PropertiesAttentionPanel } from '@/components/dashboard/properties-attention-panel'
import { TeamPerformanceTable } from '@/components/dashboard/team-performance-table'
import { ActiveOperations } from '@/components/dashboard/active-operations'
import {
  getPipelineSnapshot,
  getMyOpenTasks,
  getCoolingLeads,
  getPropertiesNeedingAttention,
  getTeamPerformance,
  getDashboardUser,
} from '@/lib/queries/dashboard'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getPipelineForecast } from '@/lib/automation/predictions'

function SectionSkeleton({ height = 'h-40' }: { height?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[10px] border border-bone bg-paper ${height}`}
    />
  )
}

export default async function HomePage() {
  const supabase = await createClient()

  const propertiesAll = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })

  const isEmpty = (propertiesAll.count ?? 0) === 0

  if (isEmpty) {
    return <EmptyState />
  }

  const [user, pipeline, todos, cooling, propertyAlerts, team] =
    await Promise.all([
      getDashboardUser(),
      getPipelineSnapshot(),
      getMyOpenTasks(6),
      getCoolingLeads(5),
      getPropertiesNeedingAttention(4),
      getTeamPerformance(),
    ])

  // Total open task count for the panel header
  const supabaseForCount = await createServerClient()
  const { count: totalOpenTasksCount } = await supabaseForCount
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'escalated'])

  const { data: agentRow } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .maybeSingle<{ brokerage_id: string | null }>()
  const forecast = agentRow?.brokerage_id
    ? await getPipelineForecast(agentRow.brokerage_id)
    : {
        predictions: [],
        totalPipelineValue: 0,
        weightedForecast: 0,
        totalCommission: 0,
        atRiskCount: 0,
        atRiskValue: 0,
      }

  return (
    <div className="max-w-[1340px]">
      {/* Greeting */}
      <DashboardGreeting
        firstName={user.firstName}
        totalValue={pipeline.totalValue}
        readyToSign={pipeline.readyToSign}
        coolingCount={cooling.length}
      />

      {/* Operations + Todo */}
      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <ActiveOperations forecast={forecast} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <TodoListPanel todos={todos} totalOpenCount={totalOpenTasksCount ?? todos.length} />
        </Suspense>
      </div>

      {/* Action Panels */}
      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <CoolingLeadsPanel leads={cooling} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <PropertiesAttentionPanel alerts={propertyAlerts} />
        </Suspense>
      </div>

      {/* Team Performance */}
      <Suspense fallback={<SectionSkeleton height="h-32" />}>
        <TeamPerformanceTable agents={team} userRole={user.role} />
      </Suspense>
    </div>
  )
}

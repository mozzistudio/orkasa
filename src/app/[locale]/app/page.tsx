import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/app/empty-state'
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting'
import { PipelineHero } from '@/components/dashboard/pipeline-hero'
import { TodayActionsGrid } from '@/components/dashboard/today-actions-grid'
import { CoolingLeadsPanel } from '@/components/dashboard/cooling-leads-panel'
import { PropertiesAttentionPanel } from '@/components/dashboard/properties-attention-panel'
import { TeamPerformanceTable } from '@/components/dashboard/team-performance-table'
import {
  getPipelineSnapshot,
  getTodayActions,
  getCoolingLeads,
  getPropertiesNeedingAttention,
  getTeamPerformance,
  getDashboardUser,
} from '@/lib/queries/dashboard'

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

  const [user, pipeline, actions, cooling, propertyAlerts, team] =
    await Promise.all([
      getDashboardUser(),
      getPipelineSnapshot(),
      getTodayActions(),
      getCoolingLeads(5),
      getPropertiesNeedingAttention(4),
      getTeamPerformance(),
    ])

  return (
    <div className="max-w-[1340px]">
      {/* Greeting */}
      <DashboardGreeting
        firstName={user.firstName}
        totalValue={pipeline.totalValue}
        readyToSign={pipeline.readyToSign}
        coolingCount={cooling.length}
      />

      {/* Pipeline Hero */}
      <Suspense fallback={<SectionSkeleton height="h-52" />}>
        <PipelineHero data={pipeline} />
      </Suspense>

      {/* Today Actions */}
      <Suspense fallback={<SectionSkeleton height="h-44" />}>
        <TodayActionsGrid actions={actions} />
      </Suspense>

      {/* Main Grid: Cooling Leads + Properties */}
      <div className="mb-7 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Suspense fallback={<SectionSkeleton height="h-80" />}>
          <CoolingLeadsPanel leads={cooling} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton height="h-80" />}>
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

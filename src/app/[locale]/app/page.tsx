import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/app/empty-state'
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting'
import { PipelineHero } from '@/components/dashboard/pipeline-hero'
import { VisitsPanel } from '@/components/dashboard/visits-panel'
import { PendingDocsPanel } from '@/components/dashboard/pending-docs-panel'
import { CoolingLeadsPanel } from '@/components/dashboard/cooling-leads-panel'
import { PropertiesAttentionPanel } from '@/components/dashboard/properties-attention-panel'
import { TeamPerformanceTable } from '@/components/dashboard/team-performance-table'
import {
  getPipelineSnapshot,
  getUpcomingViewings,
  getPendingReminders,
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

  const [user, pipeline, viewings, reminders, cooling, propertyAlerts, team] =
    await Promise.all([
      getDashboardUser(),
      getPipelineSnapshot(),
      getUpcomingViewings(5),
      getPendingReminders(5),
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

      {/* Action Panels */}
      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <VisitsPanel viewings={viewings} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <PendingDocsPanel reminders={reminders} />
        </Suspense>
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

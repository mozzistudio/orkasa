import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/app/empty-state'
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting'
import { PipelineHero } from '@/components/dashboard/pipeline-hero'
import { VisitsPanel } from '@/components/dashboard/visits-panel'
import { CurrentDealsPanel } from '@/components/dashboard/current-deals-panel'
import { CoolingLeadsPanel } from '@/components/dashboard/cooling-leads-panel'
import { PropertiesAttentionPanel } from '@/components/dashboard/properties-attention-panel'
import { TeamPerformanceTable } from '@/components/dashboard/team-performance-table'
import { PipelinePredictions } from '@/components/dashboard/pipeline-predictions'
import { CreateOperacionButton } from './operaciones/create-operacion-button'
import {
  getPipelineSnapshot,
  getUpcomingViewings,
  getPendingReminders,
  getCoolingLeads,
  getPropertiesNeedingAttention,
  getTeamPerformance,
  getDashboardUser,
} from '@/lib/queries/dashboard'
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
        atRiskCount: 0,
        atRiskValue: 0,
      }

  // Fetch leads + properties for the "+ Crear operación" picker
  const [leadsForOpRes, propsForOpRes] = agentRow?.brokerage_id
    ? await Promise.all([
        supabase
          .from('leads')
          .select('id, full_name, phone, email, property_id')
          .eq('brokerage_id', agentRow.brokerage_id)
          .order('updated_at', { ascending: false })
          .limit(500)
          .returns<
            Array<{
              id: string
              full_name: string
              phone: string | null
              email: string | null
              property_id: string | null
            }>
          >(),
        supabase
          .from('properties')
          .select('id, title')
          .eq('brokerage_id', agentRow.brokerage_id)
          .returns<Array<{ id: string; title: string }>>(),
      ])
    : [{ data: [] }, { data: [] }]

  const leadsForOp = leadsForOpRes.data ?? []
  const propsForOp = propsForOpRes.data ?? []

  return (
    <div className="max-w-[1340px]">
      {/* Greeting + Crear operación */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <DashboardGreeting
            firstName={user.firstName}
            totalValue={pipeline.totalValue}
            readyToSign={pipeline.readyToSign}
            coolingCount={cooling.length}
          />
        </div>
        <div className="shrink-0 hidden sm:block">
          <CreateOperacionButton
            leads={leadsForOp}
            properties={propsForOp}
          />
        </div>
      </div>

      {/* Pipeline Hero */}
      <Suspense fallback={<SectionSkeleton height="h-52" />}>
        <PipelineHero data={pipeline} />
      </Suspense>

      {/* AI Pipeline Predictions */}
      <div className="mb-7">
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <PipelinePredictions forecast={forecast} />
        </Suspense>
      </div>

      {/* Action Panels */}
      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <VisitsPanel viewings={viewings} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <CurrentDealsPanel reminders={reminders} />
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

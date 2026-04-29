import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/app/metric-card'
import { AnalyticsCharts } from './charts'

export default async function AnalyticsPage() {
  const t = await getTranslations('analytics')
  const supabase = await createClient()

  const [propsRes, leadsRes, activeRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id, property_type, status, ai_score', { count: 'exact' })
      .returns<
        Array<{
          id: string
          property_type: string
          status: string | null
          ai_score: number | null
        }>
      >(),
    supabase
      .from('leads')
      .select('id, status, ai_score, created_at', { count: 'exact' })
      .returns<
        Array<{
          id: string
          status: string | null
          ai_score: number | null
          created_at: string | null
        }>
      >(),
    supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const properties = propsRes.data ?? []
  const leads = leadsRes.data ?? []

  const avgScore =
    leads.length > 0
      ? Math.round(
          leads
            .map((l) => l.ai_score ?? 0)
            .reduce((sum, v) => sum + v, 0) / leads.length,
        )
      : 0

  const closedWon = leads.filter((l) => l.status === 'closed_won').length
  const conversionRate =
    leads.length > 0
      ? `${((closedWon / leads.length) * 100).toFixed(1)}%`
      : '—'

  // Properties by type
  const typeCount = properties.reduce<Record<string, number>>((acc, p) => {
    acc[p.property_type] = (acc[p.property_type] ?? 0) + 1
    return acc
  }, {})

  // Leads by status
  const statusCount = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.status ?? 'new'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  // Leads over time (last 8 weeks, weekly buckets)
  const now = Date.now()
  const weeklyBuckets: Array<{ week: string; count: number }> = []
  for (let i = 7; i >= 0; i--) {
    const start = now - (i + 1) * 7 * 24 * 60 * 60 * 1000
    const end = now - i * 7 * 24 * 60 * 60 * 1000
    const count = leads.filter((l) => {
      if (!l.created_at) return false
      const t = new Date(l.created_at).getTime()
      return t >= start && t < end
    }).length
    const date = new Date(end)
    weeklyBuckets.push({
      week: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
      count,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 text-[13px] text-steel">{t('subtitle')}</p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label={t('kpi.totalProperties')}
          value={String(propsRes.count ?? 0)}
          change="—"
          trend="neutral"
        />
        <MetricCard
          label={t('kpi.activeProperties')}
          value={String(activeRes.count ?? 0)}
          change="—"
          trend="neutral"
        />
        <MetricCard
          label={t('kpi.totalLeads')}
          value={String(leadsRes.count ?? 0)}
          change="—"
          trend="neutral"
        />
        <MetricCard
          label={t('kpi.avgScore')}
          value={String(avgScore)}
          change="—"
          trend="neutral"
        />
        <MetricCard
          label={t('kpi.conversionRate')}
          value={conversionRate}
          change="—"
          trend="neutral"
        />
      </div>

      <AnalyticsCharts
        propertiesByType={Object.entries(typeCount).map(([name, count]) => ({
          name,
          count,
        }))}
        leadsByStatus={Object.entries(statusCount).map(([name, count]) => ({
          name,
          count,
        }))}
        leadsOverTime={weeklyBuckets}
      />
    </div>
  )
}

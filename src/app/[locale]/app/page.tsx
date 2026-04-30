import { getTranslations } from 'next-intl/server'
import { MetricCard } from '@/components/app/metric-card'
import { LeadsTable } from '@/components/app/leads-table'
import { PropertyCard } from '@/components/app/property-card'
import { EmptyState } from '@/components/app/empty-state'
import { createClient } from '@/lib/supabase/server'

type LeadRow = {
  id: string
  full_name: string
  origin: string
  ai_score: number | null
  assigned_agent_id: string | null
  created_at: string | null
}

type AgentRow = { id: string; full_name: string }

type FeaturedProperty = {
  id: string
  title: string
  neighborhood: string | null
  city: string | null
  price: number | null
  ai_score: number | null
  images: unknown
}

type StoredImage = { path: string; url: string }

function dateToShortEs(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
  })
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString()

  const [
    propertiesActive,
    leadsRecent,
    viewingsScheduled,
    propertiesAll,
    leadsList,
    featured,
    agents,
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('viewings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString()),
    supabase
      .from('properties')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('leads')
      .select('id, full_name, origin, ai_score, assigned_agent_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<LeadRow[]>(),
    supabase
      .from('properties')
      .select('id, title, neighborhood, city, price, ai_score, images')
      .eq('status', 'active')
      .order('ai_score', { ascending: false, nullsFirst: false })
      .limit(3)
      .returns<FeaturedProperty[]>(),
    supabase.from('agents').select('id, full_name').returns<AgentRow[]>(),
  ])

  const isEmpty = (propertiesAll.count ?? 0) === 0

  if (isEmpty) {
    return <EmptyState />
  }

  const agentsById = new Map((agents.data ?? []).map((a) => [a.id, a.full_name]))

  const metrics = [
    {
      label: 'Inventario activo',
      value: String(propertiesActive.count ?? 0),
      change: '—',
      trend: 'neutral' as const,
    },
    {
      label: 'Leads 7d',
      value: String(leadsRecent.count ?? 0),
      change: '—',
      trend: 'neutral' as const,
    },
    {
      label: 'Visitas agendadas',
      value: String(viewingsScheduled.count ?? 0),
      change: '—',
      trend: 'neutral' as const,
    },
    { label: 'Tasa de cierre', value: '—', change: '—', trend: 'neutral' as const },
  ]

  const leadRows = (leadsList.data ?? []).map((lead) => ({
    id: lead.id,
    name: lead.full_name,
    origin: lead.origin
      .split('_')
      .map((s) => s[0]?.toUpperCase() + s.slice(1))
      .join(' '),
    score: lead.ai_score ?? 0,
    assigned: lead.assigned_agent_id
      ? agentsById.get(lead.assigned_agent_id) ?? 'Sin asignar'
      : 'Sin asignar',
    date: dateToShortEs(lead.created_at),
  }))

  const propertyCards = (featured.data ?? []).map((p) => {
    const imgs = Array.isArray(p.images) ? (p.images as StoredImage[]) : []
    return {
      id: p.id.slice(0, 5),
      fullId: p.id,
      title: p.title,
      location: [p.neighborhood, p.city].filter(Boolean).join(' · '),
      price: Number(p.price ?? 0),
      leads: 0,
      score: p.ai_score ?? 0,
      imageUrl: imgs[0]?.url ?? null,
    }
  })

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeadsTable leads={leadRows} />
        </div>
        <div>
          <h3 className="mb-4 text-[16px] font-medium tracking-[-0.3px] text-ink">
            {t('featuredProperties')}
          </h3>
          <div className="space-y-4">
            {propertyCards.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

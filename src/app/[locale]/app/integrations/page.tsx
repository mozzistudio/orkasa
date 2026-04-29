import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  PROVIDERS_BY_CATEGORY,
  type IntegrationProvider,
  type IntegrationStatus,
} from '@/lib/integrations'
import { ProviderCard } from './provider-card'

type ConnectedRow = {
  id: string
  provider: IntegrationProvider
  status: IntegrationStatus
  account_label: string | null
  last_synced_at: string | null
  last_error: string | null
}

export default async function IntegrationsPage() {
  const t = await getTranslations('integrations')
  const supabase = await createClient()

  // Pull only public-safe fields via the secured view
  const { data: connectedRaw } = await supabase
    .from('integrations')
    .select('id, provider, status, account_label, last_synced_at, last_error')
    .returns<ConnectedRow[]>()

  const connectedByProvider = new Map(
    (connectedRaw ?? []).map((r) => [r.provider, r]),
  )

  const categories = ['portal', 'social', 'messaging', 'custom'] as const

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 text-[13px] text-steel">{t('subtitle')}</p>
      </div>

      {categories.map((cat) => {
        const providers = PROVIDERS_BY_CATEGORY[cat]
        if (providers.length === 0) return null
        return (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-steel">
              {t(`category.${cat}`)}
              <span className="ml-2 text-ink">{providers.length}</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <ProviderCard
                  key={p.id}
                  meta={p}
                  connected={connectedByProvider.get(p.id) ?? null}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

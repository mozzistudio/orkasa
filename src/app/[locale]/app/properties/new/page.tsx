import Link from 'next/link'
import { redirect } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { INTEGRATION_PROVIDERS } from '@/lib/integrations'
import { CreateWizard } from './create-wizard'

export default async function NewPropertyPage() {
  const t = await getTranslations('properties')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('brokerage_id')
    .eq('id', user.id)
    .maybeSingle<{ brokerage_id: string | null }>()

  if (!agent?.brokerage_id) redirect('/login')

  const propertyId = randomUUID()

  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('id, name, city')
    .order('sort_order')

  const providers = INTEGRATION_PROVIDERS.filter((p) => p.adapter)

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/app/properties"
        className="mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors md:mb-6"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {t('title')}
      </Link>

      <h1 className="mb-4 text-[20px] font-medium tracking-[-0.4px] text-ink md:mb-8 md:text-[22px] md:tracking-[-0.5px]">
        {t('new')}
      </h1>

      <div className="md:rounded-[4px] md:border md:border-bone md:bg-paper md:p-6">
        <CreateWizard
          propertyId={propertyId}
          brokerageId={agent.brokerage_id}
          neighborhoods={neighborhoods ?? []}
          providers={providers}
        />
      </div>
    </div>
  )
}

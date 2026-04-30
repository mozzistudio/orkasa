import Link from 'next/link'
import { redirect } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { PropertyForm } from '@/components/app/property-form'
import { createProperty } from '../actions'
import { createClient } from '@/lib/supabase/server'

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

  // Pre-generate UUID so image uploads can use the eventual property_id path
  const propertyId = randomUUID()

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/app/properties"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors md:mb-6"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {t('title')}
      </Link>

      <h1 className="mb-5 text-[22px] font-medium tracking-[-0.5px] text-ink md:mb-8">
        {t('new')}
      </h1>

      {/* No outer card on mobile — sections inside the form already have
          their own borders/dividers. The card adds redundant nesting + 48px
          of horizontal padding that cramps fields on small screens. */}
      <div className="md:rounded-[4px] md:border md:border-bone md:bg-paper md:p-6">
        <PropertyForm
          action={createProperty}
          submitLabel={t('create')}
          brokerageId={agent.brokerage_id}
          propertyId={propertyId}
          isCreate
        />
      </div>
    </div>
  )
}

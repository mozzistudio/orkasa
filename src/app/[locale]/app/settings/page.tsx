import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { BrokerageForm } from './brokerage-form'

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, email, phone, brokerage_id, role')
    .eq('id', user.id)
    .maybeSingle<{
      full_name: string
      email: string
      phone: string | null
      brokerage_id: string | null
      role: string | null
    }>()

  let brokerage: {
    name: string
    ruc: string | null
    country_code: string | null
  } | null = null
  if (agent?.brokerage_id) {
    const { data } = await supabase
      .from('brokerages')
      .select('name, ruc, country_code')
      .eq('id', agent.brokerage_id)
      .maybeSingle<{
        name: string
        ruc: string | null
        country_code: string | null
      }>()
    brokerage = data
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-[22px] font-medium tracking-[-0.5px] text-ink">
        {t('title')}
      </h1>

      {/* Profile section */}
      <section className="mb-8 rounded-[4px] border border-bone bg-paper p-6">
        <h2 className="mb-1 text-[16px] font-medium text-ink">
          {t('profile')}
        </h2>
        <p className="mb-6 font-mono text-[11px] uppercase tracking-wider text-steel">
          {agent?.role ?? 'agent'}
        </p>
        <ProfileForm
          fullName={agent?.full_name ?? ''}
          email={agent?.email ?? user.email ?? ''}
          phone={agent?.phone ?? ''}
        />
      </section>

      {/* Brokerage section */}
      {brokerage && (
        <section className="rounded-[4px] border border-bone bg-paper p-6">
          <h2 className="mb-6 text-[16px] font-medium text-ink">
            {t('brokerage')}
          </h2>
          <BrokerageForm
            name={brokerage.name}
            ruc={brokerage.ruc ?? ''}
            country={brokerage.country_code ?? 'PA'}
          />
        </section>
      )}
    </div>
  )
}

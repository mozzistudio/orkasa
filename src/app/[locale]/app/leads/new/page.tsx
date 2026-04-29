import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { LeadForm } from '@/components/app/lead-form'
import { createLead } from '../actions'
import { createClient } from '@/lib/supabase/server'

export default async function NewLeadPage() {
  const t = await getTranslations('leads')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [propertiesRes, agentsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id, title')
      .order('updated_at', { ascending: false })
      .returns<Array<{ id: string; title: string }>>(),
    supabase
      .from('agents')
      .select('id, full_name')
      .returns<Array<{ id: string; full_name: string }>>(),
  ])

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/app/leads"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {t('title')}
      </Link>

      <h1 className="mb-8 text-[22px] font-medium tracking-[-0.5px] text-ink">
        {t('new')}
      </h1>

      <div className="rounded-[4px] border border-bone bg-paper p-6">
        <LeadForm
          action={createLead}
          submitLabel={t('create')}
          properties={propertiesRes.data ?? []}
          agents={agentsRes.data ?? []}
        />
      </div>
    </div>
  )
}

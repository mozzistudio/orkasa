import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProvidersList } from './providers-list'
import type { ProviderRow } from './provider-form'

export default async function ProvidersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('providers')
    .select(
      'id, service_type, name, company, phone, email, tax_id, license_number, address, city, notes, is_primary',
    )
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true })
    .returns<ProviderRow[]>()

  return (
    <div>
      <ProvidersList providers={data ?? []} />
    </div>
  )
}

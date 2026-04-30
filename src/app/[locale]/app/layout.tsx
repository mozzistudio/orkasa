import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app/app-shell'
import { CommandPalette } from '@/components/app/command-palette'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Read agent profile (created automatically on signup via trigger)
  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle<{ full_name: string; role: string | null }>()

  const sidebarUser = {
    fullName: agent?.full_name ?? user.email ?? 'Agent',
    role: agent?.role ?? 'agent',
    email: user.email ?? '',
  }

  return (
    <>
      <AppShell user={sidebarUser}>{children}</AppShell>
      <CommandPalette />
    </>
  )
}

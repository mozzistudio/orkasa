import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/app/sidebar'
import { Topbar } from '@/components/app/topbar'
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
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar user={sidebarUser} />
      <div className="ml-60 flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  )
}

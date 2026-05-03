'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { LogoLockup } from '@/components/ui/logo'
import { logout } from '@/app/[locale]/(auth)/login/actions'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import {
  HomeIcon,
  BuildingIcon,
  PeopleIcon,
  AgentIcon,
  AnalyticsIcon,
  CalendarIcon,
  ShieldIcon,
  SettingsIcon,
  PlugIcon,
  LogoutIcon,
  DocumentIcon,
  StarIcon,
} from '@/components/icons/icons'
import { GitBranch, Inbox as InboxLucide } from 'lucide-react'

function PipelineIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <GitBranch width={size} height={size} className={className} strokeWidth={1.5} />
}

function InboxIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <InboxLucide width={size} height={size} className={className} strokeWidth={1.5} />
}

const navItems = [
  { key: 'title',        href: '/app',              icon: HomeIcon,      match: 'exact' as const },
  { key: 'inventory',    href: '/app/properties',   icon: BuildingIcon,  match: 'prefix' as const },
  { key: 'leads',        href: '/app/leads',        icon: PeopleIcon,    match: 'prefix' as const },
  { key: 'tasks',        href: '/app/tasks',        icon: DocumentIcon,  match: 'prefix' as const },
  { key: 'inbox',        href: '/app/inbox',        icon: InboxIcon,     match: 'prefix' as const },
  { key: 'calendar',     href: '/app/calendar',     icon: CalendarIcon,  match: 'prefix' as const },
  { key: 'offers',       href: '/app/offers',       icon: StarIcon,      match: 'prefix' as const },
  { key: 'deals',        href: '/app/deals',        icon: PipelineIcon,  match: 'prefix' as const },
  { key: 'agents',       href: '/app/agents',       icon: AgentIcon,     match: 'prefix' as const },
  { key: 'analytics',    href: '/app/analytics',    icon: AnalyticsIcon, match: 'prefix' as const },
  { key: 'compliance',   href: '/app/compliance',   icon: ShieldIcon,    match: 'prefix' as const },
  { key: 'integrations', href: '/app/integrations', icon: PlugIcon,      match: 'prefix' as const },
  { key: 'settings',     href: '/app/settings',     icon: SettingsIcon,  match: 'prefix' as const },
] as const

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Sidebar({
  user,
}: {
  user: { fullName: string; role: string }
}) {
  const t = useTranslations('dashboard')
  const pathname = usePathname()
  const [inboxUnread, setInboxUnread] = useState(0)

  useEffect(() => {
    const supabase = createBrowserClient()
    let cancelled = false
    let agentId: string | null = null

    async function loadAndSubscribe() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser()
      if (!u || cancelled) return
      agentId = u.id

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', u.id)
        .eq('is_read', false)
      if (!cancelled) setInboxUnread(count ?? 0)

      const channel = supabase
        .channel(`sidebar-notifications:${u.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `agent_id=eq.${u.id}`,
          },
          async () => {
            if (!agentId) return
            const { count: c } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('agent_id', agentId)
              .eq('is_read', false)
            if (!cancelled) setInboxUnread(c ?? 0)
          },
        )
        .subscribe()

      return channel
    }

    const channelPromise = loadAndSubscribe()
    return () => {
      cancelled = true
      channelPromise.then((channel) => {
        if (channel) supabase.removeChannel(channel)
      })
    }
  }, [])

  return (
    <aside className="fixed left-0 top-0 flex h-full w-60 flex-col border-r border-bone bg-paper-warm">
      <div className="flex h-16 items-center px-5">
        <Link href="/">
          <LogoLockup className="h-9" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2">
        {navItems.map(({ key, href, icon: Icon, match }) => {
          let isActive = false
          if (match === 'exact') isActive = pathname === href
          else if (match === 'prefix') isActive = pathname.startsWith(href)
          const showBadge = key === 'inbox' && inboxUnread > 0
          return (
            <Link
              key={key}
              href={href}
              className={`mb-0.5 flex items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13px] transition-colors ${
                isActive
                  ? 'bg-ink font-medium text-paper'
                  : 'text-steel hover:bg-bone-soft hover:text-ink'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{t(key)}</span>
              {showBadge && (
                <span
                  className={`flex min-w-[18px] h-[16px] items-center justify-center rounded-[3px] px-1 font-mono text-[9px] font-medium tabular-nums ${
                    isActive ? 'bg-paper text-ink' : 'bg-signal text-paper'
                  }`}
                >
                  {inboxUnread > 99 ? '99+' : inboxUnread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-bone p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-ink font-sans text-[11px] font-medium text-paper">
            {initials(user.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">
              {user.fullName}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
              {user.role}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-steel hover:text-ink transition-colors"
              aria-label="Log out"
            >
              <LogoutIcon size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}

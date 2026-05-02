'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { LogoLockup } from '@/components/ui/logo'
import { logout } from '@/app/[locale]/(auth)/login/actions'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  BarChart3,
  Shield,
  Settings,
  Plug,
  LogOut,
} from 'lucide-react'

const navItems = [
  { key: 'title',        href: '/app',              icon: LayoutDashboard, match: 'exact' as const },
  { key: 'properties',   href: '/app/properties',   icon: Building2,       match: 'prefix' as const },
  { key: 'leads',        href: '/app/leads',        icon: Users,           match: 'prefix' as const },
  { key: 'agents',       href: '/app/agents',       icon: UserCheck,       match: 'prefix' as const },
  { key: 'analytics',    href: '/app/analytics',    icon: BarChart3,       match: 'prefix' as const },
  { key: 'compliance',   href: '/app/compliance',   icon: Shield,          match: 'prefix' as const },
  { key: 'integrations', href: '/app/integrations', icon: Plug,            match: 'prefix' as const },
  { key: 'settings',     href: '/app/settings',     icon: Settings,        match: 'prefix' as const },
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
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {t(key)}
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
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}

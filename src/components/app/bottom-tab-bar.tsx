'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LayoutDashboard, Building2, Users, BarChart3, Menu } from 'lucide-react'

const TABS = [
  { key: 'title',     href: '/app',            icon: LayoutDashboard, match: 'exact' as const },
  { key: 'inventory', href: '/app/properties', icon: Building2,       match: 'prefix' as const },
  { key: 'leads',     href: '/app/leads',      icon: Users,           match: 'prefix' as const },
  { key: 'analytics', href: '/app/analytics',  icon: BarChart3,       match: 'prefix' as const },
] as const

export function BottomTabBar({
  onOpenMore,
}: {
  onOpenMore: () => void
}) {
  const t = useTranslations('dashboard')
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-bone bg-paper md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-14 items-stretch">
        {TABS.map(({ key, href, icon: Icon, match }) => {
          const isActive =
            match === 'exact' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={key}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-ink' : 'text-steel'
              }`}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="font-mono text-[9px] uppercase tracking-wider">
                {t(key)}
              </span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 bg-signal" />
              )}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-steel transition-colors"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-mono text-[9px] uppercase tracking-wider">
            Más
          </span>
        </button>
      </div>
    </nav>
  )
}

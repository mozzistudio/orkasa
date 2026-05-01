'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import {
  X,
  Search,
  UserCheck,
  Shield,
  Plug,
  Settings,
  LogOut,
} from 'lucide-react'
import { logout } from '@/app/[locale]/(auth)/login/actions'
import { LogoLockup } from '@/components/ui/logo'

const SECONDARY_NAV = [
  { key: 'agents',       href: '/app/agents',       icon: UserCheck },
  { key: 'compliance',   href: '/app/compliance',   icon: Shield },
  { key: 'integrations', href: '/app/integrations', icon: Plug },
  { key: 'settings',     href: '/app/settings',     icon: Settings },
] as const

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function MoreSheet({
  open,
  onClose,
  user,
}: {
  open: boolean
  onClose: () => void
  user: { fullName: string; role: string; email: string }
}) {
  const t = useTranslations('dashboard')
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/40 md:hidden"
        onClick={onClose}
      />
      {/* Sheet sliding from bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[4px] border-t border-bone bg-paper md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex flex-col items-center gap-3 border-b border-bone bg-paper px-5 pt-3 pb-3">
          <div className="h-1 w-10 rounded-full bg-bone" />
          <div className="flex w-full items-center justify-between">
            <LogoLockup className="h-5" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-[4px] p-1 text-steel hover:text-ink"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Quick search */}
        <div className="border-b border-bone px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onClose()
              setTimeout(() => {
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
                )
              }, 200)
            }}
            className="flex h-10 w-full items-center gap-2 rounded-[4px] border border-bone bg-paper pl-3 text-left font-mono text-[12px] text-steel active:bg-bone/30 transition-colors"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
            Buscar...
          </button>
        </div>

        {/* User card */}
        <div className="border-b border-bone p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-bone font-mono text-[12px] font-medium text-ink">
              {initials(user.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-ink truncate">
                {user.fullName}
              </p>
              <p className="font-mono text-[11px] text-steel truncate">
                {user.email}
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
              {user.role}
            </span>
          </div>
        </div>

        {/* Secondary nav */}
        <nav className="p-2">
          {SECONDARY_NAV.map(({ key, href, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={key}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-[4px] px-3 py-3 text-[14px] transition-colors ${
                  isActive
                    ? 'bg-bone/50 text-ink font-medium'
                    : 'text-ink active:bg-bone/40'
                }`}
              >
                <Icon className="h-5 w-5 text-steel" strokeWidth={1.5} />
                {t(key)}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-bone p-2">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-[4px] px-3 py-3 text-[14px] text-signal transition-colors hover:bg-signal-soft"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.5} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

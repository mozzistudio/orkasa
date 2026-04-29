'use client'

import { useTranslations } from 'next-intl'
import { Bell } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { CommandPaletteTrigger } from './command-palette'

function breadcrumbForPath(pathname: string): string {
  if (pathname.startsWith('/app/properties/new')) return 'Inventario / Nueva'
  if (pathname.match(/\/app\/properties\/[^/]+\/edit/))
    return 'Inventario / Editar'
  if (pathname.match(/\/app\/properties\/[^/]+/)) return 'Inventario / Detalle'
  if (pathname.startsWith('/app/properties')) return 'Inventario'
  if (pathname.startsWith('/app/leads/new')) return 'Leads / Nuevo'
  if (pathname.match(/\/app\/leads\/[^/]+/)) return 'Leads / Detalle'
  if (pathname.startsWith('/app/leads')) return 'Leads'
  if (pathname.startsWith('/app/agents')) return 'Equipo'
  if (pathname.startsWith('/app/analytics')) return 'Análisis'
  if (pathname.startsWith('/app/compliance')) return 'Compliance'
  if (pathname.startsWith('/app/settings')) return 'Configuración'
  if (pathname === '/app') return 'Dashboard'
  return 'Dashboard'
}

export function Topbar() {
  const t = useTranslations('dashboard')
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-bone bg-paper px-6">
      <div className="font-mono text-[12px] text-steel">
        {breadcrumbForPath(pathname)}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <CommandPaletteTrigger />
        </div>

        <button className="relative text-steel hover:text-ink transition-colors">
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-signal" />
        </button>

        <Link
          href="/app/properties/new"
          className="rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors"
        >
          {t('uploadProperty')}
        </Link>
      </div>
    </header>
  )
}

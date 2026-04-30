'use client'

import { useTranslations } from 'next-intl'
import { Bell, Plus } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { CommandPaletteTrigger } from './command-palette'
import { LogoMark } from '@/components/ui/logo'

function breadcrumbForPath(pathname: string): string {
  if (pathname.startsWith('/app/properties/new')) return 'Inventario / Nueva'
  if (pathname.match(/\/app\/properties\/[^/]+\/edit/))
    return 'Inventario / Editar'
  if (pathname.match(/\/app\/properties\/[^/]+\/publish/))
    return 'Inventario / Publicar'
  if (pathname.match(/\/app\/properties\/[^/]+/)) return 'Inventario / Detalle'
  if (pathname.startsWith('/app/properties')) return 'Inventario'
  if (pathname.startsWith('/app/leads/new')) return 'Leads / Nuevo'
  if (pathname.match(/\/app\/leads\/[^/]+/)) return 'Leads / Detalle'
  if (pathname.startsWith('/app/leads')) return 'Leads'
  if (pathname.startsWith('/app/agents')) return 'Equipo'
  if (pathname.startsWith('/app/analytics')) return 'Análisis'
  if (pathname.startsWith('/app/compliance')) return 'Compliance'
  if (pathname.startsWith('/app/integrations')) return 'Integraciones'
  if (pathname.startsWith('/app/settings')) return 'Configuración'
  if (pathname === '/app') return 'Dashboard'
  return 'Dashboard'
}

// Short page title for mobile (single token, more compact than breadcrumb)
function mobileTitleForPath(pathname: string): string {
  if (pathname.startsWith('/app/properties/new')) return 'Nueva propiedad'
  if (pathname.match(/\/app\/properties\/[^/]+\/edit/)) return 'Editar'
  if (pathname.match(/\/app\/properties\/[^/]+\/publish/)) return 'Publicar'
  if (pathname.match(/\/app\/properties\/[^/]+/)) return 'Propiedad'
  if (pathname.startsWith('/app/properties')) return 'Inventario'
  if (pathname.startsWith('/app/leads/new')) return 'Nuevo lead'
  if (pathname.match(/\/app\/leads\/[^/]+/)) return 'Lead'
  if (pathname.startsWith('/app/leads')) return 'Leads'
  if (pathname.startsWith('/app/agents')) return 'Equipo'
  if (pathname.startsWith('/app/analytics')) return 'Análisis'
  if (pathname.startsWith('/app/compliance')) return 'Compliance'
  if (pathname.startsWith('/app/integrations')) return 'Integraciones'
  if (pathname.startsWith('/app/settings')) return 'Configuración'
  return 'Orkasa'
}

export function Topbar() {
  const t = useTranslations('dashboard')
  const pathname = usePathname()
  const isApp = pathname === '/app' || pathname === '/app/'

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-bone bg-paper/95 backdrop-blur-sm px-4 md:h-14 md:px-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Mobile: logo mark + page title */}
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/app" aria-label="Inicio">
          <LogoMark size={24} className="text-ink" />
        </Link>
        <span className="text-[15px] font-medium tracking-[-0.3px] text-ink">
          {mobileTitleForPath(pathname)}
        </span>
      </div>

      {/* Desktop: breadcrumb */}
      <div className="hidden md:block font-mono text-[12px] text-steel">
        {breadcrumbForPath(pathname)}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search trigger — desktop only (mobile gets it via search icon if needed) */}
        <div className="hidden md:block">
          <CommandPaletteTrigger />
        </div>

        {/* Notification bell */}
        <button
          className="relative text-steel hover:text-ink transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-signal" />
        </button>

        {/* CTA: full button on desktop, icon-only on mobile.
            Only show on Dashboard / Inventario screens — elsewhere the page
            has its own primary action. */}
        {isApp && (
          <Link
            href="/app/properties/new"
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors md:px-4"
            aria-label={t('uploadProperty')}
          >
            <Plus className="h-4 w-4 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
            <span className="hidden md:inline">{t('uploadProperty')}</span>
          </Link>
        )}
      </div>
    </header>
  )
}

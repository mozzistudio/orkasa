'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, Plus, Search, Upload } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { CommandPaletteTrigger } from './command-palette'
import { LogoMark } from '@/components/ui/logo'
import { NotificationBell } from './notification-bell'
import { CreateOperacionButton } from '@/app/[locale]/app/operaciones/create-operacion-button'

const ROOT_TABS = [
  '/app',
  '/app/properties',
  '/app/leads',
  '/app/calendar',
  '/app/agents',
  '/app/analytics',
  '/app/compliance',
  '/app/integrations',
  '/app/settings',
]

function isSubPage(pathname: string): boolean {
  return !ROOT_TABS.includes(pathname.replace(/\/$/, '') || '/app')
}

function parentHref(pathname: string): string {
  if (pathname.match(/\/app\/properties\/[^/]+\/edit/))
    return pathname.replace(/\/edit$/, '')
  if (pathname.match(/\/app\/properties\/[^/]+\/publish/))
    return pathname.replace(/\/publish$/, '')
  if (pathname.match(/\/app\/properties\/[^/]+/)) return '/app/properties'
  if (pathname.startsWith('/app/leads/new')) return '/app/leads'
  if (pathname.match(/\/app\/leads\/[^/]+/)) return '/app/leads'
  if (pathname.match(/\/app\/compliance\/[^/]+\/documents\/[^/]+/))
    return pathname.replace(/\/[^/]+$/, '')
  if (pathname.match(/\/app\/compliance\/[^/]+\/documents/))
    return pathname.replace(/\/documents$/, '')
  if (pathname.match(/\/app\/compliance\/[^/]+/)) return '/app/compliance'
  return '/app'
}

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
  if (pathname.startsWith('/app/calendar')) return 'Calendario'
  if (pathname.startsWith('/app/agents')) return 'Equipo'
  if (pathname.startsWith('/app/analytics')) return 'Análisis'
  if (pathname.startsWith('/app/compliance')) return 'Compliance'
  if (pathname.startsWith('/app/integrations')) return 'Integraciones'
  if (pathname.startsWith('/app/settings')) return 'Configuración'
  if (pathname === '/app') return 'Inicio'
  return 'Inicio'
}

function mobileTitleForPath(pathname: string): string {
  if (pathname.startsWith('/app/properties/new')) return 'Nueva propiedad'
  if (pathname.match(/\/app\/properties\/[^/]+\/edit/)) return 'Editar'
  if (pathname.match(/\/app\/properties\/[^/]+\/publish/)) return 'Publicar'
  if (pathname.match(/\/app\/properties\/[^/]+/)) return 'Propiedad'
  if (pathname.startsWith('/app/properties')) return 'Inventario'
  if (pathname.startsWith('/app/leads/new')) return 'Nuevo lead'
  if (pathname.match(/\/app\/leads\/[^/]+/)) return 'Lead'
  if (pathname.startsWith('/app/leads')) return 'Leads'
  if (pathname.startsWith('/app/calendar')) return 'Calendario'
  if (pathname.startsWith('/app/agents')) return 'Equipo'
  if (pathname.startsWith('/app/analytics')) return 'Análisis'
  if (pathname.startsWith('/app/compliance')) return 'Compliance'
  if (pathname.startsWith('/app/integrations')) return 'Integraciones'
  if (pathname.startsWith('/app/settings')) return 'Configuración'
  return 'Inicio'
}

function openCommandPalette() {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
  )
}

export function Topbar() {
  const t = useTranslations('dashboard')
  const pathname = usePathname()
  const isApp = pathname === '/app' || pathname === '/app/'
  const isSub = isSubPage(pathname)

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-bone bg-paper/95 backdrop-blur-sm px-4 md:h-14 md:px-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Mobile: back arrow or logo + page title */}
      <div className="flex items-center gap-1 md:hidden">
        {isSub ? (
          <Link
            href={parentHref(pathname)}
            className="flex h-10 w-10 items-center justify-center -ml-2 rounded-[4px] text-ink active:bg-bone/30 transition-colors"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        ) : (
          <Link href="/app" aria-label="Inicio" className="ml-0.5 mr-1.5">
            <LogoMark size={24} className="text-ink" />
          </Link>
        )}
        <span className="text-[15px] font-medium tracking-[-0.3px] text-ink truncate">
          {mobileTitleForPath(pathname)}
        </span>
      </div>

      {/* Desktop: breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-[12px]">
        <span className="text-ink">{breadcrumbForPath(pathname)}</span>
        {isApp && (
          <>
            <span className="text-steel-soft">·</span>
            <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
              {new Date().toLocaleDateString('es-PA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-4">
        {/* Search trigger — mobile: icon button, desktop: full input */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] text-steel active:bg-bone/30 transition-colors md:hidden"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div className="hidden md:block">
          <CommandPaletteTrigger />
        </div>

        <NotificationBell />

        {/* CTAs — only on home root */}
        {isApp && (
          <>
            <div className="hidden md:block">
              <CreateOperacionButton />
            </div>
            <Link
              href="/app/properties/new"
              className="inline-flex items-center gap-1.5 h-9 rounded-[4px] border border-ink/15 bg-paper px-3 text-[13px] font-medium text-steel hover:text-ink hover:border-ink/30 transition-colors md:px-3.5"
              aria-label={t('uploadProperty')}
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden md:inline">{t('uploadProperty')}</span>
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

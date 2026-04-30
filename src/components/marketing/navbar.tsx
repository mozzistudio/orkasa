'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LogoLockup } from '@/components/ui/logo'
import { Link } from '@/i18n/navigation'

const PRIMARY_LINKS = [
  { href: '/producto', labelKey: 'producto' },
  { href: '/precios', labelKey: 'precios' },
  { href: '/integraciones', label: 'Integraciones' },
  { href: '/recursos', labelKey: 'recursos' },
] as const

const COMPANY_LINKS = [
  { href: '/sobre-nosotros', label: 'Sobre nosotros', description: 'Quiénes somos y qué construimos' },
  { href: '/blog', label: 'Blog', description: 'Notas del equipo y casos de uso' },
  { href: '/contacto', label: 'Contacto', description: 'Demo, ventas, partnerships' },
] as const

export function Navbar() {
  const t = useTranslations('nav')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const companyRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when drawer is open (mobile)
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  // Close drawer on escape
  useEffect(() => {
    if (!drawerOpen && !companyOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false)
        setCompanyOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen, companyOpen])

  // Close company dropdown when clicking outside
  useEffect(() => {
    if (!companyOpen) return
    const onClick = (e: MouseEvent) => {
      if (
        companyRef.current &&
        !companyRef.current.contains(e.target as Node)
      ) {
        setCompanyOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [companyOpen])

  return (
    <>
      <nav
        className="sticky top-0 z-50 h-16 border-b border-bone bg-paper md:h-20"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Inicio">
            <LogoLockup className="h-8 md:h-10" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-7 md:flex">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-steel hover:text-ink transition-colors"
              >
                {'labelKey' in link ? t(link.labelKey) : link.label}
              </Link>
            ))}

            {/* Empresa dropdown */}
            <div ref={companyRef} className="relative">
              <button
                type="button"
                onClick={() => setCompanyOpen((o) => !o)}
                className="inline-flex items-center gap-1 text-[13px] text-steel transition-colors hover:text-ink"
                aria-expanded={companyOpen}
                aria-haspopup="menu"
              >
                Empresa
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    companyOpen ? 'rotate-180' : ''
                  }`}
                  strokeWidth={1.5}
                />
              </button>
              {companyOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-10 mt-2 w-72 rounded-[4px] border border-bone bg-paper shadow-lg"
                >
                  <ul className="p-2">
                    {COMPANY_LINKS.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setCompanyOpen(false)}
                          className="block rounded-[4px] px-3 py-2.5 transition-colors hover:bg-bone/50"
                          role="menuitem"
                        >
                          <p className="text-[13px] font-medium text-ink">
                            {item.label}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                            {item.description}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-[13px] text-ink transition-colors hover:text-steel"
            >
              {t('login')}
            </Link>
            <Link
              href="/login"
              className="rounded-[4px] bg-signal px-4 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90"
            >
              {t('startFree')}
            </Link>
          </div>

          {/* Mobile actions: CTA + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/login"
              className="rounded-[4px] bg-signal px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:bg-signal/90"
            >
              {t('startFree')}
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-ink"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer (right side) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/50" />
          <aside
            className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex items-center justify-between border-b border-bone px-4 py-3">
              <LogoLockup className="h-7" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-steel transition-colors hover:text-ink"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4">
              {/* Primary group */}
              <div className="space-y-1">
                {PRIMARY_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className="block rounded-[4px] px-3 py-3 text-[15px] text-ink active:bg-bone/50"
                  >
                    {'labelKey' in link ? t(link.labelKey) : link.label}
                  </Link>
                ))}
              </div>

              {/* Company group */}
              <p className="mt-6 px-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Empresa
              </p>
              <div className="mt-2 space-y-1">
                {COMPANY_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="block rounded-[4px] px-3 py-3 text-[15px] text-ink active:bg-bone/50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Legal group */}
              <p className="mt-6 px-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Legal
              </p>
              <div className="mt-2 space-y-1">
                <Link
                  href="/privacidad"
                  onClick={() => setDrawerOpen(false)}
                  className="block rounded-[4px] px-3 py-2.5 text-[14px] text-steel active:bg-bone/50"
                >
                  Privacidad
                </Link>
                <Link
                  href="/terminos"
                  onClick={() => setDrawerOpen(false)}
                  className="block rounded-[4px] px-3 py-2.5 text-[14px] text-steel active:bg-bone/50"
                >
                  Términos
                </Link>
              </div>
            </nav>

            <div className="border-t border-bone px-4 py-4">
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="block w-full rounded-[4px] border border-ink py-3 text-center text-[14px] font-medium text-ink"
              >
                {t('login')}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

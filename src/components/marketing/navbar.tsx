'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LogoLockup } from '@/components/ui/logo'
import { Link } from '@/i18n/navigation'

export function Navbar() {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)

  // Lock body scroll when drawer is open (mobile)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Close drawer on escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <nav
        className="sticky top-0 z-50 h-14 border-b border-bone bg-paper md:h-16"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Inicio">
            <LogoLockup className="h-6 md:h-7" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#pillars"
              className="text-[13px] text-steel hover:text-ink transition-colors"
            >
              {t('producto')}
            </a>
            <a
              href="#pricing"
              className="text-[13px] text-steel hover:text-ink transition-colors"
            >
              {t('precios')}
            </a>
            <a
              href="#stats"
              className="text-[13px] text-steel hover:text-ink transition-colors"
            >
              {t('recursos')}
            </a>
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-[13px] text-ink hover:text-steel transition-colors"
            >
              {t('login')}
            </Link>
            <Link
              href="/login"
              className="rounded-[4px] bg-signal px-4 py-2.5 text-[13px] font-medium text-paper hover:bg-signal/90 transition-colors"
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
              onClick={() => setOpen(true)}
              className="text-ink"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer (right side) */}
      {open && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/50" />
          <aside
            className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex items-center justify-between border-b border-bone px-4 py-3">
              <LogoLockup className="h-6" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-steel hover:text-ink transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-4 py-4">
              <a
                href="#pillars"
                onClick={() => setOpen(false)}
                className="rounded-[4px] px-3 py-3 text-[15px] text-ink active:bg-bone/50"
              >
                {t('producto')}
              </a>
              <a
                href="#pricing"
                onClick={() => setOpen(false)}
                className="rounded-[4px] px-3 py-3 text-[15px] text-ink active:bg-bone/50"
              >
                {t('precios')}
              </a>
              <a
                href="#stats"
                onClick={() => setOpen(false)}
                className="rounded-[4px] px-3 py-3 text-[15px] text-ink active:bg-bone/50"
              >
                {t('recursos')}
              </a>
            </nav>

            <div className="mt-auto border-t border-bone px-4 py-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
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

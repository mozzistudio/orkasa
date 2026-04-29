'use client'

import { useTranslations } from 'next-intl'
import { LogoLockup } from '@/components/ui/logo'
import { Link } from '@/i18n/navigation'

export function Navbar() {
  const t = useTranslations('nav')

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-bone bg-paper">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <LogoLockup className="h-7" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#pillars" className="text-[13px] text-steel hover:text-ink transition-colors">
            {t('producto')}
          </a>
          <a href="#pricing" className="text-[13px] text-steel hover:text-ink transition-colors">
            {t('precios')}
          </a>
          <a href="#stats" className="text-[13px] text-steel hover:text-ink transition-colors">
            {t('recursos')}
          </a>
        </div>

        <div className="flex items-center gap-3">
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
      </div>
    </nav>
  )
}

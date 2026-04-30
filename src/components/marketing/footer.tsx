'use client'

import { useTranslations } from 'next-intl'
import { LogoMark } from '@/components/ui/logo'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')

  const columns: Array<{
    title: string
    links: Array<{ label: string; href: string; external?: boolean }>
  }> = [
    {
      title: t('producto'),
      links: [
        { label: t('listings'), href: '/producto' },
        { label: t('leads'), href: '/producto' },
        { label: t('analytics'), href: '/producto' },
        { label: t('pricing'), href: '/precios' },
        { label: 'Integraciones', href: '/integraciones' },
      ],
    },
    {
      title: t('empresa'),
      links: [
        { label: t('about'), href: '/sobre-nosotros' },
        { label: t('blog'), href: '/blog' },
        { label: t('careers'), href: '/contacto' },
        { label: t('contact'), href: '/contacto' },
      ],
    },
    {
      title: t('legal'),
      links: [
        { label: t('privacy'), href: '/privacidad' },
        { label: t('terms'), href: '/terminos' },
      ],
    },
    {
      title: t('soporte'),
      links: [
        { label: t('docs'), href: '/recursos' },
        { label: t('api'), href: '/recursos' },
        { label: t('status'), href: 'https://status.orkasa.io', external: true },
      ],
    },
  ]

  return (
    <footer
      className="bg-coal px-4 py-12 md:px-6 md:py-16"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)',
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-steel md:mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-bone hover:text-paper transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13px] text-bone hover:text-paper transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start gap-4 border-t border-bone/20 pt-6 md:mt-12 md:flex-row md:items-center md:justify-between md:pt-8">
          <Link href="/" aria-label="Inicio">
            <LogoMark size={24} className="text-paper" />
          </Link>
          <p className="font-mono text-[11px] text-steel">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}

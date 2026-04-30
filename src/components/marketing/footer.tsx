'use client'

import { useTranslations } from 'next-intl'
import { LogoMark } from '@/components/ui/logo'

export function Footer() {
  const t = useTranslations('footer')

  const columns = [
    {
      title: t('producto'),
      links: [t('listings'), t('leads'), t('analytics'), t('pricing')],
    },
    {
      title: t('empresa'),
      links: [t('about'), t('blog'), t('careers'), t('contact')],
    },
    {
      title: t('legal'),
      links: [t('privacy'), t('terms')],
    },
    {
      title: t('soporte'),
      links: [t('docs'), t('api'), t('status')],
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
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[13px] text-bone hover:text-paper transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start gap-4 border-t border-bone/20 pt-6 md:mt-12 md:flex-row md:items-center md:justify-between md:pt-8">
          <LogoMark size={24} className="text-paper" />
          <p className="font-mono text-[11px] text-steel">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}

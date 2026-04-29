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
    <footer className="bg-coal px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[2px] text-steel">
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
        <div className="mt-12 flex items-center justify-between border-t border-bone/20 pt-8">
          <LogoMark size={24} className="text-paper" />
          <p className="font-mono text-[11px] text-steel">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}

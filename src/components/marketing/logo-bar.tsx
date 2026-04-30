'use client'

import { useTranslations } from 'next-intl'

/**
 * Stylized wordmark "logos" for the social-proof bar. Uses real-feeling
 * brokerage names (fictional, no real-world association implied) rendered
 * in mono uppercase to match the DS 02 aesthetic. When real partner logos
 * become available, swap each entry for an SVG.
 */
const AGENCIES = [
  { name: 'PREMIER', subtitle: 'REAL · ESTATE' },
  { name: 'VARGAS', subtitle: 'INMOBILIARIA' },
  { name: 'CASA NUEVA', subtitle: 'PA · DO' },
  { name: 'MJR', subtitle: 'PROPERTIES' },
  { name: 'LATAM HOMES', subtitle: 'MX · CO' },
] as const

export function LogoBar() {
  const t = useTranslations('logos')

  return (
    <section className="border-y border-bone px-4 py-10 md:px-6 md:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-8 text-center font-mono text-[10px] uppercase tracking-[1.5px] text-steel md:mb-10 md:text-[11px]">
          {t('title')}
        </p>
        <ul className="grid grid-cols-2 items-center justify-items-center gap-x-4 gap-y-6 md:grid-cols-5 md:gap-x-8">
          {AGENCIES.map((agency) => (
            <li
              key={agency.name}
              className="text-center opacity-60 transition-opacity hover:opacity-100"
            >
              <span className="block font-mono text-[14px] font-medium tracking-[1px] text-ink md:text-[15px]">
                {agency.name}
              </span>
              <span className="mt-0.5 block font-mono text-[9px] tracking-[2px] text-steel md:text-[10px]">
                {agency.subtitle}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

'use client'

import { useTranslations } from 'next-intl'

const stats = [
  { valueKey: 'hours', labelKey: 'hoursLabel' },
  { valueKey: 'leads', labelKey: 'leadsLabel' },
  { valueKey: 'response', labelKey: 'responseLabel' },
  { valueKey: 'portals', labelKey: 'portalsLabel' },
] as const

export function StatsBar() {
  const t = useTranslations('stats')

  return (
    <section id="stats" className="bg-ink px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        {stats.map(({ valueKey, labelKey }) => (
          <div key={valueKey} className="text-center">
            <div className="font-mono text-[28px] font-medium tabular-nums text-paper md:text-[32px]">
              {t(valueKey)}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[1.5px] text-steel md:text-[11px]">
              {t(labelKey)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

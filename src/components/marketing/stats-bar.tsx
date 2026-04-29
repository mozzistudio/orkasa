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
    <section id="stats" className="bg-ink px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map(({ valueKey, labelKey }) => (
          <div key={valueKey} className="text-center">
            <div className="font-mono text-[32px] font-medium tabular-nums text-paper">
              {t(valueKey)}
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[1.5px] text-steel">
              {t(labelKey)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

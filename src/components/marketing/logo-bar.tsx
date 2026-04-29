'use client'

import { useTranslations } from 'next-intl'

export function LogoBar() {
  const t = useTranslations('logos')

  return (
    <section className="border-y border-bone px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-[1.5px] text-steel">
          {t('title')}
        </p>
        <div className="flex items-center justify-center gap-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 rounded-[4px] bg-bone/60"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

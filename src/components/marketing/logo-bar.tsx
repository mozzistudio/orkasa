'use client'

import { useTranslations } from 'next-intl'

export function LogoBar() {
  const t = useTranslations('logos')

  return (
    <section className="border-y border-bone px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[1.5px] text-steel md:mb-8 md:text-[11px]">
          {t('title')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 rounded-[4px] bg-bone/60 md:h-8 md:w-24"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

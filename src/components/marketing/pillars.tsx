'use client'

import { useTranslations } from 'next-intl'
import { Sparkles, Share2, MessageSquare } from 'lucide-react'

const icons = [Sparkles, Share2, MessageSquare]
const keys = ['listing', 'multipost', 'leads'] as const

export function Pillars() {
  const t = useTranslations('pillars')

  return (
    <section id="pillars" className="px-6 py-20">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
        {keys.map((key, i) => {
          const Icon = icons[i]
          return (
            <div key={key}>
              <Icon className="mb-4 h-6 w-6 text-ink" strokeWidth={1.5} />
              <h3 className="text-[16px] font-medium tracking-[-0.3px] text-ink">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-steel">
                {t(`${key}.description`)}
              </p>
              <a
                href="#"
                className="mt-4 inline-block text-[13px] font-medium text-signal hover:text-signal/80 transition-colors"
              >
                {t(`${key}.link`)} →
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}

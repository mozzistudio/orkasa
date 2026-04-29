'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Link } from '@/i18n/navigation'

const plans = ['solo', 'team', 'brokerage'] as const

export function Pricing() {
  const t = useTranslations('pricing')

  return (
    <section id="pricing" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            {t('title')}
          </h2>
          <p className="mt-2 text-[13px] text-steel">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isPopular = plan === 'team'
            const features = t.raw(`${plan}.features`) as string[]

            return (
              <div
                key={plan}
                className={`rounded-[4px] border bg-paper p-6 ${
                  isPopular ? 'border-2 border-ink' : 'border-bone'
                }`}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-medium text-ink">
                    {t(`${plan}.name`)}
                  </h3>
                  {isPopular && (
                    <span className="rounded-[4px] bg-bone px-2 py-0.5 font-mono text-[11px] text-ink">
                      {t('team.popular')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-steel">
                  {t(`${plan}.description`)}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-mono text-[32px] font-medium tabular-nums text-ink">
                    ${t(`${plan}.price`)}
                  </span>
                  <span className="font-mono text-[12px] text-steel">
                    {t('monthly')}
                  </span>
                </div>
                <Link
                  href="/login"
                  className={`mt-6 block rounded-[4px] px-4 py-2.5 text-center text-[13px] font-medium transition-colors ${
                    isPopular
                      ? 'bg-ink text-paper hover:bg-coal'
                      : 'border border-ink text-ink hover:bg-bone/50'
                  }`}
                >
                  {plan === 'brokerage' ? t('contact') : t('cta')}
                </Link>
                <ul className="mt-6 space-y-3">
                  {features.map((feature: string) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-[13px] text-ink"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-steel"
                        strokeWidth={1.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

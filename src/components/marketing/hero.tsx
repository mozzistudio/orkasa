'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Hero() {
  const t = useTranslations('hero')

  return (
    <section className="px-4 py-16 md:px-6 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-1px] text-ink sm:text-[44px] md:text-[56px] md:tracking-[-1.5px]">
            {t('line1')}
            <br />
            {t('line2')}
          </h1>
          <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-steel md:mt-6 md:text-[17px]">
            {t('subtitle')}
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center md:mt-10">
            <Link
              href="/login"
              className="rounded-[4px] bg-ink px-5 py-3 text-center text-[14px] font-medium text-paper hover:bg-coal transition-colors md:text-[13px]"
            >
              {t('cta1')}
            </Link>
            <a
              href="#"
              className="rounded-[4px] border border-ink px-5 py-3 text-center text-[14px] text-ink hover:bg-bone/50 transition-colors md:text-[13px]"
            >
              {t('cta2')} →
            </a>
          </div>
        </div>

        {/* Fake dashboard screenshot */}
        <div className="relative border border-ink bg-paper">
          <div className="h-[320px] bg-coal relative overflow-hidden">
            {/* Scanlines */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(0deg, transparent 49%, rgba(255,255,255,0.06) 50%, transparent 51%)',
                backgroundSize: '100% 16px',
              }}
            />
            <div className="absolute left-4 top-4 font-mono text-[9px] tracking-wider text-paper">
              [ ID 04829 ]
            </div>
            <div className="absolute right-4 top-4 rounded-[4px] bg-signal px-2 py-1 font-mono text-[10px] font-medium tracking-wider text-paper">
              FOR SALE
            </div>
            <div className="absolute bottom-4 left-4 font-mono text-[9px] text-steel">
              12.IMG · 1.MP4 · 3D
            </div>
          </div>
          <div className="border-t border-ink p-4">
            <div className="text-[16px] font-medium tracking-[-0.3px] text-ink">
              Costa del Este PH
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-wider text-steel">
              CDE · 3BR · 180M²
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-bone pt-3">
              <div className="text-[18px] font-medium text-ink">$485,000</div>
              <div className="font-mono text-[10px] text-signal">SCORE 92</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

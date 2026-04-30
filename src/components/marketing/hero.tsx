'use client'

import Image from 'next/image'
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
            <Link
              href="/producto"
              className="rounded-[4px] border border-ink px-5 py-3 text-center text-[14px] text-ink hover:bg-bone/50 transition-colors md:text-[13px]"
            >
              {t('cta2')} →
            </Link>
          </div>
        </div>

        {/* Listing card mockup with real photo */}
        <div className="relative overflow-hidden rounded-[4px] border border-ink bg-paper">
          <div className="relative h-[320px] overflow-hidden bg-coal">
            <Image
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80"
              alt="Costa del Este PH — penthouse Panamá"
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              priority
            />
            {/* Top gradient for chip legibility */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink/70 to-transparent" />
            {/* Bottom gradient for footer chip legibility */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/70 to-transparent" />
            <div className="absolute left-4 top-4 font-mono text-[10px] tracking-wider text-paper">
              [ ID 04829 ]
            </div>
            <div className="absolute right-4 top-4 rounded-[4px] bg-signal px-2 py-1 font-mono text-[10px] font-medium tracking-wider text-paper">
              FOR SALE
            </div>
            <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-wider text-paper/90">
              12.IMG · 1.MP4 · 3D
            </div>
            <div className="absolute bottom-4 right-4 rounded-[4px] bg-paper/90 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-signal backdrop-blur-sm">
              SCORE 92
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
              <div className="font-mono text-[10px] uppercase tracking-wider text-steel">
                Publicado en 8 portales
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

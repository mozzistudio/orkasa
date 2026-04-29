'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Plus } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { seedDemoData } from '@/app/[locale]/app/actions'

export function EmptyState() {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSeed() {
    setError(null)
    startTransition(async () => {
      const result = await seedDemoData()
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="rounded-[4px] border border-bone bg-paper p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[4px] bg-bone">
        <Sparkles className="h-5 w-5 text-ink" strokeWidth={1.5} />
      </div>
      <h2 className="text-[18px] font-medium tracking-[-0.4px] text-ink">
        {t('emptyTitle')}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-steel">
        {t('emptyDescription')}
      </p>

      {error && (
        <p className="mx-auto mt-4 inline-block rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={handleSeed}
          disabled={pending}
          type="button"
          className="inline-flex items-center gap-2 rounded-[4px] bg-signal px-4 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90 disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          {pending ? t('seeding') : t('seedDemo')}
        </button>
        <button
          onClick={() => router.push('/app/properties/new')}
          type="button"
          className="inline-flex items-center gap-2 rounded-[4px] border border-ink px-4 py-2.5 text-[13px] text-ink transition-colors hover:bg-bone/50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t('uploadProperty')}
        </button>
      </div>
    </div>
  )
}

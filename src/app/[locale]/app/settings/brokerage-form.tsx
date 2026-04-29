'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { updateBrokerage } from './actions'

export function BrokerageForm({
  name,
  ruc,
  country,
}: {
  name: string
  ruc: string
  country: string
}) {
  const t = useTranslations('settings')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateBrokerage(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="brokerage_name" className="text-[13px] text-ink">
            {t('brokerageName')}
          </Label>
          <Input
            id="brokerage_name"
            name="brokerage_name"
            defaultValue={name}
            required
            className="h-9 rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ruc" className="text-[13px] text-ink">
            {t('ruc')}
          </Label>
          <Input
            id="ruc"
            name="ruc"
            defaultValue={ruc}
            placeholder="E-8-XXXXXX"
            className="h-9 rounded-[4px] border-bone font-mono text-[13px] focus:border-ink focus:ring-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country" className="text-[13px] text-ink">
            {t('country')}
          </Label>
          <Input
            id="country"
            name="country"
            defaultValue={country}
            maxLength={2}
            className="h-9 rounded-[4px] border-bone font-mono text-[13px] uppercase focus:border-ink focus:ring-0"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[#0A6B3D]">
            <Check className="h-3 w-3" strokeWidth={1.5} />
            Guardado
          </span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60"
        >
          {pending ? '…' : t('save')}
        </button>
      </div>
    </form>
  )
}

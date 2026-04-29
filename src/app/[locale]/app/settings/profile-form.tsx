'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { updateProfile } from './actions'

export function ProfileForm({
  fullName,
  email,
  phone,
}: {
  fullName: string
  email: string
  phone: string
}) {
  const t = useTranslations('settings')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateProfile(formData)
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
          <Label htmlFor="full_name" className="text-[13px] text-ink">
            {t('fullName')}
          </Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={fullName}
            required
            className="h-9 rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[13px] text-ink">
            {t('email')}
          </Label>
          <Input
            id="email"
            value={email}
            disabled
            className="h-9 rounded-[4px] border-bone bg-bone/30 font-mono text-[13px] text-steel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[13px] text-ink">
            {t('phone')}
          </Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={phone}
            placeholder="+507 6XXX-XXXX"
            className="h-9 rounded-[4px] border-bone font-mono text-[13px] focus:border-ink focus:ring-0"
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

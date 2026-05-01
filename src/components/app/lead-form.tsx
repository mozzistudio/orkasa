'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown } from 'lucide-react'

const ORIGINS = ['portal', 'web', 'referido', 'whatsapp', 'walk_in', 'other'] as const
const STATUSES = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'negotiating',
  'closed_won',
  'closed_lost',
] as const

export type LeadFormDefaults = {
  full_name?: string
  email?: string | null
  phone?: string | null
  origin?: (typeof ORIGINS)[number]
  status?: (typeof STATUSES)[number]
  property_id?: string | null
  assigned_agent_id?: string | null
  ai_score?: number | null
  notes?: string | null
}

export function LeadForm({
  defaults = {},
  action,
  submitLabel,
  properties,
  agents,
}: {
  defaults?: LeadFormDefaults
  action: (formData: FormData) => Promise<{ error?: string } | void>
  submitLabel: string
  properties: Array<{ id: string; title: string }>
  agents: Array<{ id: string; full_name: string }>
}) {
  const t = useTranslations('leads')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result && 'error' in result && result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="full_name" className="text-[13px] text-ink">
            {t('form.fullName')}
          </Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={defaults.full_name ?? ''}
            placeholder={t('form.fullNamePlaceholder')}
            required
            className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[13px] text-ink">
            {t('form.email')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults.email ?? ''}
            placeholder={t('form.emailPlaceholder')}
            className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[13px] text-ink">
            {t('form.phone')}
          </Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaults.phone ?? ''}
            placeholder={t('form.phonePlaceholder')}
            className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] focus:border-ink focus:ring-0"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[13px] text-ink">{t('form.origin')}</Label>
          <NativeSelect
            name="origin"
            defaultValue={defaults.origin ?? 'web'}
            options={ORIGINS}
            labels={Object.fromEntries(
              ORIGINS.map((o) => [o, t(`origin.${o}`)]),
            )}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[13px] text-ink">{t('form.status')}</Label>
          <NativeSelect
            name="status"
            defaultValue={defaults.status ?? 'new'}
            options={STATUSES}
            labels={Object.fromEntries(
              STATUSES.map((s) => [s, t(`status.${s}`)]),
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai_score" className="text-[13px] text-ink">
            {t('form.aiScore')}
          </Label>
          <Input
            id="ai_score"
            name="ai_score"
            type="number"
            min="0"
            max="100"
            defaultValue={defaults.ai_score ?? ''}
            className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] tabular-nums focus:border-ink focus:ring-0"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-[13px] text-ink">{t('form.property')}</Label>
          <div className="relative">
            <select
              name="property_id"
              defaultValue={defaults.property_id ?? ''}
              className="h-11 w-full appearance-none rounded-[4px] border border-bone bg-paper px-3 pr-8 text-[13px] text-ink focus:border-ink focus:outline-none focus:ring-0 md:h-9"
            >
              <option value="">{t('form.noProperty')}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-[13px] text-ink">
            {t('form.assignedAgent')}
          </Label>
          <div className="relative">
            <select
              name="assigned_agent_id"
              defaultValue={defaults.assigned_agent_id ?? ''}
              className="h-11 w-full appearance-none rounded-[4px] border border-bone bg-paper px-3 pr-8 text-[13px] text-ink focus:border-ink focus:outline-none focus:ring-0 md:h-9"
            >
              <option value="">{t('form.noAssignment')}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes" className="text-[13px] text-ink">
            {t('form.notes')}
          </Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaults.notes ?? ''}
            placeholder={t('form.notesPlaceholder')}
            rows={4}
            className="rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}

      {/* Desktop footer */}
      <div className="hidden md:flex items-center justify-end border-t border-bone pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[4px] bg-ink px-5 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
        >
          {pending ? '…' : submitLabel}
        </button>
      </div>

      {/* Spacer for mobile sticky footer */}
      <div className="h-24 md:hidden" />

      {/* Sticky footer (mobile) */}
      <div
        className="fixed inset-x-0 z-20 border-t border-bone bg-paper px-4 py-3 md:hidden"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[4px] bg-ink px-5 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-coal disabled:opacity-60"
        >
          {pending ? '…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function NativeSelect({
  name,
  defaultValue,
  options,
  labels,
}: {
  name: string
  defaultValue: string
  options: readonly string[]
  labels: Record<string, string>
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={defaultValue}
        required
        className="h-11 w-full appearance-none rounded-[4px] border border-bone bg-paper px-3 pr-8 text-[13px] text-ink focus:border-ink focus:outline-none focus:ring-0 md:h-9"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-steel"
        strokeWidth={1.5}
      />
    </div>
  )
}

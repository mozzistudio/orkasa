'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { addLeadInteraction } from '../actions'

const TYPES = ['note', 'call', 'email', 'whatsapp'] as const

export function AddInteractionForm({ leadId }: { leadId: string }) {
  const t = useTranslations('leads.interaction')
  const [type, setType] = useState<(typeof TYPES)[number]>('note')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('type', type)
    startTransition(async () => {
      const result = await addLeadInteraction(leadId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <div className="flex gap-1.5">
        {TYPES.map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setType(tp)}
            className={`rounded-[4px] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              type === tp
                ? 'bg-ink text-paper'
                : 'border border-bone text-steel hover:text-ink'
            }`}
          >
            {t(`type.${tp}`)}
          </button>
        ))}
      </div>
      <Textarea
        name="content"
        placeholder={t('notePlaceholder')}
        rows={3}
        required
        className="rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
      />
      {error && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-1.5 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
        >
          <Send className="h-3 w-3" strokeWidth={1.5} />
          {pending ? '…' : t('submit')}
        </button>
      </div>
    </form>
  )
}

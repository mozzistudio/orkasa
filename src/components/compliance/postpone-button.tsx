'use client'

import { useTransition } from 'react'
import { Clock } from 'lucide-react'
import { postponeReminder } from '@/app/[locale]/app/compliance/actions'

export function PostponeButton({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      title="Aplazar"
      aria-label="Aplazar recordatorio"
      onClick={() => startTransition(async () => { await postponeReminder(leadId) })}
      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[5px] border-none bg-transparent text-steel hover:bg-bone hover:text-ink disabled:opacity-50"
    >
      <Clock className="h-3 w-3" />
    </button>
  )
}

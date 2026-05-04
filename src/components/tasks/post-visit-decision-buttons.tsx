'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { recordPostVisitDecision } from '@/app/[locale]/app/leads/actions'

export function PostVisitDecisionButtons({
  taskId,
  size = 'md',
  onDone,
}: {
  taskId: string
  size?: 'sm' | 'md'
  onDone?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function decide(decision: 'interested' | 'not_interested') {
    startTransition(async () => {
      await recordPostVisitDecision(taskId, decision)
      router.refresh()
      onDone?.()
    })
  }

  const padding =
    size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-[12px]'

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => decide('interested')}
        className={`inline-flex items-center gap-1 rounded-[6px] bg-ink text-white font-medium hover:bg-coal transition-colors disabled:opacity-50 ${padding}`}
      >
        <Check className="h-3 w-3" strokeWidth={1.5} />
        Interesado
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => decide('not_interested')}
        className={`inline-flex items-center gap-1 rounded-[6px] border border-bone text-steel hover:text-ink hover:border-ink/40 font-medium transition-colors disabled:opacity-50 ${padding}`}
      >
        <X className="h-3 w-3" strokeWidth={1.5} />
        No interesado
      </button>
    </>
  )
}

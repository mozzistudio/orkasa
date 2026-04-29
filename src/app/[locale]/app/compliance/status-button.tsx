'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { updateComplianceStatus } from './actions'

export function ComplianceStatusButton({
  id,
  currentStatus,
}: {
  id: string
  currentStatus:
    | 'pending'
    | 'in_review'
    | 'approved'
    | 'rejected'
    | 'requires_action'
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (currentStatus === 'approved' || currentStatus === 'rejected') {
    return (
      <span className="font-mono text-[11px] uppercase tracking-wider text-steel">
        Final
      </span>
    )
  }

  function decide(next: 'approved' | 'rejected') {
    startTransition(async () => {
      await updateComplianceStatus(id, next, next === 'rejected' ? 'high' : 'low')
      router.refresh()
    })
  }

  return (
    <div className="inline-flex gap-1">
      <button
        type="button"
        onClick={() => decide('approved')}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-[4px] border border-bone px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#0A6B3D] hover:border-[#0A6B3D] transition-colors disabled:opacity-60"
      >
        <Check className="h-3 w-3" strokeWidth={1.5} /> OK
      </button>
      <button
        type="button"
        onClick={() => decide('rejected')}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-[4px] border border-bone px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-signal hover:border-signal transition-colors disabled:opacity-60"
      >
        <X className="h-3 w-3" strokeWidth={1.5} /> NO
      </button>
    </div>
  )
}

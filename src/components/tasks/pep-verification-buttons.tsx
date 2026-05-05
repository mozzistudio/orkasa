'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { approvePepVerification } from '@/app/[locale]/app/compliance/[id]/_actions'
import { PepRejectionModal } from './pep-rejection-modal'

export function PepVerificationButtons({
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
  const [rejectOpen, setRejectOpen] = useState(false)

  function approve() {
    startTransition(async () => {
      const res = await approvePepVerification(taskId)
      if (!res.error) {
        router.refresh()
        onDone?.()
      }
    })
  }

  const padding =
    size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-[12px]'

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={approve}
        className={`inline-flex items-center gap-1 rounded-[6px] bg-ink text-white font-medium hover:bg-coal transition-colors disabled:opacity-50 ${padding}`}
      >
        <Check className="h-3 w-3" strokeWidth={1.5} />
        Aprobar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setRejectOpen(true)}
        className={`inline-flex items-center gap-1 rounded-[6px] border border-bone text-steel hover:text-signal-deep hover:border-signal/30 font-medium transition-colors disabled:opacity-50 ${padding}`}
      >
        <X className="h-3 w-3" strokeWidth={1.5} />
        Rechazar
      </button>
      {rejectOpen && (
        <PepRejectionModal
          taskId={taskId}
          onClose={() => setRejectOpen(false)}
          onDone={() => {
            setRejectOpen(false)
            router.refresh()
            onDone?.()
          }}
        />
      )}
    </>
  )
}

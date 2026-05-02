'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { approveDossier } from '@/app/[locale]/app/compliance/[id]/_actions'
import { ApproveDealModal } from './approve-deal-modal'

export function ApproveDealButton({
  checkId,
  dealValue,
  requireJustification,
}: {
  checkId: string
  dealValue: number
  requireJustification: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleApproveQuick() {
    startTransition(async () => {
      await approveDossier(checkId)
    })
  }

  function handleApproveWithJustification(justification: string) {
    startTransition(async () => {
      await approveDossier(checkId, justification)
      setOpen(false)
    })
  }

  if (requireJustification) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={pending}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-[5px] bg-green-mark px-4 py-2 text-[12px] font-medium text-white hover:bg-green-text disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Aprobar y firmar
        </button>
        {open && (
          <ApproveDealModal
            dealValue={dealValue}
            requireJustification={requireJustification}
            onCancel={() => setOpen(false)}
            onConfirm={handleApproveWithJustification}
            pending={pending}
          />
        )}
      </>
    )
  }

  return (
    <button
      type="button"
      onClick={handleApproveQuick}
      disabled={pending}
      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-[5px] bg-green-mark px-4 py-2 text-[12px] font-medium text-white hover:bg-green-text disabled:opacity-50"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      {pending ? 'Aprobando…' : 'Aprobar y firmar'}
    </button>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { approveDossier } from '@/app/[locale]/app/compliance/[id]/_actions'
import { ApproveDealModal } from './approve-deal-modal'

export function FlaggedActionsButtons({
  checkId,
  dealValue,
}: {
  checkId: string
  dealValue: number
}) {
  const [approveOpen, setApproveOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleApprove(justification: string) {
    startTransition(async () => {
      await approveDossier(checkId, justification)
      setApproveOpen(false)
    })
  }

  return (
    <div className="flex flex-shrink-0 gap-2">
      <button
        type="button"
        onClick={() => setApproveOpen(true)}
        disabled={pending}
        className="inline-flex items-center rounded-[5px] border-0 bg-transparent px-3 py-2 text-[12px] font-medium text-amber-text hover:bg-amber-mark/10 disabled:opacity-50"
      >
        Aprobar con justificación
      </button>
      <button
        type="button"
        className="inline-flex items-center rounded-[5px] bg-ink px-4 py-2 text-[12px] font-medium text-paper hover:bg-coal"
      >
        Iniciar revisión adicional
      </button>
      {approveOpen && (
        <ApproveDealModal
          dealValue={dealValue}
          requireJustification={true}
          onCancel={() => setApproveOpen(false)}
          onConfirm={handleApprove}
          pending={pending}
        />
      )}
    </div>
  )
}

'use client'

import { useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { deleteLead } from '../actions'

export function LeadDeleteButton({ id }: { id: string }) {
  const t = useTranslations('leads')
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 4000)
      return
    }
    startTransition(() => {
      void deleteLead(id)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-[13px] transition-colors disabled:opacity-60 ${
        confirming
          ? 'bg-signal text-paper hover:bg-signal/90'
          : 'border border-bone text-steel hover:border-signal hover:text-signal'
      }`}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
      {pending
        ? '…'
        : confirming
          ? t('deleteConfirm').slice(0, 30) + '…'
          : t('delete')}
    </button>
  )
}

'use client'

import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { approveDeal } from '@/app/[locale]/app/compliance/actions'

export function ApproveButton({
  leadId,
  label,
  variant = 'full',
  className,
}: {
  leadId: string
  label?: string
  variant?: 'full' | 'mini'
  className?: string
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await approveDeal(leadId)
    })
  }

  if (variant === 'mini') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        title={label ?? 'Aprobar y cerrar'}
        aria-label="Aprobar y cerrar"
        className={cn(
          'flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-[#2E7D52] bg-[#2E7D52] text-white hover:bg-[#1F5236] disabled:opacity-50',
          className,
        )}
      >
        <Check className="h-[13px] w-[13px]" strokeWidth={2} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[5px] border border-[#2E7D52] bg-[#2E7D52] px-[11px] py-1.5 font-sans text-[12px] font-medium text-white hover:bg-[#1F5236] disabled:opacity-50',
        className,
      )}
    >
      <Check className="h-3 w-3" strokeWidth={1.8} />
      {label ?? 'Aprobar'}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { ScheduleVisitModal } from '@/components/app/modals/schedule-visit-modal'

export function ScheduleVisitButton({
  leadId,
  propertyId,
}: {
  leadId: string
  propertyId?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[8px] bg-white text-ink border border-bone text-[13px] font-medium hover:border-steel-soft transition-colors"
      >
        <Calendar className="h-[13px] w-[13px]" strokeWidth={1.5} />
        Agendar visita
      </button>
      <ScheduleVisitModal
        open={open}
        onClose={() => setOpen(false)}
        leadId={leadId}
        propertyId={propertyId}
      />
    </>
  )
}

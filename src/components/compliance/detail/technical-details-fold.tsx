'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { formatRelativeEs } from '@/lib/compliance-copy'

export type TechnicalDetails = {
  dossierId: string
  type: string
  ofacClean: boolean
  pepMatch: boolean
  pepScore: number | null
  dueAt: string | null
  legalFramework: string
}

export function TechnicalDetailsFold({ details }: { details: TechnicalDetails }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-[10px] border border-dashed border-bone bg-paper-warm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-[18px] py-3 hover:bg-bone-soft/50"
      >
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
          <Settings className="h-3 w-3" strokeWidth={1.5} />
          Detalles técnicos
        </div>
        {open ? (
          <ChevronUp className="h-3 w-3 text-steel-soft" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="h-3 w-3 text-steel-soft" strokeWidth={1.5} />
        )}
      </button>

      {open && (
        <div className="border-t border-dashed border-bone px-[18px] pt-2 pb-3.5">
          <Row label="ID expediente" value={details.dossierId} mono />
          <Row label="Tipo" value={details.type} mono />
          <Row label="OFAC + ONU + UE">
            <span
              className={`rounded-[2px] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.5px] font-medium ${
                details.ofacClean
                  ? 'bg-green-bg text-green-text'
                  : 'bg-signal-bg text-signal-deep'
              }`}
            >
              {details.ofacClean ? 'limpio' : 'match'}
            </span>
          </Row>
          <Row label="PEP screening">
            <span
              className={`rounded-[2px] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.5px] font-medium ${
                details.pepMatch
                  ? 'bg-amber-bg text-amber-text'
                  : 'bg-green-bg text-green-text'
              }`}
            >
              {details.pepMatch
                ? `match ${details.pepScore ?? 87}%`
                : 'limpio'}
            </span>
          </Row>
          <Row label="Vencimiento" value={formatRelativeEs(details.dueAt)} mono />
          <Row label="Marco legal" value={details.legalFramework} mono />
        </div>
      )}
    </section>
  )
}

function Row({
  label,
  value,
  mono,
  children,
}: {
  label: string
  value?: string
  mono?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2.5 py-1.5 text-[11px]">
      <span className="text-steel">{label}</span>
      <span
        className={`text-right ${mono ? 'font-mono text-[10px]' : ''} text-ink`}
      >
        {children ?? value}
      </span>
    </div>
  )
}

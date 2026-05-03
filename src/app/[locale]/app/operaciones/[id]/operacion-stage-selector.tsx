'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateDealStage } from '../../deals/actions'
import type { Database } from '@/lib/database.types'

type Stage = Database['public']['Enums']['deal_stage']

const ACTIVE_STAGES: Array<{ value: Stage; label: string }> = [
  { value: 'contacto_inicial', label: 'Contacto inicial' },
  { value: 'visitas', label: 'Visitas' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'promesa_firmada', label: 'Promesa firmada' },
  { value: 'tramite_bancario', label: 'Trámite bancario' },
  { value: 'escritura_publica', label: 'Escritura pública' },
  { value: 'entrega_llaves', label: 'Entrega de llaves' },
  { value: 'post_cierre', label: 'Post cierre' },
]

const CLOSED_STAGES: Array<{ value: Stage; label: string }> = [
  { value: 'closed_won', label: 'Cerrada · Ganada' },
  { value: 'closed_lost', label: 'Cerrada · Perdida' },
]

export function OperacionStageSelector({
  dealId,
  currentStage,
}: {
  dealId: string
  currentStage: Stage
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isClosed = currentStage === 'closed_won' || currentStage === 'closed_lost'

  function handleChange(value: string) {
    if (value === currentStage) return
    startTransition(async () => {
      const result = await updateDealStage(dealId, value)
      if (!result.error) {
        router.refresh()
      }
    })
  }

  return (
    <select
      value={currentStage}
      onChange={(e) => handleChange(e.target.value)}
      disabled={pending || isClosed}
      className={`h-9 rounded-[8px] border border-bone bg-paper px-3 text-[13px] font-medium text-ink focus:border-ink focus:outline-none focus:ring-0 disabled:opacity-60 ${
        isClosed ? 'cursor-not-allowed' : ''
      }`}
    >
      <optgroup label="Activa">
        {ACTIVE_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="Cerrada">
        {CLOSED_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </optgroup>
    </select>
  )
}

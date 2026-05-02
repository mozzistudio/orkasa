import type { ComputedStatus } from '@/lib/properties/types'
import { getStatusLabel } from '@/lib/properties/computed-status'

const TONE_STYLES: Record<ComputedStatus['tone'], string> = {
  signal: 'bg-signal text-white',
  amber: 'bg-amber-mark text-white',
  green: 'bg-green-mark text-white',
  neutral: 'bg-paper/85 text-ink backdrop-blur-sm',
}

export function PropertyStatusTag({ status }: { status: ComputedStatus }) {
  return (
    <span
      className={`rounded-[3px] px-2 py-[3px] font-mono text-[9px] font-medium uppercase tracking-[0.8px] ${TONE_STYLES[status.tone]}`}
    >
      {getStatusLabel(status.tag)}
    </span>
  )
}

export function ListingTypeTag({ listingType }: { listingType: 'sale' | 'rent' }) {
  return (
    <span className="rounded-[3px] bg-paper/85 px-2 py-[3px] font-mono text-[9px] font-medium uppercase tracking-[0.8px] text-ink backdrop-blur-sm">
      {listingType === 'sale' ? 'Venta' : 'Alquiler'}
    </span>
  )
}

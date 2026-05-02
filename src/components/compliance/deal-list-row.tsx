import Link from 'next/link'
import { cn, formatPriceCompact } from '@/lib/utils'
import { TableRow, TableCell } from '@/components/ui/table'
import { ComplianceStatusBadge } from './compliance-status-badge'
import type { DealCardData } from './types'

const SEVERITY_VARIANT: Record<string, 'late' | 'soon' | 'ok'> = {
  blocked: 'late',
  waiting: 'soon',
  ready: 'ok',
}

export function DealListRow({ deal }: { deal: DealCardData }) {
  return (
    <TableRow className="border-bone">
      <TableCell className="py-2.5">
        <Link
          href={`/app/compliance/${deal.checkIds[0]}`}
          className="text-[13px] font-medium text-ink hover:underline"
        >
          {deal.leadName}
        </Link>
      </TableCell>
      <TableCell className="py-2.5 text-[12px] text-steel">
        {deal.propertyTitle}
      </TableCell>
      <TableCell className="py-2.5 font-mono text-[12px] text-ink">
        {deal.propertyPrice != null
          ? deal.listingType === 'rent'
            ? `$${deal.propertyPrice.toLocaleString('en-US')}/mes`
            : formatPriceCompact(deal.propertyPrice)
          : '—'}
      </TableCell>
      <TableCell className="py-2.5">
        <ComplianceStatusBadge variant={SEVERITY_VARIANT[deal.severity]}>
          {deal.statusLabel}
        </ComplianceStatusBadge>
      </TableCell>
      <TableCell className="py-2.5 text-[12px] text-steel">
        {deal.statusDescription}
      </TableCell>
      <TableCell
        className={cn(
          'py-2.5 font-mono text-[11px]',
          deal.timingUrgent ? 'font-medium text-signal' : 'text-steel',
        )}
      >
        {deal.timingLabel}
      </TableCell>
      <TableCell className="py-2.5 text-[12px] text-steel">
        {deal.assignedAgentName ?? '—'}
      </TableCell>
    </TableRow>
  )
}

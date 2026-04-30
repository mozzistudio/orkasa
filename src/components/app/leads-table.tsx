'use client'

import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type LeadRow = {
  id: string
  name: string
  origin: string
  score: number
  assigned: string
  date: string
}

export function LeadsTable({ leads }: { leads: readonly LeadRow[] }) {
  const t = useTranslations('dashboard')

  return (
    <div className="rounded-[4px] border border-bone bg-paper">
      <div className="border-b border-bone px-4 py-3">
        <h3 className="text-[16px] font-medium tracking-[-0.3px] text-ink">
          {t('recentLeads')}
        </h3>
      </div>

      {/* Mobile: compact card list */}
      <ul className="divide-y divide-bone md:hidden">
        {leads.map((lead) => (
          <li key={lead.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">
                {lead.name}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-steel">
                {lead.origin} · {lead.assigned}
              </p>
            </div>
            <span className="font-mono text-[15px] tabular-nums text-signal">
              {lead.score}
            </span>
          </li>
        ))}
      </ul>

      {/* Desktop: full table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-bone hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('lead')}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('origin')}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('score')}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('assigned')}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('action')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="border-bone">
                <TableCell className="text-[13px] font-medium text-ink">
                  {lead.name}
                </TableCell>
                <TableCell className="font-mono text-[12px] text-steel">
                  {lead.origin}
                </TableCell>
                <TableCell className="font-mono text-[12px] tabular-nums text-signal">
                  {lead.score}
                </TableCell>
                <TableCell className="text-[13px] text-steel">
                  {lead.assigned}
                </TableCell>
                <TableCell>
                  <button className="font-mono text-[11px] text-ink hover:text-signal transition-colors">
                    {t('view')} →
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

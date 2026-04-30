import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ComplianceStatusButton } from './status-button'

type Check = {
  id: string
  lead_id: string | null
  type: 'kyc' | 'aml' | 'sanctions' | 'pep'
  status:
    | 'pending'
    | 'in_review'
    | 'approved'
    | 'rejected'
    | 'requires_action'
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null
  due_at: string | null
  created_at: string | null
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-signal',
  in_review: 'text-ink',
  approved: 'text-[#0A6B3D]',
  rejected: 'text-signal',
  requires_action: 'text-signal',
}

const RISK_COLOR: Record<string, string> = {
  low: 'text-[#0A6B3D]',
  medium: 'text-ink',
  high: 'text-signal',
  critical: 'text-signal',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

export default async function CompliancePage() {
  const t = await getTranslations('compliance')
  const supabase = await createClient()

  const [checksRes, leadsRes] = await Promise.all([
    supabase
      .from('compliance_checks')
      .select(
        'id, lead_id, type, status, risk_level, due_at, created_at',
      )
      .order('created_at', { ascending: false })
      .returns<Check[]>(),
    supabase
      .from('leads')
      .select('id, full_name')
      .returns<Array<{ id: string; full_name: string }>>(),
  ])

  const leadsById = new Map(
    (leadsRes.data ?? []).map((l) => [l.id, l.full_name]),
  )
  const checks = checksRes.data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          {t('title')}
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {checks.length}
          </span>
        </h1>
        <p className="mt-1 text-[13px] text-steel">{t('subtitle')}</p>
      </div>

      {checks.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-12 text-center">
          <Shield
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="mx-auto max-w-md text-[13px] text-steel">
            {t('empty')}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="space-y-3 md:hidden">
            {checks.map((check) => (
              <li
                key={check.id}
                className="rounded-[4px] border border-bone bg-paper p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {check.lead_id && leadsById.has(check.lead_id) ? (
                      <Link
                        href={`/app/leads/${check.lead_id}`}
                        className="block truncate text-[14px] font-medium text-ink"
                      >
                        {leadsById.get(check.lead_id)}
                      </Link>
                    ) : (
                      <span className="text-[14px] text-steel">—</span>
                    )}
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink">
                      {t(`type.${check.type}`)}
                    </p>
                  </div>
                  <ComplianceStatusButton
                    id={check.id}
                    currentStatus={check.status}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      STATUS_COLOR[check.status] ?? 'text-steel'
                    }`}
                  >
                    {t(`status.${check.status}`)}
                  </span>
                  {check.risk_level && (
                    <>
                      <span className="font-mono text-[10px] text-steel">·</span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-wider ${
                          RISK_COLOR[check.risk_level] ?? 'text-steel'
                        }`}
                      >
                        {t(`risk.${check.risk_level}`)}
                      </span>
                    </>
                  )}
                  {check.due_at && (
                    <>
                      <span className="font-mono text-[10px] text-steel">·</span>
                      <span className="font-mono text-[10px] text-steel">
                        Vence {formatDate(check.due_at)}
                      </span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden rounded-[4px] border border-bone bg-paper md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-bone hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.lead')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.type')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.status')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.risk')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.due')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.created')}
                </TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.id} className="border-bone">
                  <TableCell>
                    {check.lead_id && leadsById.has(check.lead_id) ? (
                      <Link
                        href={`/app/leads/${check.lead_id}`}
                        className="text-[13px] font-medium text-ink hover:text-signal"
                      >
                        {leadsById.get(check.lead_id)}
                      </Link>
                    ) : (
                      <span className="text-[13px] text-steel">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-ink">
                      {t(`type.${check.type}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-mono text-[11px] uppercase tracking-wider ${
                        STATUS_COLOR[check.status] ?? 'text-steel'
                      }`}
                    >
                      {t(`status.${check.status}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {check.risk_level ? (
                      <span
                        className={`font-mono text-[11px] uppercase tracking-wider ${
                          RISK_COLOR[check.risk_level] ?? 'text-steel'
                        }`}
                      >
                        {t(`risk.${check.risk_level}`)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-steel">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-steel">
                    {formatDate(check.due_at)}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-steel">
                    {formatDate(check.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ComplianceStatusButton
                      id={check.id}
                      currentStatus={check.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </>
      )}
    </div>
  )
}

import Link from 'next/link'
import { Plus, LayoutGrid, List, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LeadsKanban, type KanbanLead } from '@/components/app/leads-kanban'
import { LeadsFilters } from './filters'

const STATUS_COLOR: Record<string, string> = {
  new: 'text-signal',
  contacted: 'text-ink',
  qualified: 'text-ink',
  viewing_scheduled: 'text-ink',
  negotiating: 'text-ink',
  closed_won: 'text-[#0A6B3D]',
  closed_lost: 'text-steel',
}

function shortDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
  })
}

function initial(name: string): string {
  return (name[0] ?? '').toUpperCase()
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; status?: string }>
}) {
  const t = await getTranslations('leads')
  const params = await searchParams
  const view = params.view === 'kanban' ? 'kanban' : 'table'
  const q = params.q?.trim() ?? ''
  const VALID_STATUSES = ['new', 'contacted', 'qualified', 'viewing_scheduled', 'negotiating', 'closed_won', 'closed_lost'] as const
  type LeadStatus = (typeof VALID_STATUSES)[number]
  const statusFilter: LeadStatus | null =
    VALID_STATUSES.includes(params.status as LeadStatus)
      ? (params.status as LeadStatus)
      : null

  const supabase = await createClient()

  type RawLead = {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    origin: string
    status: string
    ai_score: number | null
    property_id: string | null
    assigned_agent_id: string | null
    created_at: string | null
  }

  let leadsQuery = supabase
    .from('leads')
    .select(
      'id, full_name, email, phone, origin, status, ai_score, property_id, assigned_agent_id, created_at',
    )
    .order('created_at', { ascending: false })

  if (q.length > 0) {
    const escaped = q.replace(/[%_]/g, '\\$&')
    leadsQuery = leadsQuery.or(
      [
        `full_name.ilike.%${escaped}%`,
        `email.ilike.%${escaped}%`,
        `phone.ilike.%${escaped}%`,
      ].join(','),
    )
  }

  if (statusFilter) {
    leadsQuery = leadsQuery.eq('status', statusFilter)
  }

  const [leadsRes, agentsRes, propertiesRes] = await Promise.all([
    leadsQuery.returns<RawLead[]>(),
    supabase
      .from('agents')
      .select('id, full_name')
      .returns<Array<{ id: string; full_name: string }>>(),
    supabase
      .from('properties')
      .select('id, title')
      .returns<Array<{ id: string; title: string }>>(),
  ])

  const agentsById = new Map((agentsRes.data ?? []).map((a) => [a.id, a.full_name]))
  const propsById = new Map(
    (propertiesRes.data ?? []).map((p) => [p.id, p.title]),
  )
  const leads = leadsRes.data ?? []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          {t('title')}
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {leads.length}
          </span>
        </h1>

        <div className="flex items-center gap-2">
          {/* View toggle — desktop only (kanban unusable on mobile) */}
          <div className="hidden md:inline-flex rounded-[4px] border border-bone p-0.5">
            <Link
              href="/app/leads?view=table"
              className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                view === 'table'
                  ? 'bg-ink text-paper'
                  : 'text-steel hover:text-ink'
              }`}
            >
              <List className="h-3 w-3" strokeWidth={1.5} />
              {t('view.table')}
            </Link>
            <Link
              href="/app/leads?view=kanban"
              className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                view === 'kanban'
                  ? 'bg-ink text-paper'
                  : 'text-steel hover:text-ink'
              }`}
            >
              <LayoutGrid className="h-3 w-3" strokeWidth={1.5} />
              {t('view.kanban')}
            </Link>
          </div>

          <Link
            href="/app/leads/new"
            className="hidden md:inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t('new')}
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <LeadsFilters q={q} status={statusFilter} />
      </div>

      {leads.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-8 text-center md:p-12">
          <Users className="mx-auto mb-3 h-6 w-6 text-steel" strokeWidth={1.5} />
          <p className="text-[13px] text-steel">
            {q || statusFilter
              ? 'Sin resultados con esos filtros.'
              : t('empty')}
          </p>
          {!(q || statusFilter) && (
            <Link
              href="/app/leads/new"
              className="mt-4 inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-coal active:bg-coal w-full justify-center md:w-auto"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t('new')}
            </Link>
          )}
        </div>
      ) : view === 'kanban' ? (
        <LeadsKanban
          leads={
            leads.map(
              (l): KanbanLead => ({
                id: l.id,
                full_name: l.full_name,
                status: l.status as KanbanLead['status'],
                ai_score: l.ai_score,
                origin: l.origin,
                property_title: l.property_id
                  ? (propsById.get(l.property_id) ?? null)
                  : null,
                assigned_name: l.assigned_agent_id
                  ? (agentsById.get(l.assigned_agent_id) ?? null)
                  : null,
              }),
            )
          }
        />
      ) : (
        <>
          {/* Mobile: card layout with avatar */}
          <div className="space-y-2 md:hidden">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/app/leads/${lead.id}`}
                className="flex items-center gap-3 rounded-[4px] border border-bone bg-paper p-3 active:bg-bone/20 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[12px] font-medium text-ink">
                  {initial(lead.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-medium text-ink truncate">
                      {lead.full_name}
                    </p>
                    {lead.ai_score != null && (
                      <span className={`shrink-0 font-mono text-[14px] tabular-nums font-medium ${lead.ai_score > 70 ? 'text-signal' : 'text-steel'}`}>
                        {lead.ai_score}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-steel truncate">
                    {lead.email ?? lead.phone ?? '—'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider ${
                        STATUS_COLOR[lead.status] ?? 'text-steel'
                      }`}
                    >
                      {t(`status.${lead.status}`)}
                    </span>
                    <span className="font-mono text-[10px] text-steel">·</span>
                    <span className="font-mono text-[10px] text-steel uppercase tracking-wider">
                      {t(`origin.${lead.origin}`)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block rounded-[4px] border border-bone bg-paper">
            <Table>
            <TableHeader>
              <TableRow className="border-bone hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.name')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.origin')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.status')}
                </TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.score')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.property')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.assigned')}
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {t('table.created')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-bone hover:bg-bone/30 cursor-pointer"
                >
                  <TableCell>
                    <Link href={`/app/leads/${lead.id}`} className="block">
                      <span className="text-[13px] font-medium text-ink">
                        {lead.full_name}
                      </span>
                      {lead.email && (
                        <span className="ml-2 font-mono text-[11px] text-steel">
                          {lead.email}
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-steel">
                    {t(`origin.${lead.origin}`)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-mono text-[11px] uppercase tracking-wider ${
                        STATUS_COLOR[lead.status] ?? 'text-steel'
                      }`}
                    >
                      {t(`status.${lead.status}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] tabular-nums text-signal">
                    {lead.ai_score ?? '—'}
                  </TableCell>
                  <TableCell className="text-[13px] text-ink">
                    {lead.property_id
                      ? propsById.get(lead.property_id) ?? '—'
                      : '—'}
                  </TableCell>
                  <TableCell className="text-[13px] text-steel">
                    {lead.assigned_agent_id
                      ? agentsById.get(lead.assigned_agent_id) ?? '—'
                      : t('form.noAssignment')}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-steel">
                    {shortDate(lead.created_at)}
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

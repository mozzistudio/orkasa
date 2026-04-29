import Link from 'next/link'
import { Plus, LayoutGrid, List } from 'lucide-react'
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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const t = await getTranslations('leads')
  const params = await searchParams
  const view = params.view === 'kanban' ? 'kanban' : 'table'

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

  const [leadsRes, agentsRes, propertiesRes] = await Promise.all([
    supabase
      .from('leads')
      .select(
        'id, full_name, email, phone, origin, status, ai_score, property_id, assigned_agent_id, created_at',
      )
      .order('created_at', { ascending: false })
      .returns<RawLead[]>(),
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          {t('title')}
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {leads.length}
          </span>
        </h1>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-[4px] border border-bone p-0.5">
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
            className="inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t('new')}
          </Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-12 text-center">
          <p className="text-[13px] text-steel">{t('empty')}</p>
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
        <div className="rounded-[4px] border border-bone bg-paper">
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
      )}
    </div>
  )
}

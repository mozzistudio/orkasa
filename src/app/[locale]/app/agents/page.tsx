import { getTranslations } from 'next-intl/server'
import { UserPlus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Agent = {
  id: string
  full_name: string
  email: string
  role: 'owner' | 'admin' | 'agent'
  created_at: string | null
}

const ROLE_COLOR: Record<string, string> = {
  owner: 'text-signal',
  admin: 'text-ink',
  agent: 'text-steel',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

export default async function AgentsPage() {
  const t = await getTranslations('agents')
  const supabase = await createClient()

  const { data: agents } = await supabase
    .from('agents')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: true })
    .returns<Agent[]>()

  const list = agents ?? []

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            {t('title')}
            <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
              {list.length}
            </span>
          </h1>
          <p className="mt-1 text-[13px] text-steel">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex shrink-0 items-center gap-2 rounded-[4px] border border-bone bg-bone/30 px-3 py-2 text-[13px] text-steel cursor-not-allowed md:px-4"
          title={t('comingSoon')}
          aria-label={t('invite')}
        >
          <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden md:inline">{t('invite')}</span>
        </button>
      </div>

      {/* Mobile: card list */}
      <ul className="space-y-3 md:hidden">
        {list.map((agent) => (
          <li
            key={agent.id}
            className="flex items-center gap-3 rounded-[4px] border border-bone bg-paper p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[12px] text-ink">
              {agent.full_name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? '')
                .join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[14px] font-medium text-ink">
                {agent.full_name}
              </p>
              <p className="truncate font-mono text-[11px] text-steel">
                {agent.email}
              </p>
            </div>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider ${
                ROLE_COLOR[agent.role] ?? 'text-steel'
              }`}
            >
              {t(`role.${agent.role}`)}
            </span>
          </li>
        ))}
      </ul>

      <div className="hidden rounded-[4px] border border-bone bg-paper md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-bone hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('table.name')}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('table.email')}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('table.role')}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                {t('table.joined')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((agent) => (
              <TableRow key={agent.id} className="border-bone">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-bone font-mono text-[10px] text-ink">
                      {agent.full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() ?? '')
                        .join('')}
                    </div>
                    <span className="text-[13px] font-medium text-ink">
                      {agent.full_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[12px] text-steel">
                  {agent.email}
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-[11px] uppercase tracking-wider ${
                      ROLE_COLOR[agent.role] ?? 'text-steel'
                    }`}
                  >
                    {t(`role.${agent.role}`)}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-[11px] text-steel">
                  {formatDate(agent.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 rounded-[4px] border border-dashed border-bone bg-paper p-6 text-center">
        <Users className="mx-auto mb-2 h-5 w-5 text-steel" strokeWidth={1.5} />
        <p className="text-[13px] text-steel">{t('comingSoon')}</p>
      </div>
    </div>
  )
}

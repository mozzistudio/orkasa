import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { formatPriceCompact } from '@/lib/utils'
import { formatResponseTime } from '@/lib/dashboard-copy'
import type { AgentPerformance } from '@/lib/queries/dashboard'
import { cn } from '@/lib/utils'

export async function TeamPerformanceTable({
  agents,
  userRole,
}: {
  agents: AgentPerformance[]
  userRole: string
}) {
  const t = await getTranslations('dashboard.team')
  const isManager = userRole === 'owner' || userRole === 'admin'

  if (!isManager && agents.length <= 1) return null

  if (agents.length === 0) {
    return (
      <section className="mb-2">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
            {isManager ? t('title') : t('yourMetrics')}
          </div>
        </div>
        <div className="rounded-[10px] border border-bone bg-paper px-[18px] py-6 text-center text-[13px] text-steel">
          {t('empty')} →
        </div>
      </section>
    )
  }

  const displayed = isManager ? agents.slice(0, 5) : agents.slice(0, 1)

  return (
    <section className="mb-2">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
          {isManager ? t('title') : t('yourMetrics')}
        </div>
        {isManager && (
          <Link
            href="/app/agents"
            className="text-[11px] text-steel hover:text-ink"
          >
            {t('fullReport')} →
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-[10px] border border-bone bg-paper">
        {displayed.map((agent) => (
          <div
            key={agent.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-bone px-[18px] py-3 last:border-b-0 hover:bg-paper-warm md:grid md:flex-nowrap"
            style={{
              gridTemplateColumns: '28px 1fr 100px 110px 90px auto',
            }}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium',
                agent.tier === 'top' && 'bg-green-bg text-green-text',
                agent.tier === 'warn' && 'bg-signal-bg text-signal-deep',
                agent.tier === 'default' && 'bg-bone text-ink',
              )}
            >
              {agent.initials}
            </div>

            {/* Name */}
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-ink">
                {agent.name}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.8px] text-steel">
                {agent.role === 'owner'
                  ? 'Owner'
                  : agent.role === 'admin'
                    ? 'Admin'
                    : 'Agent'}
              </div>
            </div>

            {/* Pipeline */}
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.8px] text-steel-soft">
                {t('pipeline')}
              </div>
              <div
                className={cn(
                  'font-mono text-[12px]',
                  agent.tier === 'top' && 'text-green-text',
                  agent.tier === 'warn' && 'text-signal-deep',
                  agent.tier === 'default' && 'text-ink',
                )}
              >
                {formatPriceCompact(agent.pipeline)}
              </div>
            </div>

            {/* Response time */}
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.8px] text-steel-soft">
                {t('avgResponse')}
              </div>
              <div
                className={cn(
                  'font-mono text-[12px]',
                  agent.avgResponseMinutes <= 15 && 'text-green-text',
                  agent.avgResponseMinutes > 60 && 'text-signal-deep',
                  agent.avgResponseMinutes > 15 &&
                    agent.avgResponseMinutes <= 60 &&
                    'text-ink',
                )}
              >
                {formatResponseTime(agent.avgResponseMinutes)}
              </div>
            </div>

            {/* Deals / uncontacted */}
            <div>
              {agent.leadsUncontacted > 0 ? (
                <>
                  <div className="font-mono text-[9px] uppercase tracking-[0.8px] text-steel-soft">
                    {t('uncontacted')}
                  </div>
                  <div className="font-mono text-[12px] text-signal-deep">
                    {t('uncontactedLeads', { count: agent.leadsUncontacted })}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono text-[9px] uppercase tracking-[0.8px] text-steel-soft">
                    {t('deals')}
                  </div>
                  <div className="font-mono text-[12px] text-ink">
                    {t('dealsOpen', { count: agent.dealsOpen })}
                  </div>
                </>
              )}
            </div>

            {/* Action */}
            <Link
              href="/app/agents"
              className="whitespace-nowrap rounded-[5px] bg-transparent px-2 py-1.5 text-[11px] text-steel hover:bg-bone-soft hover:text-ink"
            >
              {agent.tier === 'warn' ? `${t('help')} →` : `${t('viewProfile')} →`}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

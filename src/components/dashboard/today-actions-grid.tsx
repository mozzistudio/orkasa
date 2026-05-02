import { getTranslations } from 'next-intl/server'
import type { TodayAction } from '@/lib/queries/dashboard'
import { TodayActionCard } from './today-action-card'

export async function TodayActionsGrid({ actions }: { actions: TodayAction[] }) {
  const t = await getTranslations('dashboard.today')

  const totalPotential = actions.reduce((sum, a) => {
    const match = a.amount.match(/\$?([\d,.]+)\s?K/i)
    return sum + (match ? parseFloat(match[1].replace(',', '')) : 0)
  }, 0)

  return (
    <section className="mb-7">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
          {t('title', { count: actions.length })}
        </div>
        {totalPotential > 0 && (
          <div className="font-mono text-[11px] text-steel">
            {t('potential', { amount: `$${Math.round(totalPotential)}K` })}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <TodayActionCard key={action.id} action={action} />
        ))}
      </div>
    </section>
  )
}

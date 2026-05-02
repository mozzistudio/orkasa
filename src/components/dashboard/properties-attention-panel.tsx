import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import {
  StarIcon,
  EyeIcon,
  BellIcon,
  RefreshIcon,
  BuildingIcon,
} from '@/components/icons/icons'
import type { ComponentType, SVGProps } from 'react'
import type { PropertyAlert } from '@/lib/queries/dashboard'

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

const ACTION_ICONS: Record<string, IconComp> = {
  boost: StarIcon,
  'view-leads': EyeIcon,
  notify: BellIcon,
  renew: RefreshIcon,
}

const THUMB_GRADIENTS = [
  'from-[#8B7355] to-[#5C4A35]',
  'from-[#5D7A8C] to-[#2E4A5C]',
  'from-[#7C8B6F] to-[#4A5C42]',
  'from-[#A89074] to-[#6B5440]',
]

export async function PropertiesAttentionPanel({
  alerts,
}: {
  alerts: PropertyAlert[]
}) {
  const t = await getTranslations('dashboard.properties')

  if (alerts.length === 0) {
    return (
      <section className="rounded-[10px] border border-bone bg-paper">
        <div className="border-b border-bone px-[18px] py-[14px]">
          <div className="flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-bone-soft text-ink">
              <BuildingIcon size={12} />
            </span>
            {t('title')}
          </div>
        </div>
        <div className="px-[18px] py-6 text-center text-[13px] text-steel">
          {t('empty')}
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[10px] border border-bone bg-paper">
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] py-[14px]">
        <div className="min-w-0">
          <div className="mb-[3px] flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] bg-bone-soft text-ink">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6h12v9H2z"/><path d="M2 6l6-4 6 4"/></svg>
            </span>
            {t('title')}
          </div>
          <div className="text-[11px] text-steel">
            {t('subtitle', { count: alerts.length })}
          </div>
        </div>
        <Link
          href="/app/properties"
          className="flex-shrink-0 whitespace-nowrap text-[11px] text-steel hover:text-ink"
        >
          {t('viewInventory')} →
        </Link>
      </div>

      {alerts.map((alert, i) => {
        const Icon = ACTION_ICONS[alert.actionType] ?? EyeIcon
        const gradient = THUMB_GRADIENTS[i % THUMB_GRADIENTS.length]
        return (
          <div
            key={alert.id}
            className="grid grid-cols-[48px_1fr_auto] items-center gap-3 border-b border-bone px-[18px] py-[13px] last:border-b-0 transition-colors hover:bg-paper-warm"
          >
            {/* Thumbnail */}
            {alert.imageUrl ? (
              <div
                className="h-12 w-12 rounded-[6px] border border-bone bg-cover bg-center"
                style={{ backgroundImage: `url(${alert.imageUrl})` }}
              />
            ) : (
              <div
                className={`h-12 w-12 rounded-[6px] border border-bone bg-gradient-to-br ${gradient}`}
              />
            )}

            {/* Info */}
            <div className="min-w-0">
              <div className="mb-[3px] truncate text-[13px] font-medium text-ink">
                {alert.title}
              </div>
              <div
                className={`text-[11px] leading-snug ${
                  alert.severity === 'warn'
                    ? 'text-amber-text'
                    : alert.severity === 'danger'
                      ? 'text-signal-deep'
                      : 'text-green-text'
                }`}
              >
                <strong className="font-medium">{alert.issueStrong}</strong>
                {alert.issue.replace(alert.issueStrong, '') && (
                  <span>
                    {alert.issue.slice(alert.issueStrong.length)}
                  </span>
                )}
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[5px] border border-bone bg-paper-warm text-steel hover:border-steel-soft hover:bg-paper hover:text-ink"
              title={
                alert.actionType === 'boost' ? t('boost')
                : alert.actionType === 'view-leads' ? t('viewLeads')
                : alert.actionType === 'notify' ? t('notifyLeads')
                : t('renewListing')
              }
            >
              <Icon size={13} />
            </button>
          </div>
        )
      })}
    </section>
  )
}

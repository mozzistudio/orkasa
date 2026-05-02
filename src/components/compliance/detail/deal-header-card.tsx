import { formatPrice } from '@/lib/utils'
import { getDossierStatusPill, type DossierState } from '@/lib/compliance-copy'
import { DossierActionsMenu } from './dossier-actions-menu'

const SCENARIO_LABELS: Record<string, string> = {
  sale_buyer: 'Compra · Venta',
  sale_seller: 'Venta',
  rental_tenant: 'Alquiler · Inquilino',
  rental_landlord: 'Alquiler · Propietario',
  broker_sale: 'Broker · Venta',
  broker_rental: 'Broker · Alquiler',
}

export function DealHeaderCard({
  checkId,
  clientName,
  clientPhone,
  propertyTitle,
  propertyId,
  dealValue,
  scenario,
  state,
  missingCount,
  totalRequired,
}: {
  checkId: string
  clientName: string
  clientPhone: string | null
  propertyTitle: string
  propertyId: string | null
  dealValue: number
  scenario: string
  state: DossierState
  missingCount: number
  totalRequired: number
}) {
  const scenarioLabel = SCENARIO_LABELS[scenario] ?? 'Compra · Venta'
  const pill = getDossierStatusPill(state, missingCount)
  const completed = totalRequired - missingCount
  const progress = totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 100

  const progressColor =
    state === 'ready' ? 'bg-green-mark'
    : state === 'flagged' ? 'bg-amber-mark'
    : 'bg-amber-mark'

  return (
    <section className="rounded-[10px] border border-bone bg-paper px-5 py-5 md:px-[22px]">
      {/* Context tag */}
      <div className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[1.3px] text-steel">
        <span>{scenarioLabel}</span>
        <span className="text-steel-soft">·</span>
        <span
          className={`rounded-[3px] px-2 py-0.5 font-mono text-[9px] tracking-[0.8px] ${
            pill.variant === 'warn'
              ? 'bg-amber-bg text-amber-text'
              : pill.variant === 'success'
                ? 'bg-green-bg text-green-text'
                : 'bg-signal-bg text-signal-deep'
          }`}
        >
          {pill.label}
        </span>
      </div>

      {/* Title row */}
      <div className="mb-3.5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-[22px] font-medium tracking-[-0.4px] text-ink">
              {clientName}
            </h1>
            <DossierActionsMenu checkId={checkId} />
          </div>
          <div className="text-[13px] leading-relaxed text-steel">
            Comprador de{' '}
            {propertyId ? (
              <a
                href={`/app/properties/${propertyId}`}
                className="text-ink hover:underline"
              >
                {propertyTitle}
              </a>
            ) : (
              <span className="text-ink">{propertyTitle}</span>
            )}
            {clientPhone && (
              <>
                <span className="mx-2 text-steel-soft">·</span>
                <a href={`tel:${clientPhone}`} className="text-ink hover:underline">
                  {clientPhone}
                </a>
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 md:text-right">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[1.2px] text-steel-soft">
            Valor del deal
          </div>
          <div className="font-mono text-[22px] font-medium tracking-[-0.5px] text-ink">
            {formatPrice(dealValue)}
          </div>
        </div>
      </div>

      {/* Progress */}
      {missingCount > 0 ? (
        <div className="flex items-center gap-3 border-t border-bone pt-3.5">
          <div className="text-[12px] text-steel">
            Faltan{' '}
            <strong className="font-medium text-ink">
              {missingCount} cosa{missingCount > 1 ? 's' : ''}
            </strong>{' '}
            antes de poder firmar
          </div>
          <div className="flex-1 h-1 overflow-hidden rounded-full bg-bone">
            <div
              className={`h-full ${progressColor} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 border-t border-bone pt-3.5">
          <div className="text-[12px] text-green-text">
            <strong className="font-medium">Documentación completa</strong>
          </div>
          <div className="flex-1 h-1 overflow-hidden rounded-full bg-bone">
            <div className="h-full bg-green-mark" style={{ width: '100%' }} />
          </div>
        </div>
      )}
    </section>
  )
}

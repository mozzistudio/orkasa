import { Link } from '@/i18n/navigation'
import { Briefcase, AlertTriangle, ArrowRight } from 'lucide-react'
import type { ForecastSummary } from '@/lib/automation/predictions'

const STAGE_LABELS: Record<string, string> = {
  contacto_inicial: 'Contacto',
  visitas: 'Visitas',
  negociacion: 'Negociación',
  promesa_firmada: 'Promesa',
  tramite_bancario: 'Trámite',
  escritura_publica: 'Escritura',
  entrega_llaves: 'Entrega',
}

const STAGE_DOT: Record<string, string> = {
  contacto_inicial: 'bg-steel',
  visitas: 'bg-steel',
  negociacion: 'bg-amber-mark',
  promesa_firmada: 'bg-amber-mark',
  tramite_bancario: 'bg-amber-mark',
  escritura_publica: 'bg-green-mark',
  entrega_llaves: 'bg-green-mark',
}

function formatPrice(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`
  return `$${amount}`
}

function formatCommission(amount: number): string {
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount}`
}

export function ActiveOperations({
  forecast,
}: {
  forecast: ForecastSummary
}) {
  if (forecast.predictions.length === 0) {
    return (
      <section className="rounded-[10px] border border-bone bg-paper">
        <div className="border-b border-bone px-[18px] py-[14px]">
          <div className="flex items-center gap-[7px] text-[14px] font-medium text-ink">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-signal-bg text-signal-deep">
              <Briefcase className="h-3 w-3" strokeWidth={2} />
            </span>
            Operaciones en curso
          </div>
        </div>
        <div className="px-[18px] py-6 text-center text-[13px] text-steel">
          Sin operaciones activas.
        </div>
      </section>
    )
  }

  const top = forecast.predictions.slice(0, 6)
  const activeCount = forecast.predictions.length

  return (
    <section className="overflow-hidden rounded-[10px] border border-bone bg-paper">
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] py-[14px]">
        <div className="flex items-center gap-[7px] text-[14px] font-medium text-ink">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-signal-bg text-signal-deep">
            <Briefcase className="h-3 w-3" strokeWidth={2} />
          </span>
          Operaciones en curso
        </div>
        <Link
          href="/app/operaciones"
          className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel hover:text-ink transition-colors"
        >
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-3 border-b border-bone">
        <div className="px-[18px] py-3">
          <p className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            Activas
          </p>
          <p className="mt-0.5 font-mono text-[18px] font-medium tabular-nums text-ink">
            {activeCount}
            <span className="ml-1.5 text-[12px] text-steel">
              · {formatPrice(forecast.totalPipelineValue)}
            </span>
          </p>
        </div>
        <div className="border-l border-bone px-[18px] py-3">
          <p className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            Comisión proyectada
          </p>
          <p className="mt-0.5 font-mono text-[18px] font-medium tabular-nums text-signal-deep">
            {formatCommission(forecast.totalCommission)}
          </p>
        </div>
        <div className="border-l border-bone px-[18px] py-3">
          <p
            className={`font-mono text-[10px] uppercase tracking-[1.4px] ${
              forecast.atRiskCount > 0 ? 'text-signal' : 'text-steel'
            }`}
          >
            En riesgo
          </p>
          <p
            className={`mt-0.5 font-mono text-[18px] font-medium tabular-nums ${
              forecast.atRiskCount > 0 ? 'text-signal' : 'text-ink'
            }`}
          >
            {forecast.atRiskCount}
            {forecast.atRiskValue > 0 && (
              <span className="ml-1.5 text-[12px] text-steel">
                · {formatPrice(forecast.atRiskValue)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div>
        {top.map((p, idx) => (
          <Link
            key={p.dealId}
            href={`/app/operaciones/${p.dealId}`}
            className={`block px-[18px] py-3 transition-colors hover:bg-bone-soft ${
              idx !== top.length - 1 ? 'border-b border-bone' : ''
            } ${p.atRisk ? 'bg-signal-bg/30' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-ink truncate">
                    {p.leadName}
                  </span>
                  {p.atRisk && (
                    <span className="group/risk relative flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[1px] text-signal">
                      <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2} />
                      Riesgo
                      {p.riskReason && (
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-max max-w-[260px] rounded-[4px] border border-ink/15 bg-ink px-2 py-1.5 font-mono text-[10px] normal-case tracking-normal text-paper shadow-sm group-hover/risk:block"
                        >
                          {p.riskReason}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[p.stage] ?? 'bg-steel'}`}
                  />
                  <span>{STAGE_LABELS[p.stage] ?? p.stage}</span>
                  <span>·</span>
                  <span>{p.daysInStage}d</span>
                  {p.propertyTitle && (
                    <>
                      <span>·</span>
                      <span className="normal-case tracking-normal truncate">
                        {p.propertyTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end">
                <p className="font-mono text-[11px] tabular-nums text-steel">
                  {formatPrice(p.amount)}
                </p>
                <p className="font-mono text-[12px] font-medium tabular-nums text-signal-deep">
                  +{formatCommission(p.commission)}
                </p>
              </div>
            </div>

            {p.nextTaskTitle && (
              <div className="mt-1.5 flex items-start gap-1.5 pl-3 text-[11px] text-steel">
                <ArrowRight
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 text-steel-soft"
                  strokeWidth={2}
                />
                <span className="line-clamp-1">{p.nextTaskTitle}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

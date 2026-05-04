import { Link } from '@/i18n/navigation'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import type { ForecastSummary } from '@/lib/automation/predictions'

const STAGE_LABELS: Record<string, string> = {
  contacto_inicial: 'Contacto inicial',
  visitas: 'Visitas',
  negociacion: 'Negociación',
  promesa_firmada: 'Promesa',
  tramite_bancario: 'Trámite',
  escritura_publica: 'Escritura',
  entrega_llaves: 'Entrega',
}

function formatPrice(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`
  return `$${amount}`
}

export function PipelinePredictions({
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
              <TrendingUp className="h-3 w-3" strokeWidth={2} />
            </span>
            Forecast del pipeline
          </div>
        </div>
        <div className="px-[18px] py-6 text-center text-[13px] text-steel">
          Sin deals activos para predecir.
        </div>
      </section>
    )
  }

  const top = forecast.predictions.slice(0, 6)

  return (
    <section className="overflow-hidden rounded-[10px] border border-bone bg-paper">
      <div className="flex items-start justify-between gap-3 border-b border-bone px-[18px] py-[14px]">
        <div className="flex items-center gap-[7px] text-[14px] font-medium text-ink">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-signal-bg text-signal-deep">
            <TrendingUp className="h-3 w-3" strokeWidth={2} />
          </span>
          Forecast del pipeline
        </div>
        <Link
          href="/app/deals"
          className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel hover:text-ink transition-colors"
        >
          Ver pipeline →
        </Link>
      </div>

      <div className="grid grid-cols-3 border-b border-bone">
        <div className="px-[18px] py-3">
          <p className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            Pipeline total
          </p>
          <p className="mt-0.5 font-mono text-[18px] font-medium tabular-nums text-ink">
            {formatPrice(forecast.totalPipelineValue)}
          </p>
        </div>
        <div className="border-l border-bone px-[18px] py-3">
          <p className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel">
            Forecast ponderado
          </p>
          <p className="mt-0.5 font-mono text-[18px] font-medium tabular-nums text-ink">
            {formatPrice(forecast.weightedForecast)}
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
            className={`flex items-center gap-3 px-[18px] py-3 transition-colors hover:bg-bone-soft ${
              idx !== top.length - 1 ? 'border-b border-bone' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink truncate">
                  {p.leadName}
                </span>
                {p.atRisk && (
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[1px] text-signal">
                    <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2} />
                    Riesgo
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel mt-0.5">
                {STAGE_LABELS[p.stage] ?? p.stage} · {p.daysInStage}d
                {p.propertyTitle && (
                  <span className="normal-case tracking-normal">
                    {' · '}
                    {p.propertyTitle}
                  </span>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="font-mono text-[11px] tabular-nums text-steel">
                  {formatPrice(p.amount)}
                </p>
                <p className="font-mono text-[12px] font-medium tabular-nums text-ink">
                  {formatPrice(p.weightedAmount)}
                </p>
              </div>
              <ProbabilityBadge value={p.probability} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ProbabilityBadge({ value }: { value: number }) {
  let bg = 'bg-bone'
  let fg = 'text-steel'
  if (value >= 70) {
    bg = 'bg-signal'
    fg = 'text-paper'
  } else if (value >= 40) {
    bg = 'bg-signal-bg'
    fg = 'text-signal-deep'
  }
  return (
    <span
      className={`flex h-9 w-12 shrink-0 items-center justify-center rounded-[4px] font-mono text-[11px] font-medium tabular-nums ${bg} ${fg}`}
    >
      {value}%
    </span>
  )
}

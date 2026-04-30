import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Building2,
  AlertCircle,
  TrendingUp,
  Users,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'

const REPORT_TEMPLATES = [
  {
    code: 'sugef_monthly',
    icon: Building2,
    name: 'Reporte mensual SUGEF',
    description:
      'Resumen ejecutivo para auditoría SUGEF: número de operaciones, screening completado, alertas, decisiones tomadas. PDF firmado.',
    cadence: 'Mensual',
    nextDue: '2026-05-05',
    lastRun: '2026-04-05',
    severity: 'normal',
  },
  {
    code: 'uaf_dos',
    icon: ShieldAlert,
    name: 'Declaración UAF (DOS)',
    description:
      'Declaración de Operación Sospechosa para la Unidad de Análisis Financiero de Panamá. Plazo legal: 24h tras detección.',
    cadence: 'Bajo demanda',
    nextDue: null,
    lastRun: null,
    severity: 'critical',
  },
  {
    code: 'cash_threshold',
    icon: TrendingUp,
    name: 'Reporte de operaciones en efectivo',
    description:
      'Operaciones > USD 10,000 en efectivo o equivalente. Reporte mensual obligatorio (Ley 23, art. 12).',
    cadence: 'Mensual',
    nextDue: '2026-05-10',
    lastRun: '2026-04-10',
    severity: 'normal',
  },
  {
    code: 'kyc_audit',
    icon: Users,
    name: 'Auditoría interna KYC',
    description:
      'Sample aleatorio de 10% de los expedientes KYC. Para auditor interno o externo.',
    cadence: 'Trimestral',
    nextDue: '2026-06-30',
    lastRun: '2026-03-30',
    severity: 'normal',
  },
  {
    code: 'pep_register',
    icon: AlertCircle,
    name: 'Registro de PEPs activos',
    description:
      'Lista de operaciones con personas expuestas políticamente, due diligence reforzada aplicada y status.',
    cadence: 'Mensual',
    nextDue: '2026-05-15',
    lastRun: '2026-04-15',
    severity: 'normal',
  },
  {
    code: 'training',
    icon: FileText,
    name: 'Capacitaciones del equipo',
    description:
      'Certificaciones de compliance del equipo, fechas de renovación, gaps. Requisito SUGEF.',
    cadence: 'Anual',
    nextDue: '2026-12-31',
    lastRun: '2025-12-15',
    severity: 'normal',
  },
] as const

const RECENT_REPORTS = [
  {
    name: 'Reporte mensual SUGEF — Marzo 2026',
    generatedBy: 'Demo Agent',
    generatedAt: '2026-04-05T11:30:00Z',
    sizeKB: 412,
    format: 'PDF',
  },
  {
    name: 'Reporte operaciones efectivo — Marzo 2026',
    generatedBy: 'Demo Agent',
    generatedAt: '2026-04-10T09:15:00Z',
    sizeKB: 88,
    format: 'CSV',
  },
  {
    name: 'Auditoría KYC Q1 2026',
    generatedBy: 'Demo Agent',
    generatedAt: '2026-03-30T16:00:00Z',
    sizeKB: 1240,
    format: 'PDF',
  },
] as const

function dateOnly(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function dateLong(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ReportsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/app/compliance"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        Compliance
      </Link>

      <header className="mb-6 md:mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
          Reportes
        </p>
        <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
          Generador de reportes regulatorios
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] text-steel">
          Templates pre-cargados para SUGEF, UAF y auditoría interna. Datos
          extraídos automáticamente del CRM, listos para revisión y firma del
          compliance officer.
        </p>
      </header>

      {/* Templates */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-ink" strokeWidth={1.5} />
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Templates disponibles
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-steel">
            {REPORT_TEMPLATES.length}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {REPORT_TEMPLATES.map((tpl) => {
            const Icon = tpl.icon
            const overdue =
              tpl.nextDue && new Date(tpl.nextDue) < new Date()
            return (
              <article
                key={tpl.code}
                className={`flex flex-col rounded-[4px] border bg-paper p-5 transition-colors hover:border-ink ${
                  tpl.severity === 'critical'
                    ? 'border-signal/40'
                    : 'border-bone'
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Icon
                    className={`h-5 w-5 ${tpl.severity === 'critical' ? 'text-signal' : 'text-ink'}`}
                    strokeWidth={1.5}
                  />
                  {tpl.cadence && (
                    <span className="rounded-[3px] bg-bone px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                      {tpl.cadence}
                    </span>
                  )}
                </div>
                <h3 className="text-[15px] font-medium tracking-[-0.2px] text-ink">
                  {tpl.name}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-steel">
                  {tpl.description}
                </p>
                <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-bone pt-3 font-mono text-[10px] uppercase tracking-wider text-steel">
                  {tpl.nextDue && (
                    <div>
                      <dt className="inline text-steel">Próximo:</dt>{' '}
                      <dd
                        className={`inline ${overdue ? 'text-signal' : 'text-ink'}`}
                      >
                        {dateOnly(tpl.nextDue)}
                        {overdue && ' · vencido'}
                      </dd>
                    </div>
                  )}
                  {tpl.lastRun && (
                    <div>
                      <dt className="inline text-steel">Último:</dt>{' '}
                      <dd className="inline text-ink">
                        {dateOnly(tpl.lastRun)}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[4px] bg-ink px-3 py-2 text-[12px] font-medium text-paper transition-colors hover:bg-coal"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Generar
                  </button>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-bone px-3 py-2 text-[12px] text-ink transition-colors hover:border-ink"
                  >
                    Configurar
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Recent generated reports */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ink" strokeWidth={1.5} />
            <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Reportes generados
            </h2>
          </div>
          <Link
            href="/app/compliance/audit-log"
            className="font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
          >
            historial completo →
          </Link>
        </div>

        <ul className="overflow-hidden rounded-[4px] border border-bone bg-paper divide-y divide-bone">
          {RECENT_REPORTS.map((r) => (
            <li
              key={r.name}
              className="flex items-center gap-4 px-4 py-3 md:px-5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-bone">
                <FileText className="h-4 w-4 text-ink" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">
                  {r.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                  {r.format} · {r.sizeKB} KB · por {r.generatedBy} ·{' '}
                  {dateLong(r.generatedAt)}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
              >
                <Download className="h-3 w-3" strokeWidth={1.5} />
                Descargar
              </button>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-steel"
                strokeWidth={1.5}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

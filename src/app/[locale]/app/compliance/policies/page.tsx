import Link from 'next/link'
import {
  ArrowLeft,
  Settings,
  AlertCircle,
  Bell,
  Workflow,
  Mail,
  ShieldAlert,
  ChevronRight,
  Save,
} from 'lucide-react'

const RISK_THRESHOLDS = [
  {
    code: 'amount_low',
    label: 'Monto bajo',
    description: 'Operaciones < USD 50,000',
    risk: 'low',
    actions: ['KYC estándar', 'Sanctions screening básico'],
  },
  {
    code: 'amount_medium',
    label: 'Monto medio',
    description: 'Operaciones USD 50K - 100K',
    risk: 'medium',
    actions: ['KYC estándar', 'Source of funds requerido', 'Screening completo'],
  },
  {
    code: 'amount_high',
    label: 'Monto alto',
    description: 'Operaciones > USD 100,000 (umbral UAF)',
    risk: 'high',
    actions: [
      'Enhanced Due Diligence',
      'Source of wealth obligatorio',
      'Aprobación senior',
      'Reporte UAF automático',
    ],
  },
  {
    code: 'pep_active',
    label: 'PEP activo',
    description: 'Lead identificado como PEP',
    risk: 'critical',
    actions: [
      'Due diligence reforzada',
      'Aprobación compliance officer',
      'Monitoreo continuo',
      'Notificación dirección',
    ],
  },
] as const

const ALERT_TRIGGERS = [
  {
    label: 'Match exacto en lista de sanciones',
    severity: 'critical',
    enabled: true,
    notify: ['compliance_officer', 'broker', 'admin'],
  },
  {
    label: 'Match fuzzy ≥80% en sanciones',
    severity: 'high',
    enabled: true,
    notify: ['compliance_officer'],
  },
  {
    label: 'Match PEP confirmado',
    severity: 'high',
    enabled: true,
    notify: ['compliance_officer', 'broker'],
  },
  {
    label: 'Operación supera umbral UAF',
    severity: 'medium',
    enabled: true,
    notify: ['compliance_officer'],
  },
  {
    label: 'Pagos fragmentados detectados',
    severity: 'high',
    enabled: true,
    notify: ['compliance_officer'],
  },
  {
    label: 'Documento próximo a vencer (<30 días)',
    severity: 'low',
    enabled: true,
    notify: ['broker'],
  },
  {
    label: 'KYC vencido',
    severity: 'medium',
    enabled: true,
    notify: ['broker', 'compliance_officer'],
  },
  {
    label: 'Inconsistencia ingresos/precio detectada',
    severity: 'high',
    enabled: false,
    notify: ['compliance_officer'],
  },
] as const

const APPROVAL_WORKFLOWS = [
  {
    name: 'KYC estándar',
    steps: ['Documentos completos', 'Verificación broker', 'Aprobación broker'],
  },
  {
    name: 'KYC reforzado (>$100K)',
    steps: [
      'Documentos completos',
      'Source of funds verificado',
      'Source of wealth verificado',
      'Verificación compliance officer',
      'Aprobación senior',
    ],
  },
  {
    name: 'Match en sanciones',
    steps: [
      'Análisis match (compliance officer)',
      'Decisión: false positive / escalar',
      'Si escalar: revisión legal',
      'Decisión final + ROS si aplica',
    ],
  },
  {
    name: 'PEP detectado',
    steps: [
      'Confirmación PEP status',
      'Due diligence reforzada',
      'Análisis origen de fondos detallado',
      'Aprobación compliance officer + dirección',
    ],
  },
] as const

const RELANCE_TEMPLATES = [
  {
    name: 'Solicitud KYC inicial',
    channel: 'WhatsApp + Email',
    delay: 'Inmediato al iniciar negociación',
  },
  {
    name: 'Recordatorio documentos faltantes',
    channel: 'WhatsApp',
    delay: '+3 días sin respuesta',
  },
  {
    name: 'Última advertencia documentos',
    channel: 'Email',
    delay: '+7 días sin respuesta',
  },
  {
    name: 'Solicitud source of funds',
    channel: 'Email',
    delay: 'Al detectar operación >$100K',
  },
  {
    name: 'Renovación documento expirando',
    channel: 'WhatsApp + Email',
    delay: '30 días antes de expiración',
  },
] as const

const RISK_TONE: Record<string, string> = {
  low: 'bg-[#0A6B3D]/10 text-[#0A6B3D]',
  medium: 'bg-bone text-ink',
  high: 'bg-signal/10 text-signal',
  critical: 'bg-signal text-paper',
}

const SEVERITY_TONE: Record<string, string> = {
  low: 'bg-bone text-steel',
  medium: 'bg-bone text-ink',
  high: 'bg-signal/10 text-signal',
  critical: 'bg-signal text-paper',
}

export default async function PoliciesPage() {
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
          Reglas y workflows
        </p>
        <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
          Configuración de políticas
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] text-steel">
          Umbrales de riesgo, disparadores de alerta, flujos de aprobación y
          plantillas de relance. Cambios auditados — cada modificación queda
          registrada en el audit log.
        </p>
      </header>

      <div className="space-y-10">
        {/* Risk thresholds */}
        <section>
          <SectionHeader
            icon={ShieldAlert}
            title="Umbrales de riesgo"
            subtitle="Clasificación automática según monto y tipo de cliente"
          />
          <ul className="space-y-3">
            {RISK_THRESHOLDS.map((t) => (
              <li
                key={t.code}
                className="flex items-start gap-4 rounded-[4px] border border-bone bg-paper p-4"
              >
                <span
                  className={`shrink-0 rounded-[4px] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${RISK_TONE[t.risk]}`}
                >
                  {t.risk}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-medium text-ink">{t.label}</h3>
                  <p className="mt-0.5 text-[12px] text-steel">{t.description}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {t.actions.map((a) => (
                      <li
                        key={a}
                        className="rounded-[3px] bg-bone/50 px-1.5 py-0.5 font-mono text-[10px] text-ink"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Alert triggers */}
        <section>
          <SectionHeader
            icon={Bell}
            title="Disparadores de alerta"
            subtitle="Condiciones que generan una notificación automática"
          />
          <div className="overflow-hidden rounded-[4px] border border-bone bg-paper">
            <ul className="divide-y divide-bone">
              {ALERT_TRIGGERS.map((trigger) => (
                <li
                  key={trigger.label}
                  className="flex items-start gap-4 px-4 py-3 md:px-5"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${SEVERITY_TONE[trigger.severity]}`}
                  >
                    {trigger.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-ink">{trigger.label}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                      Notifica: {trigger.notify.join(' · ')}
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      defaultChecked={trigger.enabled}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-bone transition-colors peer-checked:bg-ink" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-paper transition-transform peer-checked:translate-x-4" />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Approval workflows */}
        <section>
          <SectionHeader
            icon={Workflow}
            title="Flujos de aprobación"
            subtitle="Secuencia de pasos requerida según el tipo de operación"
          />
          <ul className="space-y-3">
            {APPROVAL_WORKFLOWS.map((wf) => (
              <li
                key={wf.name}
                className="rounded-[4px] border border-bone bg-paper p-4 md:p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[14px] font-medium text-ink">{wf.name}</h3>
                  <button
                    type="button"
                    className="font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
                  >
                    Editar
                  </button>
                </div>
                <ol className="space-y-2">
                  {wf.steps.map((step, idx) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bone font-mono text-[10px] font-medium tabular-nums text-ink">
                        {idx + 1}
                      </span>
                      <span className="text-[13px] text-ink">{step}</span>
                      {idx < wf.steps.length - 1 && (
                        <ChevronRight
                          className="ml-auto h-3 w-3 text-steel"
                          strokeWidth={1.5}
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </section>

        {/* Relance templates */}
        <section>
          <SectionHeader
            icon={Mail}
            title="Plantillas de relance"
            subtitle="Mensajes automáticos enviados al cliente"
          />
          <div className="overflow-hidden rounded-[4px] border border-bone bg-paper">
            <ul className="divide-y divide-bone">
              {RELANCE_TEMPLATES.map((tpl) => (
                <li
                  key={tpl.name}
                  className="flex items-center gap-4 px-4 py-3 md:px-5"
                >
                  <Mail
                    className="h-4 w-4 shrink-0 text-ink"
                    strokeWidth={1.5}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">
                      {tpl.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                      {tpl.channel} · {tpl.delay}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Save bar (mock) */}
        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-bone bg-paper px-4 py-3 md:mx-0 md:rounded-[4px] md:border md:px-5">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-steel">
            <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
            Cambios auditados — registrados en audit log
          </p>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Settings
  title: string
  subtitle: string
}) {
  return (
    <header className="mb-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-ink" strokeWidth={1.5} />
        <h2 className="text-[18px] font-medium tracking-[-0.3px] text-ink md:text-[20px]">
          {title}
        </h2>
      </div>
      <p className="mt-1 text-[13px] text-steel">{subtitle}</p>
    </header>
  )
}

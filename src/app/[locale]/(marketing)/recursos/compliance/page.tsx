import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ShieldCheck, AlertCircle, FileText, Globe } from 'lucide-react'
import { pageMetadata, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEs = locale === 'es'
  return pageMetadata({
    locale: isEs ? 'es' : 'en',
    path: 'recursos/compliance',
    title: isEs
      ? 'Guía de compliance inmobiliario LATAM — Orkasa'
      : 'LATAM real estate compliance guide — Orkasa',
    description: isEs
      ? 'KYC, AML, sanciones, PEP, datos personales. Marcos regulatorios de Panamá, RD, Costa Rica, Colombia, México y cómo Orkasa te ayuda a cumplir.'
      : 'KYC, AML, sanctions, PEP, personal data. Regulatory frameworks across Panama, DR, Costa Rica, Colombia, Mexico — and how Orkasa helps you comply.',
    keywords: isEs
      ? ['KYC inmobiliario', 'AML inmobiliario', 'compliance Panamá', 'Ley 23 Panamá', 'UAF']
      : ['real estate KYC', 'real estate AML', 'compliance Panama'],
  })
}

const COUNTRIES = [
  {
    code: 'PA',
    name: 'Panamá',
    framework: 'Ley 23 (2015) + Acuerdos UAF',
    threshold: 'USD 10,000 efectivo · cualquier monto sospechoso',
    authority: 'Unidad de Análisis Financiero (UAF)',
    requires: ['KYC sujeto obligado', 'PEP enhanced', 'Reporte ROS', 'Listas ONU/OFAC'],
  },
  {
    code: 'CO',
    name: 'Colombia',
    framework: 'Circular Externa SUPERFINANCIERA + UIAF',
    threshold: 'USD 10,000 o equivalente en COP',
    authority: 'Unidad de Información y Análisis Financiero (UIAF)',
    requires: ['SARLAFT', 'PEP screening', 'ROS', 'Listas ONU/OFAC'],
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    framework: 'Ley 155-17 + UAF Dominicana',
    threshold: 'USD 15,000 efectivo · cualquier monto sospechoso',
    authority: 'Unidad de Análisis Financiero (UAF)',
    requires: ['Debida diligencia', 'PEP', 'ROS', 'Listas ONU/OFAC'],
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    framework: 'Ley 8204 + Reglamento SUGEF',
    threshold: 'USD 10,000 efectivo',
    authority: 'SUGEF · ICD',
    requires: ['Conozca a su cliente', 'PEP', 'ROS', 'Listas ONU/OFAC'],
  },
  {
    code: 'MX',
    name: 'México',
    framework: 'LFPIORPI + Reglamento SHCP',
    threshold: 'Actividades vulnerables: 8,025 UMAs (~USD 50K) inmuebles',
    authority: 'SAT · UIF',
    requires: ['Identificación', 'Aviso al SAT', 'PEP', 'Listas ONU/OFAC'],
  },
] as const

const FAQ = [
  {
    q: '¿Cuándo debo iniciar el flujo de KYC?',
    a: 'Cuando una negociación pasa de "interés general" a "compromiso concreto" — típicamente al firmar opción de compra, recibir reserva, o cuando el monto supera el umbral local. Orkasa lo activa automáticamente al cambiar el lead a estado "negociando" o "viewing scheduled".',
  },
  {
    q: '¿Qué documentos pide el flujo?',
    a: 'Persona física: cédula/pasaporte vigente, comprobante de domicilio (<3 meses), declaración de origen de fondos, declaración PEP. Persona jurídica: certificado de existencia, RUC, identificación de beneficiarios finales (≥25%), poderes vigentes.',
  },
  {
    q: '¿Cómo se hace el screening contra listas?',
    a: 'Orkasa hace match automático contra OFAC SDN, UN Sanctions, EU Consolidated List, y listas locales (UAF Panamá). Match positivo = bloqueo automático y alerta al compliance officer.',
  },
  {
    q: '¿Qué es un PEP y por qué importa?',
    a: 'Persona Expuesta Políticamente — funcionarios públicos de alto rango, sus familiares y allegados. Operaciones con PEPs requieren due diligence reforzada (origen detallado de fondos, aprobación senior, monitoreo continuo).',
  },
  {
    q: '¿Orkasa genera el ROS automáticamente?',
    a: 'Genera el borrador en formato compatible con la autoridad local (UAF, UIAF, etc.) con todos los datos de la operación. El compliance officer revisa y firma antes de envío. Orkasa registra fecha y hash del envío para auditoría.',
  },
  {
    q: '¿Cómo manejan los datos personales?',
    a: 'Cumplimos con Ley 81 de Panamá, GDPR para clientes europeos, Ley 1581 de Colombia. RLS scoped por brokerage_id, encriptación at-rest, derechos ARCO disponibles desde el panel del lead. Ver política completa en /privacidad.',
  },
]

export default async function ComplianceGuidePage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Recursos', path: 'recursos' },
    { name: 'Compliance', path: 'recursos/compliance' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/recursos"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
          >
            <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />
            Recursos
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Compliance
          </p>
          <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[48px]">
            Guía de compliance
            <br />
            inmobiliario LATAM.
          </h1>
          <p className="mt-6 max-w-[600px] text-[15px] leading-relaxed text-steel md:text-[17px]">
            KYC, AML, sanciones, PEP. Qué te exige cada país y cómo Orkasa
            automatiza la parte mecánica para que vos te enfoques en la
            decisión de riesgo.
          </p>
        </div>
      </section>

      {/* What it covers */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
            Qué cubre Orkasa
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Pillar
              icon={ShieldCheck}
              title="KYC / Conozca a su cliente"
              body="Recolección de identificación, comprobante de domicilio, declaración de origen de fondos. Verificación de cédula contra registro civil cuando aplica."
            />
            <Pillar
              icon={AlertCircle}
              title="Screening contra listas"
              body="Match automático contra OFAC, UN, EU y listas locales. Alertas en tiempo real, log inmodificable de cada verificación."
            />
            <Pillar
              icon={Globe}
              title="PEP / Personas Expuestas"
              body="Detección de funcionarios públicos, familiares y allegados. Activa due diligence reforzada y aprobación senior automática."
            />
            <Pillar
              icon={FileText}
              title="Reportes regulatorios"
              body="Borrador automático del ROS / SAR en formato local. Mantiene cadena de custodia y hashes para auditoría."
            />
          </div>
        </div>
      </section>

      {/* Country matrix */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
            Marcos regulatorios por país
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-steel">
            Resumen ejecutivo. La guía completa con artículos comentados está
            en la documentación.
          </p>
          <div className="mt-8 space-y-4">
            {COUNTRIES.map((c) => (
              <article
                key={c.code}
                className="rounded-[4px] border border-bone bg-paper p-5 md:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-ink font-mono text-[13px] font-medium text-paper">
                    {c.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-medium text-ink">
                      {c.name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-steel">
                      {c.framework}
                    </p>
                    <dl className="mt-4 grid gap-3 md:grid-cols-3">
                      <Cell label="Umbral" value={c.threshold} />
                      <Cell label="Autoridad" value={c.authority} />
                      <Cell
                        label="Requisitos"
                        value={c.requires.join(' · ')}
                      />
                    </dl>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
            Preguntas frecuentes
          </h2>
          <dl className="mt-8 space-y-6">
            {FAQ.map(({ q, a }) => (
              <div
                key={q}
                className="border-b border-bone pb-6 last:border-b-0 last:pb-0"
              >
                <dt className="text-[16px] font-medium text-ink">{q}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-steel">
                  {a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-bone bg-ink px-4 py-12 text-paper md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] md:text-[28px]">
            ¿Caso particular?
          </h2>
          <p className="mt-2 text-[14px] text-steel">
            Hablá con compliance@orkasa.io o agendá una sesión técnica.
          </p>
          <Link
            href="/contacto"
            className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-signal px-5 py-3 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90"
          >
            Contactar al equipo →
          </Link>
        </div>
      </section>
    </>
  )
}

function Pillar({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck
  title: string
  body: string
}) {
  return (
    <div className="rounded-[4px] border border-bone bg-paper p-5">
      <Icon className="mb-3 h-5 w-5 text-ink" strokeWidth={1.5} />
      <h3 className="text-[16px] font-medium text-ink">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-steel">{body}</p>
    </div>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-steel">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] text-ink">{value}</dd>
    </div>
  )
}

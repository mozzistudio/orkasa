import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ChevronLeft,
  Mail,
  MessageSquare,
  Search,
  AlertCircle,
  Sparkles,
  CreditCard,
  Users,
  Shield,
} from 'lucide-react'
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
    path: 'recursos/ayuda',
    title: isEs ? 'Centro de ayuda — Orkasa' : 'Help center — Orkasa',
    description: isEs
      ? 'Soporte de Orkasa: respuesta en menos de 4 horas hábiles. FAQ, troubleshooting, status del sistema, contacto directo.'
      : 'Orkasa support: response in under 4 business hours. FAQ, troubleshooting, system status, direct contact.',
  })
}

const CATEGORIES = [
  {
    icon: Sparkles,
    title: 'Listing studio + IA',
    questions: [
      'La IA me devuelve un texto demasiado genérico, ¿qué hago?',
      'Mejora de fotos: ¿se cobran los créditos si no aplico el resultado?',
      '¿Por qué Gemini me devolvió un cielo demasiado saturado?',
      'Score de fotos: ¿cómo lo calcula Claude?',
    ],
  },
  {
    icon: Users,
    title: 'Leads y equipo',
    questions: [
      '¿Cómo conecto WhatsApp Business para capturar leads automáticamente?',
      'Asignación automática: ¿puedo definir reglas por barrio o tipo?',
      '¿Cómo invito un agente y limito qué propiedades ve?',
      'Lead duplicado entre canales: ¿cómo lo manejo?',
    ],
  },
  {
    icon: Shield,
    title: 'Compliance',
    questions: [
      '¿Cuándo se activa el flujo de KYC?',
      'Match positivo en lista OFAC: ¿qué pasa después?',
      '¿El borrador del ROS se envía automáticamente a la UAF?',
      '¿Cómo manejo un lead PEP?',
    ],
  },
  {
    icon: CreditCard,
    title: 'Cuenta y facturación',
    questions: [
      '¿Cómo cambio de plan?',
      '¿Aceptan tarjetas locales (Panamá, Colombia)?',
      '¿Cómo cancelo y exporto mis datos?',
      'Factura con RUC: ¿cómo la actualizo?',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Problemas comunes',
    questions: [
      'No me llega el email de confirmación al registrarme',
      'Error al subir foto: "El archivo excede 10MB"',
      'Una propiedad publicada no aparece en E24, ¿por qué?',
      'Lentitud en el dashboard al cargar muchas propiedades',
    ],
  },
  {
    icon: MessageSquare,
    title: 'Multi-publicación',
    questions: [
      'OAuth con E24: el token expira a las 24h',
      '¿Por qué Inmuebles24 me rechaza el listing por título largo?',
      'Sincronización fallida: ¿cómo retrigger sin perder los stats?',
      'Despublicar de un solo portal sin tocar los demás',
    ],
  },
] as const

export default async function HelpCenterPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Recursos', path: 'recursos' },
    { name: 'Centro de ayuda', path: 'recursos/ayuda' },
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
            Centro de ayuda
          </p>
          <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[48px]">
            ¿En qué te ayudamos?
          </h1>

          {/* Search bar (visual only — placeholder for future search) */}
          <div className="mt-8 flex items-center gap-3 rounded-[4px] border border-bone bg-paper px-4 py-3 transition-colors focus-within:border-ink">
            <Search className="h-4 w-4 text-steel" strokeWidth={1.5} />
            <input
              type="search"
              placeholder="Buscar artículos, errores, integraciones…"
              className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-steel focus:outline-none"
            />
            <kbd className="hidden rounded-[3px] border border-bone bg-bone/40 px-1.5 py-0.5 font-mono text-[10px] text-steel md:inline">
              ⌘K
            </kbd>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            {CATEGORIES.map(({ icon: Icon, title, questions }) => (
              <article
                key={title}
                className="rounded-[4px] border border-bone bg-paper p-5 md:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
                  <h2 className="text-[16px] font-medium text-ink md:text-[18px]">
                    {title}
                  </h2>
                </div>
                <ul className="space-y-2">
                  {questions.map((q) => (
                    <li key={q}>
                      <Link
                        href="#"
                        className="block text-[13px] leading-relaxed text-steel transition-colors hover:text-signal"
                      >
                        {q}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Direct contact */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
            ¿No encontrás respuesta?
          </h2>
          <p className="mt-2 text-[14px] text-steel">
            Soporte humano. Respuesta en menos de 4 horas hábiles.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <a
              href="mailto:soporte@orkasa.io"
              className="flex items-start gap-4 rounded-[4px] border border-bone bg-paper p-5 transition-colors hover:border-ink"
            >
              <Mail
                className="mt-1 h-5 w-5 shrink-0 text-ink"
                strokeWidth={1.5}
              />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Email
                </p>
                <p className="mt-1 text-[15px] font-medium text-ink">
                  soporte@orkasa.io
                </p>
                <p className="mt-1 text-[12px] text-steel">
                  Respuesta &lt;4h hábiles · ES + EN
                </p>
              </div>
            </a>
            <Link
              href="/contacto"
              className="flex items-start gap-4 rounded-[4px] border border-bone bg-paper p-5 transition-colors hover:border-ink"
            >
              <MessageSquare
                className="mt-1 h-5 w-5 shrink-0 text-ink"
                strokeWidth={1.5}
              />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Formulario
                </p>
                <p className="mt-1 text-[15px] font-medium text-ink">
                  Contacto
                </p>
                <p className="mt-1 text-[12px] text-steel">
                  Demo, ventas, partnerships
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="border-t border-bone bg-ink px-4 py-10 text-paper md:px-6 md:py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0A6B3D] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0A6B3D]" />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-paper">
              Todos los sistemas operacionales
            </p>
          </div>
          <a
            href="https://status.orkasa.io"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-paper"
          >
            Status del sistema →
          </a>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Rocket, Image as ImageIcon, Send, Users, Sparkles, Zap, Database, Settings } from 'lucide-react'
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
    path: 'recursos/docs',
    title: isEs ? 'Documentación — Orkasa' : 'Documentation — Orkasa',
    description: isEs
      ? 'Documentación completa de Orkasa: setup inicial, importar inventario, configurar portales, listing studio con IA, gestión de leads y compliance.'
      : 'Complete Orkasa documentation: initial setup, importing inventory, configuring portals, AI listing studio, lead management and compliance.',
  })
}

const SECTIONS = [
  {
    icon: Rocket,
    title: 'Primeros pasos',
    description: 'Crear tu primera cuenta, invitar al equipo, configurar la marca de la inmobiliaria.',
    articles: [
      { title: 'Configurar tu cuenta en 5 minutos', readTime: '3 min' },
      { title: 'Invitar agentes y asignar roles (owner / admin / agent)', readTime: '2 min' },
      { title: 'Personalizar nombre, RUC y datos de la inmobiliaria', readTime: '2 min' },
    ],
  },
  {
    icon: Database,
    title: 'Inventario',
    description: 'Cargar propiedades manualmente, importar en bulk desde Excel, o conectar tu CRM existente.',
    articles: [
      { title: 'Cargar tu primera propiedad', readTime: '4 min' },
      { title: 'Import bulk desde CSV / Excel', readTime: '6 min' },
      { title: 'Migrar desde otro CRM (E24 Pro, Inmovilla, RENA)', readTime: '12 min' },
      { title: 'Estructura de campos y validaciones', readTime: '5 min' },
    ],
  },
  {
    icon: ImageIcon,
    title: 'Listing studio con IA',
    description: 'Generar texto optimizado, mejorar fotos con Gemini, scoring automático de listings.',
    articles: [
      { title: 'Cómo funciona el listing studio (Claude + Gemini)', readTime: '7 min' },
      { title: 'Tres tonos: portal formal · social · móvil breve', readTime: '4 min' },
      { title: 'Mejora de fotos: cielo, iluminación, decluttering, staging', readTime: '6 min' },
      { title: 'Scoring de fotos y orden sugerido (hero recommendation)', readTime: '3 min' },
    ],
  },
  {
    icon: Send,
    title: 'Multi-publicación',
    description: 'Conectar portales, validar copy adaptado por plataforma, sincronizar status.',
    articles: [
      { title: 'Conectar tu primer portal (E24)', readTime: '8 min' },
      { title: 'Cómo se adapta el texto por portal (límites + tono)', readTime: '5 min' },
      { title: 'Wizard de publicación: 3 etapas', readTime: '6 min' },
      { title: 'Sincronización de status y eliminación cross-portal', readTime: '4 min' },
    ],
  },
  {
    icon: Users,
    title: 'Leads y pipeline',
    description: 'Captura desde portales/web/WhatsApp, scoring con IA, kanban de estados.',
    articles: [
      { title: 'Capturar leads de portales, web y WhatsApp', readTime: '5 min' },
      { title: 'Scoring automático con Claude (intent + budget signals)', readTime: '6 min' },
      { title: 'Kanban: nuevo → contactado → calificado → visita → cerrado', readTime: '4 min' },
      { title: 'Asignación automática al agente disponible', readTime: '3 min' },
    ],
  },
  {
    icon: Sparkles,
    title: 'Compliance',
    description: 'KYC, AML, sanciones, PEP — automático cuando arranca una negociación.',
    articles: [
      { title: 'Cuándo se activa el flujo de KYC', readTime: '4 min' },
      { title: 'Documentos requeridos por tipo de operación y monto', readTime: '7 min' },
      { title: 'Verificación contra listas (OFAC, UN, ONU Mujeres)', readTime: '5 min' },
      { title: 'Reportes regulatorios (UAF Panamá, UIAF Colombia)', readTime: '8 min' },
    ],
  },
  {
    icon: Zap,
    title: 'Automatizaciones',
    description: 'Reglas, webhooks, integraciones con WhatsApp, calendario, contabilidad.',
    articles: [
      { title: 'Reglas de auto-asignación y notificaciones', readTime: '4 min' },
      { title: 'Webhooks para integrar con tu stack', readTime: '6 min' },
      { title: 'Plantillas de WhatsApp Business aprobadas', readTime: '3 min' },
    ],
  },
  {
    icon: Settings,
    title: 'Cuenta y facturación',
    description: 'Plan, miembros, billing, exports, política de retención.',
    articles: [
      { title: 'Cambiar de plan, ver facturas y métodos de pago', readTime: '3 min' },
      { title: 'Exportar tus datos (GDPR / Ley 81)', readTime: '4 min' },
      { title: 'Cancelar la cuenta', readTime: '2 min' },
    ],
  },
]

export default async function DocsPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Recursos', path: 'recursos' },
    { name: 'Documentación', path: 'recursos/docs' },
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
            Documentación
          </p>
          <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[48px]">
            Aprendé a sacarle todo
            <br />
            a Orkasa.
          </h1>
          <p className="mt-6 max-w-[600px] text-[15px] leading-relaxed text-steel md:text-[17px]">
            Guías prácticas paso a paso. Más de 30 artículos cubriendo desde el
            primer login hasta integraciones avanzadas.
          </p>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-5xl space-y-12">
          {SECTIONS.map(({ icon: Icon, title, description, articles }) => (
            <article key={title}>
              <div className="mb-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
                <h2 className="text-[20px] font-medium tracking-[-0.3px] text-ink md:text-[22px]">
                  {title}
                </h2>
              </div>
              <p className="mb-5 max-w-2xl text-[14px] leading-relaxed text-steel">
                {description}
              </p>
              <ul className="divide-y divide-bone rounded-[4px] border border-bone bg-paper">
                {articles.map((a) => (
                  <li key={a.title}>
                    <Link
                      href="#"
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-bone/30"
                    >
                      <span className="text-[14px] text-ink">{a.title}</span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-steel">
                        {a.readTime}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-bone bg-ink px-4 py-12 text-paper md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] md:text-[28px]">
            ¿No encontrás lo que buscás?
          </h2>
          <p className="mt-2 text-[14px] text-steel">
            Soporte responde en menos de 4 horas hábiles.
          </p>
          <Link
            href="/recursos/ayuda"
            className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-signal px-5 py-3 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90"
          >
            Centro de ayuda →
          </Link>
        </div>
      </section>
    </>
  )
}

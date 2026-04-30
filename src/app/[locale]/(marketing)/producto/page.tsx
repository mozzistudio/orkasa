import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Sparkles,
  Share2,
  MessageSquare,
  Shield,
  BarChart3,
  ImageIcon,
  Layers,
  Workflow,
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
    path: 'producto',
    title: isEs
      ? 'Producto — funcionalidades de Orkasa'
      : 'Product — Orkasa features',
    description: isEs
      ? 'Listing studio con IA, multi-publicación adaptada por portal, mejora de fotos con Gemini, scoring de leads, kanban de pipeline, compliance KYC/AML y analytics — todo en una sola plataforma.'
      : 'AI listing studio, per-portal multi-publishing, Gemini photo enhancement, lead scoring, pipeline kanban, KYC/AML compliance and analytics — all in one platform.',
    keywords: isEs
      ? ['listing studio', 'mejora de fotos IA', 'kanban inmobiliario', 'scoring leads']
      : ['listing studio', 'AI photo enhancement', 'real estate kanban', 'lead scoring'],
  })
}

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Listing studio con IA',
    description:
      'Subí fotos, completá lo básico, y la IA escribe título y descripción optimizados. Tres variantes —portal formal, social conversacional, móvil breve— para que elijas la que más vende.',
  },
  {
    icon: Share2,
    title: 'Multi-publicación inteligente',
    description:
      'Una propiedad, múltiples portales: E24, Inmuebles24, EncuentraCasa, Compreoalquile, Facebook, Instagram, WhatsApp. Cada plataforma recibe el texto adaptado a su tono y límite de caracteres — vos validás antes de publicar.',
  },
  {
    icon: ImageIcon,
    title: 'Mejora de fotos con Gemini',
    description:
      'Cielo gris convertido en cielo despejado, iluminación corregida, decluttering automático, virtual staging. Tu inventario se ve profesional sin sesión de fotos.',
  },
  {
    icon: MessageSquare,
    title: 'Leads con scoring',
    description:
      'WhatsApp, web, portales — todos los leads en un único kanban. La IA califica intención de compra y prioriza los hot leads. Asignación automática al agente disponible.',
  },
  {
    icon: Shield,
    title: 'Compliance integrado',
    description:
      'KYC, AML, sanciones, PEP — checks asociados a cada lead, con timeline de estados y alertas. Diseñado para los marcos regulatorios de Panamá, RD, Colombia y México.',
  },
  {
    icon: Workflow,
    title: 'Pipeline kanban',
    description:
      'Drag-and-drop entre etapas: nuevo → contactado → calificado → visita → negociación → cerrado. Cada movimiento queda registrado para auditoría.',
  },
  {
    icon: BarChart3,
    title: 'Analytics que importan',
    description:
      'Tasa de conversión por origen, tiempo medio a primer contacto, performance por agente, fuentes de leads más rentables. Charts limpios sin métricas vanidosas.',
  },
  {
    icon: Layers,
    title: 'Multi-broker desde el día uno',
    description:
      'Estructura de brokerage con roles (owner, admin, agent), RLS scoped por brokerage_id en Postgres. Cada agencia ve sólo su data.',
  },
]

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const breadcrumb = breadcrumbJsonLd([{ name: 'Producto', path: 'producto' }])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />
      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Producto
          </p>
          <h1 className="mt-3 text-[40px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[56px] md:tracking-[-1.5px]">
            Todo lo que necesita un broker
            <br />
            para vender más rápido.
          </h1>
          <p className="mt-6 max-w-[600px] text-[15px] leading-relaxed text-steel md:text-[17px]">
            Orkasa unifica el flujo completo: cargar propiedad, generar copy con
            IA, publicar en todos los portales, capturar leads, calificarlos,
            cerrar la venta. Sin saltar entre 7 herramientas.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={locale === 'es' ? '/login' : '/en/login'}
              className="rounded-[4px] bg-ink px-5 py-3 text-center text-[14px] font-medium text-paper hover:bg-coal transition-colors md:text-[13px]"
            >
              Probar gratis
            </Link>
            <Link
              href={locale === 'es' ? '/precios' : '/en/precios'}
              className="rounded-[4px] border border-ink px-5 py-3 text-center text-[14px] text-ink hover:bg-bone/50 transition-colors md:text-[13px]"
            >
              Ver precios →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-14">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <Icon className="mb-4 h-6 w-6 text-ink" strokeWidth={1.5} />
                <h2 className="text-[18px] font-medium tracking-[-0.3px] text-ink">
                  {title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-steel">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-bone bg-ink px-4 py-16 text-paper md:px-6 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[28px] font-medium tracking-[-0.5px] md:text-[36px]">
            Listo para vender más?
          </h2>
          <p className="mt-3 text-[14px] text-steel md:text-[15px]">
            14 días gratis. Sin tarjeta. Importá tu inventario en minutos.
          </p>
          <Link
            href={locale === 'es' ? '/login' : '/en/login'}
            className="mt-8 inline-flex items-center gap-2 rounded-[4px] bg-signal px-5 py-3 text-[14px] font-medium text-paper hover:bg-signal/90 transition-colors md:text-[13px]"
          >
            Empezar gratis →
          </Link>
        </div>
      </section>
    </>
  )
}

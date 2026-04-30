import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen,
  Code2,
  HelpCircle,
  PlayCircle,
  ShieldCheck,
  Video,
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
    path: 'recursos',
    title: isEs ? 'Recursos — Orkasa' : 'Resources — Orkasa',
    description: isEs
      ? 'Documentación, tutoriales, guías de compliance, API reference, y centro de ayuda de Orkasa.'
      : 'Documentation, tutorials, compliance guides, API reference, and Orkasa help center.',
  })
}

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Documentación',
    description:
      'Guías paso a paso para configurar Orkasa, importar inventario, conectar portales, y explotar la IA.',
    href: '#',
    cta: 'Ver docs',
  },
  {
    icon: PlayCircle,
    title: 'Onboarding en 15 minutos',
    description:
      'Video tutorial: de cero a primer listing publicado en menos de 15 minutos.',
    href: '#',
    cta: 'Ver video',
  },
  {
    icon: Video,
    title: 'Webinars',
    description:
      'Sesiones en vivo cada mes: nuevas features, mejores prácticas, sesiones de Q&A con el equipo.',
    href: '#',
    cta: 'Próximo webinar',
  },
  {
    icon: ShieldCheck,
    title: 'Guía de compliance',
    description:
      'KYC, AML, datos personales — qué te exige cada país LATAM y cómo Orkasa te ayuda a cumplir.',
    href: '#',
    cta: 'Leer guía',
  },
  {
    icon: Code2,
    title: 'API reference',
    description:
      'Endpoints REST, webhooks, OAuth para portales, eventos en tiempo real. Para integrar Orkasa con tu stack.',
    href: '#',
    cta: 'Ver API',
  },
  {
    icon: HelpCircle,
    title: 'Centro de ayuda',
    description:
      'Preguntas frecuentes, troubleshooting, contacto con soporte. Respuesta en menos de 4 hs hábiles.',
    href: '#',
    cta: 'Buscar ayuda',
  },
] as const

export default async function RecursosPage() {
  const breadcrumb = breadcrumbJsonLd([{ name: 'Recursos', path: 'recursos' }])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Recursos
          </p>
          <h1 className="mt-3 text-[40px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[56px] md:tracking-[-1.5px]">
            Todo lo que necesitás
            <br />
            para arrancar.
          </h1>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {RESOURCES.map(({ icon: Icon, title, description, href, cta }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col rounded-[4px] border border-bone bg-paper p-5 transition-colors hover:border-ink"
            >
              <Icon
                className="mb-4 h-5 w-5 text-ink"
                strokeWidth={1.5}
              />
              <h2 className="text-[16px] font-medium tracking-[-0.3px] text-ink">
                {title}
              </h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-steel">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center text-[13px] font-medium text-signal group-hover:text-signal/80">
                {cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Globe, Share2, MessageSquare, Webhook } from 'lucide-react'
import { INTEGRATION_PROVIDERS } from '@/lib/integrations'
import { pageMetadata, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo'

/**
 * Extract a clean domain from a website URL for favicon lookup.
 * "https://www.encuentra24.com/path" → "encuentra24.com"
 */
function domainOf(website: string | undefined): string | null {
  if (!website) return null
  try {
    const url = new URL(website)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Google's free public favicon service — 64×64 PNG, supports any domain. */
function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEs = locale === 'es'
  return pageMetadata({
    locale: isEs ? 'es' : 'en',
    path: 'integraciones',
    title: isEs ? 'Integraciones — Orkasa' : 'Integrations — Orkasa',
    description: isEs
      ? 'Publicá una vez y aparece en E24, Inmuebles24, EncuentraCasa, Compreoalquile, MercadoLibre, Properati, Idealista, ZonaProp, Casas.com, Facebook, Instagram, WhatsApp.'
      : 'Post once, appear in E24, Inmuebles24, EncuentraCasa, Compreoalquile, MercadoLibre, Properati, Idealista, ZonaProp, Casas.com, Facebook, Instagram, WhatsApp.',
    keywords: isEs
      ? ['portales inmobiliarios LATAM', 'E24 multipublicación', 'Inmuebles24', 'idealista']
      : ['LATAM real estate portals', 'E24 multi-posting'],
  })
}

const CATEGORY_LABEL: Record<string, string> = {
  portal: 'Portales inmobiliarios',
  social: 'Redes sociales',
  messaging: 'Mensajería',
  custom: 'Custom',
}

const CATEGORY_ICON: Record<string, typeof Globe> = {
  portal: Globe,
  social: Share2,
  messaging: MessageSquare,
  custom: Webhook,
}

export default async function IntegracionesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Integraciones', path: 'integraciones' },
  ])

  // Group by category
  const byCategory = new Map<string, typeof INTEGRATION_PROVIDERS>()
  for (const p of INTEGRATION_PROVIDERS) {
    const list = byCategory.get(p.category) ?? []
    list.push(p)
    byCategory.set(p.category, list)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Integraciones
          </p>
          <h1 className="mt-3 text-[40px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[56px] md:tracking-[-1.5px]">
            Publicá una vez.
            <br />
            Aparecé en todos lados.
          </h1>
          <p className="mt-6 max-w-[600px] text-[15px] leading-relaxed text-steel md:text-[17px]">
            Orkasa adapta automáticamente título, descripción y formato a cada
            plataforma — respetando los límites de caracteres, el tono editorial
            y las particularidades de cada portal.
          </p>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-6xl space-y-12 md:space-y-16">
          {Array.from(byCategory.entries()).map(([category, providers]) => {
            const Icon = CATEGORY_ICON[category] ?? Globe
            return (
              <div key={category}>
                <div className="mb-6 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
                  <h2 className="text-[20px] font-medium tracking-[-0.3px] text-ink md:text-[24px]">
                    {CATEGORY_LABEL[category]}
                  </h2>
                  <span className="font-mono text-[11px] tabular-nums text-steel">
                    {providers.length}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                  {providers.map((p) => {
                    const domain = domainOf(p.website)
                    return (
                    <article
                      key={p.id}
                      className="flex items-start gap-3 rounded-[4px] border border-bone bg-paper p-4"
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-bone">
                        {domain ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={faviconUrl(domain)}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="font-mono text-[13px] font-medium text-ink">
                            {p.shortLabel}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-medium text-ink">
                            {p.label}
                          </h3>
                          {p.available ? (
                            <span className="rounded-[4px] bg-[#0A6B3D]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#0A6B3D]">
                              Activo
                            </span>
                          ) : (
                            <span className="rounded-[4px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel">
                              Pronto
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-steel">
                          {p.description}
                        </p>
                        {p.regions.length > 0 && (
                          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-steel">
                            {p.regions.join(' · ')}
                          </p>
                        )}
                      </div>
                    </article>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="border-t border-bone bg-ink px-4 py-12 text-paper md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] md:text-[32px]">
            ¿Falta tu portal?
          </h2>
          <p className="mt-2 text-[14px] text-steel">
            Sumamos integraciones cada mes. Decinos cuál necesitás.
          </p>
          <Link
            href={locale === 'es' ? '/contacto' : '/en/contacto'}
            className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-signal px-5 py-3 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90"
          >
            Pedir integración →
          </Link>
        </div>
      </section>
    </>
  )
}

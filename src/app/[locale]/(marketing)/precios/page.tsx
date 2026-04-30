import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, Sparkles } from 'lucide-react'
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
    path: 'precios',
    title: isEs ? 'Precios — Orkasa' : 'Pricing — Orkasa',
    description: isEs
      ? 'Solo $39/mes, Team $89/mes, Brokerage $149/mes. 14 días gratis. Sin tarjeta. Listings ilimitados, IA incluida, multi-publicación a todos los portales LATAM.'
      : 'Solo $39/mo, Team $89/mo, Brokerage $149/mo. 14-day free trial, no card required. Unlimited listings, AI included, multi-posting to LATAM portals.',
    keywords: isEs
      ? ['precio CRM inmobiliario', 'plan inmobiliario', 'planes brokerage']
      : ['real estate CRM pricing', 'real estate plans'],
  })
}

const PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: 39,
    description: 'Para agentes independientes. Empezá a publicar más rápido.',
    cta: 'Probar gratis',
    features: [
      'Listings ilimitados',
      'IA listing studio (claude-opus-4-7)',
      'Mejora de fotos con IA (50/mes)',
      'Multi-publicación a 6 portales',
      'Pipeline kanban + scoring leads',
      'Soporte por email',
    ],
    notIncluded: ['Equipo (1 usuario)', 'API + integraciones custom'],
    popular: false,
  },
  {
    id: 'team',
    name: 'Team',
    price: 89,
    description:
      'Para inmobiliarias chicas. Hasta 5 agentes con asignación automática.',
    cta: 'Probar gratis',
    features: [
      'Todo lo de Solo, más:',
      'Hasta 5 agentes',
      'Mejora de fotos IA (200/mes)',
      'Multi-publicación a 12 portales',
      'Compliance KYC/AML',
      'Analytics por agente',
      'Asignación automática',
      'Soporte prioritario',
    ],
    notIncluded: ['Brokerage multi-equipo', 'API + webhooks'],
    popular: true,
  },
  {
    id: 'brokerage',
    name: 'Brokerage',
    price: 149,
    description:
      'Para brokerages establecidos. Multi-equipo, API, SLA, white-label.',
    cta: 'Hablar con ventas',
    features: [
      'Todo lo de Team, más:',
      'Agentes ilimitados',
      'Mejora de fotos IA ilimitada',
      'Todos los portales (12+)',
      'API + webhooks',
      'White-label opcional',
      'SSO + auditoría',
      'SLA 99.9% + soporte 24/7',
    ],
    notIncluded: [],
    popular: false,
  },
]

const FAQ = [
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. La suscripción es mensual y la cancelás desde el panel. No hay contrato de permanencia ni cargos por baja.',
  },
  {
    q: '¿Qué incluye la prueba de 14 días?',
    a: 'Acceso completo a todas las funcionalidades del plan que elijas, sin tarjeta de crédito. Si al final del trial no querés seguir, no te cobramos.',
  },
  {
    q: '¿La IA tiene un costo extra?',
    a: 'No. El costo del Listing Studio (Claude) y la mejora de fotos (Gemini) está incluido en el plan, con cuotas mensuales por plan. Si necesitás más, podés comprar packs adicionales.',
  },
  {
    q: '¿Qué portales soportan?',
    a: 'E24, Inmuebles24, EncuentraCasa, Compreoalquile, Facebook Marketplace, Instagram, WhatsApp Business. Estamos sumando portales nuevos cada mes — pedí el tuyo si no está.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. RLS en Postgres scoped por brokerage_id, encriptación at-rest y in-transit, backups diarios. Cumplimos con la Ley 81 de Panamá y GDPR para clientes europeos.',
  },
  {
    q: '¿Tienen versión enterprise?',
    a: 'Sí. Contactanos para volúmenes >50 agentes, integraciones custom, on-premise, o SLA específicos.',
  },
]

export default async function PreciosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const breadcrumb = breadcrumbJsonLd([{ name: 'Precios', path: 'precios' }])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />
      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Precios
          </p>
          <h1 className="mt-3 text-[40px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[56px] md:tracking-[-1.5px]">
            Sin trucos. Sin sorpresas.
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-steel md:text-[17px]">
            Tres planes simples. 14 días gratis. Sin tarjeta. IA incluida.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:mt-16 md:grid-cols-3 md:gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-[4px] border bg-paper p-6 ${
                plan.popular ? 'border-2 border-ink' : 'border-bone'
              }`}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-medium text-ink">{plan.name}</h2>
                {plan.popular && (
                  <span className="rounded-[4px] bg-bone px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink">
                    Recomendado
                  </span>
                )}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-steel">
                {plan.description}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-mono text-[40px] font-medium tabular-nums text-ink">
                  ${plan.price}
                </span>
                <span className="font-mono text-[12px] text-steel">/mes</span>
              </div>
              <Link
                href={locale === 'es' ? '/login' : '/en/login'}
                className={`mt-6 block rounded-[4px] px-4 py-3 text-center text-[13px] font-medium transition-colors ${
                  plan.popular
                    ? 'bg-ink text-paper hover:bg-coal'
                    : 'border border-ink text-ink hover:bg-bone/50'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-[13px] text-ink"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#0A6B3D]"
                      strokeWidth={1.5}
                    />
                    {feature}
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-[13px] text-steel"
                  >
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-steel"
                      strokeWidth={1.5}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-[4px] border border-bone bg-bone/30 p-5 text-center">
          <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[1.5px] text-ink">
            <Sparkles className="h-3 w-3 text-signal" strokeWidth={1.5} />
            Anual: 2 meses gratis (paga 10, usa 12)
          </p>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[28px] font-medium tracking-[-0.5px] text-ink md:text-[32px]">
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
    </>
  )
}

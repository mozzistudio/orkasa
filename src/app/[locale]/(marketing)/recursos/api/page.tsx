import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Code2, Webhook, Key, Activity } from 'lucide-react'
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
    path: 'recursos/api',
    title: isEs ? 'API reference — Orkasa' : 'API reference — Orkasa',
    description: isEs
      ? 'Endpoints REST, webhooks, OAuth para portales, eventos en tiempo real. Autenticación con API keys o OAuth 2.0.'
      : 'REST endpoints, webhooks, OAuth for portals, real-time events. Authentication via API keys or OAuth 2.0.',
    keywords: isEs
      ? ['API inmobiliaria', 'webhook real estate', 'REST CRM inmobiliario']
      : ['real estate API', 'real estate webhooks'],
  })
}

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/v1/properties',
    description: 'Listar propiedades del brokerage. Soporta filtros por status, type, precio.',
  },
  {
    method: 'POST',
    path: '/v1/properties',
    description: 'Crear una nueva propiedad. Devuelve la URL pública para carga de imágenes.',
  },
  {
    method: 'GET',
    path: '/v1/properties/{id}',
    description: 'Obtener una propiedad por ID con todos sus campos e imágenes.',
  },
  {
    method: 'PATCH',
    path: '/v1/properties/{id}',
    description: 'Actualizar una propiedad parcialmente.',
  },
  {
    method: 'POST',
    path: '/v1/properties/{id}/publish',
    description: 'Disparar publicación a portales seleccionados con adapter spec.',
  },
  {
    method: 'GET',
    path: '/v1/leads',
    description: 'Listar leads con scoring, status y agente asignado.',
  },
  {
    method: 'POST',
    path: '/v1/leads',
    description: 'Crear lead (uso típico: integración con tu sitio web).',
  },
  {
    method: 'PATCH',
    path: '/v1/leads/{id}',
    description: 'Mover entre estados del kanban, cambiar asignación.',
  },
  {
    method: 'POST',
    path: '/v1/ai/listing-review',
    description: 'Disparar review de listing con Claude Opus 4.7. Devuelve 3 variantes + análisis de fotos.',
  },
  {
    method: 'POST',
    path: '/v1/ai/photo-enhance',
    description: 'Mejorar foto con Gemini 2.5 Flash Image. Devuelve URL del resultado.',
  },
  {
    method: 'GET',
    path: '/v1/integrations',
    description: 'Estado de cada integración (portal/social) del brokerage.',
  },
] as const

const EVENTS = [
  { name: 'property.created', description: 'Nueva propiedad creada.' },
  { name: 'property.updated', description: 'Propiedad modificada (incluye campo cambiado).' },
  { name: 'property.published', description: 'Propiedad publicada en un portal específico.' },
  { name: 'property.unpublished', description: 'Propiedad despublicada o eliminada de un portal.' },
  { name: 'lead.created', description: 'Nuevo lead capturado (incluye source).' },
  { name: 'lead.qualified', description: 'Lead pasó a calificado.' },
  { name: 'lead.assigned', description: 'Lead reasignado a otro agente.' },
  { name: 'compliance.kyc_required', description: 'Lead requiere KYC para avanzar.' },
  { name: 'compliance.match_alert', description: 'Match positivo en lista de sanciones.' },
] as const

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-bone text-ink',
  POST: 'bg-[#0A6B3D]/10 text-[#0A6B3D]',
  PATCH: 'bg-signal/10 text-signal',
  DELETE: 'bg-signal/20 text-signal',
}

export default async function ApiPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Recursos', path: 'recursos' },
    { name: 'API', path: 'recursos/api' },
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
            API reference
          </p>
          <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[48px]">
            Integrá Orkasa
            <br />
            con tu stack.
          </h1>
          <p className="mt-6 max-w-[600px] text-[15px] leading-relaxed text-steel md:text-[17px]">
            REST API completa, webhooks en tiempo real, OAuth 2.0 para portales.
            Versionado semántico, rate limit generoso, contratos estables.
          </p>
        </div>
      </section>

      {/* Auth */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <Key className="h-5 w-5 text-ink" strokeWidth={1.5} />
            <h2 className="text-[22px] font-medium tracking-[-0.3px] text-ink md:text-[26px]">
              Autenticación
            </h2>
          </div>
          <p className="text-[14px] leading-relaxed text-steel">
            Generá API keys desde <span className="font-mono text-ink">Configuración → API</span>.
            Cada key tiene scopes (read, write, admin) y un brokerage_id asociado.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-[4px] border border-bone bg-coal p-5 font-mono text-[12px] leading-relaxed text-paper">
            <code>{`curl https://api.orkasa.io/v1/properties \\
  -H "Authorization: Bearer ork_live_xxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`}</code>
          </pre>
        </div>
      </section>

      {/* Endpoints */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <Code2 className="h-5 w-5 text-ink" strokeWidth={1.5} />
            <h2 className="text-[22px] font-medium tracking-[-0.3px] text-ink md:text-[26px]">
              Endpoints
            </h2>
          </div>
          <ul className="divide-y divide-bone overflow-hidden rounded-[4px] border border-bone bg-paper">
            {ENDPOINTS.map((e) => (
              <li
                key={`${e.method}-${e.path}`}
                className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex w-16 justify-center rounded-[4px] px-2 py-0.5 font-mono text-[10px] font-medium ${
                      METHOD_COLOR[e.method] ?? 'bg-bone text-ink'
                    }`}
                  >
                    {e.method}
                  </span>
                  <code className="font-mono text-[12px] text-ink">
                    {e.path}
                  </code>
                </div>
                <span className="text-[12px] text-steel md:flex-1 md:text-right">
                  {e.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Webhooks */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <Webhook className="h-5 w-5 text-ink" strokeWidth={1.5} />
            <h2 className="text-[22px] font-medium tracking-[-0.3px] text-ink md:text-[26px]">
              Webhooks
            </h2>
          </div>
          <p className="text-[14px] leading-relaxed text-steel">
            Eventos firmados con HMAC-SHA256 vía header{' '}
            <code className="rounded-[4px] bg-bone/50 px-1.5 py-0.5 font-mono text-[11px] text-ink">
              X-Orkasa-Signature
            </code>
            . Reintentos exponenciales con cap a 24h. Idempotencia vía{' '}
            <code className="rounded-[4px] bg-bone/50 px-1.5 py-0.5 font-mono text-[11px] text-ink">
              event_id
            </code>
            .
          </p>
          <ul className="mt-5 grid gap-2 md:grid-cols-2">
            {EVENTS.map((evt) => (
              <li
                key={evt.name}
                className="rounded-[4px] border border-bone bg-paper p-3"
              >
                <code className="font-mono text-[12px] text-ink">
                  {evt.name}
                </code>
                <p className="mt-1 text-[12px] leading-relaxed text-steel">
                  {evt.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Rate limits + status */}
      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <Activity className="h-5 w-5 text-ink" strokeWidth={1.5} />
            <h2 className="text-[22px] font-medium tracking-[-0.3px] text-ink md:text-[26px]">
              Rate limits y SLA
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[4px] border border-bone bg-paper p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                Solo / Team
              </p>
              <p className="mt-1 text-[14px] text-ink">
                <span className="font-mono text-[20px] font-medium tabular-nums">
                  300
                </span>{' '}
                req/min
              </p>
            </div>
            <div className="rounded-[4px] border border-bone bg-paper p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                Brokerage
              </p>
              <p className="mt-1 text-[14px] text-ink">
                <span className="font-mono text-[20px] font-medium tabular-nums">
                  3,000
                </span>{' '}
                req/min
              </p>
            </div>
            <div className="rounded-[4px] border border-bone bg-paper p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                Uptime
              </p>
              <p className="mt-1 text-[14px] text-ink">
                <span className="font-mono text-[20px] font-medium tabular-nums">
                  99.9
                </span>
                % (Brokerage SLA)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-bone bg-ink px-4 py-12 text-paper md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] md:text-[28px]">
            ¿Vas a integrar?
          </h2>
          <p className="mt-2 text-[14px] text-steel">
            Pedí acceso anticipado a la beta. SDKs en TypeScript y Python.
          </p>
          <Link
            href="/contacto"
            className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-signal px-5 py-3 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90"
          >
            Solicitar acceso →
          </Link>
        </div>
      </section>
    </>
  )
}

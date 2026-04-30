'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Link } from '@/i18n/navigation'

const FAQ = [
  {
    q: '¿Cuánto tarda en arrancar?',
    a: 'Menos de 15 minutos desde el registro hasta tu primera propiedad publicada. Si querés migrar inventario existente, el import bulk desde CSV/Excel toma una sesión de 30-60 min con el equipo.',
  },
  {
    q: '¿Necesito cambiar mi forma de trabajar?',
    a: 'No. Orkasa reemplaza Excel + WhatsApp + portales abiertos en simultáneo, no tu proceso comercial. El kanban de leads, la asignación, la firma de mandatos — todo sigue siendo tuyo.',
  },
  {
    q: '¿La IA reemplaza al agente?',
    a: 'No. Es un copiloto: escribe el copy, califica leads, mejora fotos, arma el ROS. Vos decidís todo: validás cada texto antes de publicar, asignás manualmente cuando querés, y revisás cada match de compliance. La IA acelera lo mecánico.',
  },
  {
    q: '¿Cómo funciona la prueba de 14 días?',
    a: 'Acceso completo a todas las funcionalidades del plan que elijas, sin tarjeta de crédito. Si al final no querés seguir, no se cobra nada. Si seguís, te avisamos 3 días antes del primer cargo.',
  },
  {
    q: '¿Qué portales soportan?',
    a: 'EncuentraCasa, Inmuebles24, Compreoalquile, MercadoLibre Inmuebles, Properati, Idealista, ZonaProp, Casas.com, Facebook Marketplace, Instagram Business, WhatsApp Business, Webhook custom. Sumamos uno nuevo cada mes — pedí el tuyo en el formulario de contacto.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'RLS scoped por brokerage_id en Postgres (cada inmobiliaria solo ve su data). Encriptación AES-256 at-rest, TLS 1.3 in-transit. Backups diarios con retención 30d. MFA disponible. Cumplimos con Ley 81 PA, Ley 1581 CO, y GDPR para clientes EU.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. La cancelación es desde el panel y tiene efecto al fin del período facturado. No hay cargo por baja. Te damos 30 días para exportar todo (propiedades, leads, fotos, historial).',
  },
  {
    q: '¿Tienen versión enterprise / on-premise?',
    a: 'Sí. Contactanos para volúmenes &gt;50 agentes, integraciones custom, SSO, on-premise, o SLA específicos. El plan Brokerage cubre la mayoría de los casos; enterprise es para necesidades particulares.',
  },
] as const

export function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="border-t border-bone px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            FAQ
          </p>
          <h2 className="mt-3 text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]">
            Preguntas frecuentes
          </h2>
        </div>

        <ul className="divide-y divide-bone border-y border-bone">
          {FAQ.map(({ q, a }, idx) => {
            const isOpen = openIdx === idx
            return (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:bg-bone/30"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-medium text-ink md:text-[16px]">
                    {q}
                  </span>
                  {isOpen ? (
                    <Minus
                      className="h-4 w-4 shrink-0 text-steel"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Plus
                      className="h-4 w-4 shrink-0 text-steel"
                      strokeWidth={1.5}
                    />
                  )}
                </button>
                {isOpen && (
                  <div className="pb-5 pr-8 text-[14px] leading-relaxed text-steel md:text-[15px]">
                    {a}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <p className="mt-8 text-center font-mono text-[11px] text-steel">
          ¿Más preguntas?{' '}
          <Link
            href="/contacto"
            className="font-medium text-signal hover:text-signal/80 transition-colors"
          >
            Hablá con el equipo →
          </Link>
        </p>
      </div>
    </section>
  )
}

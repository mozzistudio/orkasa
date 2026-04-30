import type { Metadata } from 'next'
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
    path: 'terminos',
    title: isEs ? 'Términos de servicio — Orkasa' : 'Terms of service — Orkasa',
    description: isEs
      ? 'Condiciones de uso de Orkasa: licencia, uso aceptable, suscripción, propiedad intelectual, limitación de responsabilidad.'
      : 'Orkasa terms of use: license, acceptable use, subscription, IP, liability.',
  })
}

const LAST_UPDATED = '15 de abril de 2026'

export default async function TerminosPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Términos', path: 'terminos' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />
      <article className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Legal
          </p>
          <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[48px]">
            Términos de servicio
          </h1>
          <p className="mt-4 font-mono text-[11px] text-steel">
            Última actualización: {LAST_UPDATED}
          </p>

          <div className="mt-12 space-y-8 text-[14px] leading-relaxed text-ink md:text-[15px]">
            <Section title="1. Aceptación">
              <p>
                Al crear una cuenta o usar Orkasa, aceptás estos términos. Si no
                estás de acuerdo, no uses el servicio. Si actuás en nombre de
                una empresa, declarás que tenés la autoridad para vincularla.
              </p>
            </Section>

            <Section title="2. Descripción del servicio">
              <p>
                Orkasa es una plataforma SaaS B2B que provee un CRM
                inmobiliario, listing studio con IA, multi-publicación a
                portales, gestión de leads y compliance. El servicio se ofrece
                &ldquo;tal cual&rdquo;, con mejoras continuas a discreción de
                Orkasa.
              </p>
            </Section>

            <Section title="3. Cuenta y registro">
              <p>
                Sos responsable de mantener tu password seguro y de toda la
                actividad bajo tu cuenta. Notificanos inmediatamente de
                cualquier acceso no autorizado.
              </p>
            </Section>

            <Section title="4. Suscripción y pagos">
              <ul className="list-disc space-y-2 pl-6 marker:text-steel">
                <li>
                  Los planes se facturan mensualmente o anualmente, en USD, por
                  adelantado.
                </li>
                <li>
                  Período de prueba gratuita de 14 días. Si no cancelás antes
                  del fin del trial, se inicia el cobro automático.
                </li>
                <li>
                  Podés cancelar cuando quieras. La cancelación tiene efecto al
                  fin del período facturado en curso. No reembolsamos meses
                  parciales.
                </li>
                <li>
                  Si fallamos un cobro, te damos 7 días para regularizar antes
                  de suspender la cuenta.
                </li>
              </ul>
            </Section>

            <Section title="5. Uso aceptable">
              <p>No podés usar Orkasa para:</p>
              <ul className="list-disc space-y-2 pl-6 marker:text-steel">
                <li>Publicar contenido ilegal, fraudulento o engañoso.</li>
                <li>
                  Enviar spam o mensajes no solicitados a leads que no dieron su
                  consentimiento.
                </li>
                <li>
                  Hacer scraping, ingeniería inversa o acceder a la
                  infraestructura sin autorización.
                </li>
                <li>
                  Cargar datos personales sin la base legal correspondiente
                  (consentimiento, contrato, etc.).
                </li>
                <li>
                  Cargar contenido que infrinja propiedad intelectual de
                  terceros (fotos sin licencia, logos sin permiso).
                </li>
              </ul>
              <p>
                Una violación material da lugar a la suspensión inmediata, sin
                reembolso.
              </p>
            </Section>

            <Section title="6. Propiedad intelectual">
              <p>
                Orkasa retiene todos los derechos sobre el software, la marca, y
                los modelos de IA derivados. Vos retenés los derechos sobre tus
                listings, fotos, leads y data, y nos otorgás una licencia
                limitada y revocable para procesarlos en el contexto del
                servicio.
              </p>
            </Section>

            <Section title="7. Servicios de IA (Listing studio, mejora de fotos)">
              <p>
                El contenido generado por IA (texto, imágenes editadas) se
                ofrece como sugerencia. Vos sos responsable de revisarlo y
                validarlo antes de publicarlo. Orkasa no garantiza precisión
                factual ni se responsabiliza por contenido generado que no
                hayas validado.
              </p>
              <p>
                Los inputs (prompts, fotos) y outputs no se usan para entrenar
                modelos de Anthropic ni de Google.
              </p>
            </Section>

            <Section title="8. Disponibilidad y SLA">
              <p>
                Hacemos best effort para una disponibilidad del 99.9% en planes
                Solo y Team. Plan Brokerage tiene SLA contractual con créditos
                por incumplimiento. Mantenimientos programados se anuncian con
                72h de anticipación.
              </p>
            </Section>

            <Section title="9. Limitación de responsabilidad">
              <p>
                En la máxima medida permitida por ley, la responsabilidad
                agregada de Orkasa por daños no excederá el monto pagado por
                vos en los 12 meses anteriores al evento que dio origen al
                reclamo.
              </p>
              <p>
                Orkasa no es responsable por: pérdida de oportunidades de
                negocio, decisiones tomadas en base al contenido generado por
                IA, fallas de portales o redes sociales de terceros, o daños
                indirectos / consecuenciales.
              </p>
            </Section>

            <Section title="10. Terminación">
              <p>
                Podés terminar la cuenta en cualquier momento desde el panel.
                Orkasa puede terminar la cuenta por: violación material de
                estos términos, falta de pago de más de 30 días, o requerimiento
                legal. Te damos 30 días para exportar tu data.
              </p>
            </Section>

            <Section title="11. Cambios a estos términos">
              <p>
                Avisamos por email con al menos 30 días de anticipación cambios
                materiales. El uso continuado del servicio después de la fecha
                de vigencia implica aceptación.
              </p>
            </Section>

            <Section title="12. Ley aplicable">
              <p>
                Estos términos se rigen por las leyes de la República de
                Panamá. Cualquier disputa se resuelve en los tribunales de la
                Ciudad de Panamá.
              </p>
            </Section>

            <Section title="13. Contacto">
              <p>
                Dudas:{' '}
                <a
                  href="mailto:legal@orkasa.io"
                  className="font-medium text-signal hover:text-signal/80"
                >
                  legal@orkasa.io
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </article>
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-[18px] font-medium tracking-[-0.3px] text-ink md:text-[20px]">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

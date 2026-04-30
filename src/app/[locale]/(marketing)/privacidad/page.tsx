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
    path: 'privacidad',
    title: isEs ? 'Política de privacidad — Orkasa' : 'Privacy policy — Orkasa',
    description: isEs
      ? 'Cómo recolectamos, usamos y protegemos los datos personales y los de tus clientes en Orkasa.'
      : 'How we collect, use, and protect personal data and your customers data in Orkasa.',
  })
}

const LAST_UPDATED = '15 de abril de 2026'

export default async function PrivacidadPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Privacidad', path: 'privacidad' },
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
            Política de privacidad
          </h1>
          <p className="mt-4 font-mono text-[11px] text-steel">
            Última actualización: {LAST_UPDATED}
          </p>

          <div className="prose prose-sm mt-12 max-w-none space-y-8 text-[14px] leading-relaxed text-ink md:text-[15px]">
            <Section title="1. Quiénes somos">
              <p>
                Orkasa Technologies (&ldquo;Orkasa&rdquo;, &ldquo;nosotros&rdquo;)
                es una plataforma SaaS B2B que ofrece un CRM inmobiliario a
                brokers y agentes en Latinoamérica. Operamos desde Panamá y
                cumplimos con la Ley 81 de Protección de Datos Personales de
                Panamá, así como con los marcos regulatorios aplicables en los
                países donde operan nuestros clientes.
              </p>
            </Section>

            <Section title="2. Qué datos recolectamos">
              <ul className="list-disc space-y-2 pl-6 marker:text-steel">
                <li>
                  <strong>Datos de cuenta:</strong> nombre, email, contraseña
                  (hasheada), nombre de la inmobiliaria, rol, número de teléfono.
                </li>
                <li>
                  <strong>Datos de uso:</strong> propiedades cargadas, leads
                  capturados, publicaciones, fotos subidas, interacciones con la
                  IA.
                </li>
                <li>
                  <strong>Datos técnicos:</strong> dirección IP, user agent,
                  cookies de sesión, logs de errores.
                </li>
                <li>
                  <strong>Datos de tus clientes (leads):</strong> nombre, email,
                  teléfono, intereses inmobiliarios, documentos de KYC cuando
                  aplique. Estos datos son <em>tuyos</em>, vos sos el responsable
                  del tratamiento ante el titular.
                </li>
              </ul>
            </Section>

            <Section title="3. Para qué usamos los datos">
              <ul className="list-disc space-y-2 pl-6 marker:text-steel">
                <li>Proveerte el servicio de CRM y mantener tu cuenta operativa.</li>
                <li>
                  Procesar publicaciones a portales y comunicaciones con leads en
                  tu nombre.
                </li>
                <li>
                  Enviar emails transaccionales (alertas, confirmaciones, recibos)
                  y, con tu consentimiento, comunicaciones de producto.
                </li>
                <li>
                  Mejorar Orkasa: telemetría agregada y anónima, A/B testing.
                </li>
                <li>
                  Cumplir con obligaciones legales (KYC/AML, requerimientos de
                  autoridades).
                </li>
              </ul>
            </Section>

            <Section title="4. Con quién compartimos los datos">
              <p>
                Trabajamos con sub-procesadores que cumplen con SOC 2 / ISO 27001:
              </p>
              <ul className="list-disc space-y-2 pl-6 marker:text-steel">
                <li><strong>Supabase</strong> — base de datos, autenticación, storage.</li>
                <li><strong>Vercel</strong> — hosting de la aplicación.</li>
                <li><strong>Anthropic</strong> — Claude, para el listing studio (datos no se usan para entrenamiento).</li>
                <li><strong>Google</strong> — Gemini Flash Image, para mejora de fotos.</li>
                <li><strong>Stripe</strong> — procesamiento de pagos.</li>
                <li><strong>Resend</strong> — emails transaccionales.</li>
              </ul>
              <p>
                Nunca vendemos tus datos ni los de tus clientes. Solo compartimos
                con autoridades cuando hay un requerimiento legal válido.
              </p>
            </Section>

            <Section title="5. Cuánto tiempo guardamos los datos">
              <p>
                Mientras tu cuenta esté activa, los guardamos. Si cancelás, te
                damos 30 días para exportar todo. Pasados los 30 días borramos la
                data, salvo lo que estemos obligados a retener por ley
                (facturación, KYC) por hasta 5 años.
              </p>
            </Section>

            <Section title="6. Tus derechos">
              <p>
                Bajo la Ley 81 de Panamá y normas equivalentes en otros países
                LATAM, podés ejercer tus derechos ARCO:
              </p>
              <ul className="list-disc space-y-2 pl-6 marker:text-steel">
                <li>Acceso: pedir copia de tus datos.</li>
                <li>Rectificación: corregir datos inexactos.</li>
                <li>Cancelación: borrar tus datos cuando ya no sean necesarios.</li>
                <li>Oposición: retirar consentimiento para usos no esenciales.</li>
              </ul>
              <p>
                Para ejercerlos, escribinos a{' '}
                <a
                  href="mailto:privacidad@orkasa.io"
                  className="font-medium text-signal hover:text-signal/80"
                >
                  privacidad@orkasa.io
                </a>
                .
              </p>
            </Section>

            <Section title="7. Seguridad">
              <p>
                Encriptación at-rest (AES-256) e in-transit (TLS 1.3). RLS en
                Postgres scoped por brokerage_id — los datos de cada inmobiliaria
                están aislados. Backups diarios con retención de 30 días. MFA
                disponible para owners. Pen-tests anuales.
              </p>
            </Section>

            <Section title="8. Cookies">
              <p>
                Usamos sólo las cookies estrictamente necesarias (sesión,
                preferencias de idioma) y, opcionalmente, analítica agregada y
                anónima. No usamos cookies de tracking publicitario de terceros.
              </p>
            </Section>

            <Section title="9. Cambios a esta política">
              <p>
                Si hacemos cambios materiales, te avisamos por email con al menos
                30 días de anticipación. Cambios menores se reflejan en la fecha
                de &ldquo;Última actualización&rdquo;.
              </p>
            </Section>

            <Section title="10. Contacto">
              <p>
                Dudas, reclamos, ejercicio de derechos:{' '}
                <a
                  href="mailto:privacidad@orkasa.io"
                  className="font-medium text-signal hover:text-signal/80"
                >
                  privacidad@orkasa.io
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

import type { Metadata } from 'next'
import Link from 'next/link'
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
    path: 'sobre-nosotros',
    title: isEs ? 'Sobre nosotros — Orkasa' : 'About — Orkasa',
    description: isEs
      ? 'Orkasa nace en Panamá para resolver el problema real de los brokers en LATAM: demasiadas herramientas, poco tiempo. Construimos el CRM que nos hubiera gustado tener.'
      : 'Orkasa was born in Panama to solve a real problem for LATAM brokers: too many tools, not enough time. We built the CRM we wished existed.',
  })
}

export default async function SobreNosotrosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Sobre nosotros', path: 'sobre-nosotros' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Sobre nosotros
          </p>
          <h1 className="mt-3 text-[40px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[56px] md:tracking-[-1.5px]">
            Construimos el CRM
            <br />
            que nos faltaba.
          </h1>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-[15px] leading-relaxed text-ink md:text-[16px]">
          <p>
            Orkasa nace en Ciudad de Panamá en 2026, después de hablar con
            decenas de agentes inmobiliarios que repetían el mismo diagnóstico:
            <em>
              {' '}
              &ldquo;tengo Excel, WhatsApp, dos portales abiertos, y se me
              escapan leads todos los días&rdquo;
            </em>
            .
          </p>
          <p>
            En lugar de construir otro CRM genérico tropicalizado, partimos de
            cero con tres principios:
          </p>
          <ul className="list-decimal space-y-3 pl-6 marker:font-mono marker:text-steel">
            <li>
              <strong>Mobile-first de verdad.</strong> Los agentes están en la
              calle, no en una oficina. La app tiene que sentirse nativa en el
              celular antes que en el escritorio.
            </li>
            <li>
              <strong>IA como copiloto, no como gimmick.</strong> El listing
              studio escribe el copy, la IA mejora las fotos, califica leads y
              adapta cada publicación al tono del portal. Vos validás siempre.
            </li>
            <li>
              <strong>Un único sistema, no 7.</strong> Inventario, leads,
              compliance, multi-publicación, analytics — todo bajo una sola
              login. Los datos hablan entre sí porque viven en la misma DB.
            </li>
          </ul>
          <p>
            Empezamos por Panamá porque conocemos el mercado y los marcos
            regulatorios (Ley 81, Superintendencia, KYC inmobiliario). Pero
            Orkasa está pensado para todo LATAM: República Dominicana, Costa
            Rica, Colombia, México son los siguientes en hoja de ruta.
          </p>
          <p>
            Somos un equipo chico. Eso significa que cada feature está pensada,
            cada bug se prioriza, y cuando escribís a soporte te contesta una
            persona que entiende inmuebles — no un script genérico.
          </p>
          <p className="pt-4 font-mono text-[11px] uppercase tracking-[1.5px] text-steel">
            — El equipo de Orkasa
          </p>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
          <Stat label="Fundación" value="2026" />
          <Stat label="HQ" value="Panamá" />
          <Stat label="Mercados" value="LATAM" />
          <Stat label="Equipo" value="Lean" />
        </div>
      </section>

      <section className="border-t border-bone bg-ink px-4 py-12 text-paper md:px-6 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-[24px] font-medium tracking-[-0.5px] md:text-[32px]">
            Querés trabajar con nosotros?
          </h2>
          <p className="mt-2 max-w-md text-[14px] text-steel">
            Estamos sumando ingenieros, designers y especialistas inmobiliarios.
          </p>
          <Link
            href={locale === 'es' ? '/contacto' : '/en/contacto'}
            className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-signal px-5 py-3 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90"
          >
            Contactanos →
          </Link>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-signal pl-3">
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
      <p className="mt-1 font-mono text-[20px] font-medium tabular-nums text-ink md:text-[24px]">
        {value}
      </p>
    </div>
  )
}

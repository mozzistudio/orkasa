import type { Metadata } from 'next'
import { Mail, MessageSquare, MapPin } from 'lucide-react'
import { pageMetadata, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo'
import { ContactForm } from './contact-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEs = locale === 'es'
  return pageMetadata({
    locale: isEs ? 'es' : 'en',
    path: 'contacto',
    title: isEs ? 'Contacto — Orkasa' : 'Contact — Orkasa',
    description: isEs
      ? 'Hablá con el equipo de Orkasa. Demo personalizada, planes enterprise, integraciones custom, prensa o partnerships.'
      : 'Talk to the Orkasa team. Personalized demo, enterprise plans, custom integrations, press, or partnerships.',
  })
}

export default async function ContactoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Contacto', path: 'contacto' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Contacto
          </p>
          <h1 className="mt-3 text-[40px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[56px] md:tracking-[-1.5px]">
            Hablemos.
          </h1>
          <p className="mt-6 max-w-[520px] text-[15px] leading-relaxed text-steel md:text-[17px]">
            Escribinos para una demo, para hablar de planes enterprise, o
            simplemente para hacer una pregunta.
          </p>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
          {/* Sidebar contact info */}
          <aside className="space-y-6">
            <ContactRow
              icon={Mail}
              label="Email"
              value="hola@orkasa.io"
              href="mailto:hola@orkasa.io"
            />
            <ContactRow
              icon={MessageSquare}
              label="Ventas"
              value="ventas@orkasa.io"
              href="mailto:ventas@orkasa.io"
            />
            <ContactRow
              icon={MapPin}
              label="HQ"
              value="Ciudad de Panamá, Panamá"
            />
            <div className="border-t border-bone pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Soporte
              </p>
              <p className="mt-2 text-[13px] text-ink">
                ¿Sos cliente? Escribí a{' '}
                <a
                  href="mailto:soporte@orkasa.io"
                  className="font-medium text-signal hover:text-signal/80"
                >
                  soporte@orkasa.io
                </a>{' '}
                — respondemos en menos de 4 horas hábiles.
              </p>
            </div>
          </aside>

          {/* Form */}
          <ContactForm />
        </div>
      </section>
    </>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
      <p className="mt-1 text-[14px] text-ink">{value}</p>
    </>
  )
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 h-4 w-4 shrink-0 text-ink" strokeWidth={1.5} />
      <div className="flex-1">
        {href ? (
          <a href={href} className="block hover:opacity-70 transition-opacity">
            {inner}
          </a>
        ) : (
          inner
        )}
      </div>
    </div>
  )
}

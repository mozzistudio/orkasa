'use client'

import { Upload, Sparkles, Send } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'Subí la propiedad',
    description:
      'Fotos, dirección, precio. Lo básico. La IA completa el resto: título, descripción, alt text, score y orden sugerido de fotos.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Validá con IA',
    description:
      'Tres variantes de copy (portal formal, social conversacional, móvil breve). Mejorá fotos con Gemini: cielo, iluminación, decluttering, virtual staging. Vos elegís qué aplicar.',
  },
  {
    number: '03',
    icon: Send,
    title: 'Publicá en todos lados',
    description:
      'Un click → 12 portales. Cada plataforma recibe el copy adaptado a su tono y límite de caracteres. Validás cada uno antes del envío final.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-bone px-4 py-16 md:px-6 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Cómo funciona
          </p>
          <h2 className="mt-3 text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]">
            De foto a portal publicado
            <br />
            en menos de 5 minutos.
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ number, icon: Icon, title, description }, idx) => (
            <article key={number} className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-signal">
                  {number}
                </span>
                <div className="h-px flex-1 bg-bone" />
              </div>
              <Icon className="mb-4 h-6 w-6 text-ink" strokeWidth={1.5} />
              <h3 className="text-[18px] font-medium tracking-[-0.3px] text-ink md:text-[20px]">
                {title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-steel">
                {description}
              </p>
              {idx < STEPS.length - 1 && (
                <div
                  className="absolute -right-3 top-2 hidden h-px w-6 bg-bone md:block"
                  aria-hidden="true"
                />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

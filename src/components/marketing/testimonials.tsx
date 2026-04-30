'use client'

const TESTIMONIALS = [
  {
    quote:
      'Pasamos de 3 horas por publicación a 8 minutos. Y los textos quedan mejor que los nuestros, porque la IA aprende del feedback que damos al validar.',
    name: 'Carolina Méndez',
    role: 'Directora',
    org: 'Premier Real Estate',
    location: 'Panamá · 14 agentes',
    initials: 'CM',
  },
  {
    quote:
      'El compliance era un infierno de Excel y carpetas. Ahora cuando un lead pasa a negociación, Orkasa pide los docs solo, hace el match contra OFAC, y arma el ROS. Recuperamos 2 días por mes.',
    name: 'Andrés Vargas',
    role: 'Compliance Officer',
    org: 'Vargas Inmobiliaria',
    location: 'Bogotá · 28 agentes',
    initials: 'AV',
  },
  {
    quote:
      'La mejora de fotos con Gemini es la que se llevó al equipo. Ya no contratamos fotógrafo para reposiciones — usamos las fotos del dueño y las arreglamos en 3 clicks.',
    name: 'María José Rivera',
    role: 'Broker',
    org: 'MJR Properties',
    location: 'Santo Domingo · 6 agentes',
    initials: 'MJR',
  },
] as const

export function Testimonials() {
  return (
    <section className="border-t border-bone px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Quiénes nos usan
          </p>
          <h2 className="mt-3 text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]">
            Brokers que pasaron de Excel
            <br />
            a Orkasa.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-[4px] border border-bone bg-paper p-6"
            >
              <blockquote className="flex-1 text-[14px] leading-relaxed text-ink md:text-[15px]">
                <span className="text-signal">&ldquo;</span>
                {t.quote}
                <span className="text-signal">&rdquo;</span>
              </blockquote>
              <footer className="mt-6 flex items-center gap-3 border-t border-bone pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[12px] font-medium text-ink">
                  {t.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{t.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                    {t.role} · {t.org}
                  </p>
                  <p className="font-mono text-[10px] tracking-wider text-steel">
                    {t.location}
                  </p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

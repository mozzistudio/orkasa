import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { POSTS } from '@/lib/blog'
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
    path: 'blog',
    title: isEs ? 'Blog — Orkasa' : 'Blog — Orkasa',
    description: isEs
      ? 'Recursos, casos de estudio y reflexiones sobre IA, multi-publicación y compliance para brokers en LATAM.'
      : 'Resources, case studies, and thoughts on AI, multi-posting, and compliance for LATAM brokers.',
  })
}

const TAG_COLOR: Record<string, string> = {
  Producto: 'bg-bone text-ink',
  Engineering: 'bg-ink text-paper',
  Compliance: 'bg-signal/10 text-signal',
}

export default async function BlogPage() {
  const breadcrumb = breadcrumbJsonLd([{ name: 'Blog', path: 'blog' }])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">
            Blog
          </p>
          <h1 className="mt-3 text-[40px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[56px] md:tracking-[-1.5px]">
            Notas del equipo.
          </h1>
          <p className="mt-6 max-w-[520px] text-[15px] leading-relaxed text-steel md:text-[17px]">
            Pensamientos sobre el negocio inmobiliario en LATAM, novedades de
            producto, y casos reales de clientes.
          </p>
        </div>
      </section>

      <section className="border-t border-bone px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl divide-y divide-bone">
          {POSTS.map((post) => (
            <article key={post.slug} className="py-8 first:pt-0 last:pb-0">
              <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('es-PA', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
                <span>·</span>
                <span
                  className={`rounded-[4px] px-2 py-0.5 ${
                    TAG_COLOR[post.tag] ?? 'bg-bone text-ink'
                  }`}
                >
                  {post.tag}
                </span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-[22px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
                <Link
                  href={`/blog/${post.slug}`}
                  className="transition-colors hover:text-signal"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-steel">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-signal transition-colors hover:text-signal/80"
                aria-label={`Leer ${post.title}`}
              >
                Leer artículo
                <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

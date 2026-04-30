import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { POSTS, getPost } from '@/lib/blog'
import {
  pageMetadata,
  breadcrumbJsonLd,
  jsonLdScript,
  SITE,
} from '@/lib/seo'

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getPost(slug)
  if (!post) {
    return pageMetadata({
      locale: locale === 'es' ? 'es' : 'en',
      path: `blog/${slug}`,
      title: 'Artículo no encontrado',
      description: '',
      noindex: true,
    })
  }
  return pageMetadata({
    locale: locale === 'es' ? 'es' : 'en',
    path: `blog/${slug}`,
    title: post.title,
    description: post.excerpt,
  })
}

/**
 * Tiny markdown-lite renderer. Supports:
 * - `## ` → h2
 * - `### ` → h3
 * - `- ` → list item (consecutive lines = single ul)
 * - `> ` → blockquote
 * - blank line → paragraph break
 * - inline `\`code\`` → <code>
 */
function renderBody(body: string) {
  const lines = body.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''

    if (line.startsWith('## ')) {
      blocks.push(
        <h2
          key={key++}
          className="mt-12 text-[22px] font-medium tracking-[-0.3px] text-ink md:text-[26px]"
        >
          {line.slice(3)}
        </h2>,
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h3
          key={key++}
          className="mt-8 text-[17px] font-medium tracking-[-0.2px] text-ink md:text-[19px]"
        >
          {line.slice(4)}
        </h3>,
      )
      i++
      continue
    }

    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={key++}
          className="my-6 border-l-2 border-signal pl-5 text-[15px] italic text-ink md:text-[17px]"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      )
      i++
      continue
    }

    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i] ?? '').startsWith('- ')) {
        items.push((lines[i] ?? '').slice(2))
        i++
      }
      blocks.push(
        <ul
          key={key++}
          className="my-4 list-disc space-y-2 pl-6 text-[14px] leading-relaxed text-ink marker:text-steel md:text-[15px]"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (line.startsWith('```')) {
      // code block — collect until next ```
      const codeLines: string[] = []
      i++
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) {
        codeLines.push(lines[i] ?? '')
        i++
      }
      i++ // skip closing fence
      blocks.push(
        <pre
          key={key++}
          className="my-5 overflow-x-auto rounded-[4px] border border-bone bg-coal p-4 font-mono text-[12px] leading-relaxed text-paper"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      )
      continue
    }

    if (line.trim() === '') {
      i++
      continue
    }

    // paragraph — collect lines until blank
    const paraLines: string[] = []
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !(lines[i] ?? '').startsWith('## ') &&
      !(lines[i] ?? '').startsWith('### ') &&
      !(lines[i] ?? '').startsWith('- ') &&
      !(lines[i] ?? '').startsWith('> ') &&
      !(lines[i] ?? '').startsWith('```')
    ) {
      paraLines.push(lines[i] ?? '')
      i++
    }
    blocks.push(
      <p
        key={key++}
        className="my-4 text-[15px] leading-relaxed text-ink md:text-[16px]"
      >
        {renderInline(paraLines.join(' '))}
      </p>,
    )
  }

  return blocks
}

/** Inline transforms: backtick code, **bold**, [text](url). */
function renderInline(text: string): React.ReactNode {
  // We split on patterns and rebuild — order matters.
  const parts: React.ReactNode[] = []
  let buf = text
  let key = 0

  // Tokenize iteratively. Cheapest correct approach for our small grammar.
  const codeRe = /`([^`]+)`/
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/
  const boldRe = /\*\*([^*]+)\*\*/

  while (buf.length > 0) {
    const codeMatch = buf.match(codeRe)
    const linkMatch = buf.match(linkRe)
    const boldMatch = buf.match(boldRe)

    const candidates = [
      codeMatch ? { kind: 'code' as const, m: codeMatch } : null,
      linkMatch ? { kind: 'link' as const, m: linkMatch } : null,
      boldMatch ? { kind: 'bold' as const, m: boldMatch } : null,
    ].filter((x): x is NonNullable<typeof x> => Boolean(x))

    if (candidates.length === 0) {
      parts.push(buf)
      break
    }

    // Pick the earliest match
    const next = candidates.reduce((a, b) =>
      (a.m.index ?? 0) <= (b.m.index ?? 0) ? a : b,
    )
    const idx = next.m.index ?? 0

    if (idx > 0) parts.push(buf.slice(0, idx))

    if (next.kind === 'code') {
      parts.push(
        <code
          key={key++}
          className="rounded-[3px] bg-bone/50 px-1.5 py-0.5 font-mono text-[12px] text-ink"
        >
          {next.m[1]}
        </code>,
      )
      buf = buf.slice(idx + next.m[0].length)
    } else if (next.kind === 'link') {
      const href = next.m[2] ?? '#'
      parts.push(
        <Link
          key={key++}
          href={href}
          className="font-medium text-signal hover:text-signal/80 transition-colors"
        >
          {next.m[1]}
        </Link>,
      )
      buf = buf.slice(idx + next.m[0].length)
    } else {
      parts.push(
        <strong key={key++} className="font-medium text-ink">
          {next.m[1]}
        </strong>,
      )
      buf = buf.slice(idx + next.m[0].length)
    }
  }

  return parts
}

const TAG_COLOR: Record<string, string> = {
  Producto: 'bg-bone text-ink',
  Engineering: 'bg-ink text-paper',
  Compliance: 'bg-signal/10 text-signal',
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Blog', path: 'blog' },
    { name: post.title, path: `blog/${post.slug}` },
  ])

  // Article JSON-LD for richer SEO snippets
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Orkasa' },
    publisher: {
      '@type': 'Organization',
      name: 'Orkasa',
      logo: { '@type': 'ImageObject', url: `${SITE.url}/icon.svg` },
    },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
  }

  // Other posts for "see also"
  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd) }}
      />

      <article className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel transition-colors hover:text-ink"
          >
            <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />
            Blog
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
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

          <h1 className="text-[32px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[44px] md:tracking-[-1px]">
            {post.title}
          </h1>

          <div className="mt-6 flex items-center gap-3 border-y border-bone py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-bone font-mono text-[11px] font-medium text-ink">
              {post.author
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? '')
                .join('')}
            </div>
            <div>
              <p className="text-[13px] font-medium text-ink">{post.author}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                {post.authorRole}
              </p>
            </div>
          </div>

          <div className="mt-8">{renderBody(post.body)}</div>

          {/* See also */}
          {others.length > 0 && (
            <aside className="mt-16 border-t border-bone pt-10">
              <p className="mb-6 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Seguir leyendo
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {others.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="block rounded-[4px] border border-bone bg-paper p-5 transition-colors hover:border-ink"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                      {p.tag} · {p.readTime}
                    </p>
                    <h3 className="mt-2 text-[16px] font-medium tracking-[-0.2px] text-ink md:text-[17px]">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-steel">
                      {p.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </div>
      </article>
    </>
  )
}

/**
 * SEO config — single source of truth for site metadata, canonical URLs,
 * and structured data. Used by `app/layout.tsx`, marketing pages, sitemap,
 * robots, and the OpenGraph image route.
 */

import type { Metadata } from 'next'

export const SITE = {
  name: 'Orkasa',
  /** Production canonical. Override via NEXT_PUBLIC_SITE_URL in deployments. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://orkasa.vercel.app',
  /** Default twitter handle (placeholder until claimed). */
  twitter: '@orkasa_io',
  /** Legal entity for footer + JSON-LD. */
  legalName: 'Orkasa Technologies',
  /** Country focus for hreflang and JSON-LD. */
  country: 'PA',
  defaultLocale: 'es',
  alternateLocales: ['en'] as const,
  /** Default OG image (served by `app/opengraph-image.tsx` at /opengraph-image). */
  ogImagePath: '/opengraph-image',
} as const

export const KEYWORDS_ES = [
  'CRM inmobiliario',
  'software inmobiliario',
  'IA inmobiliaria',
  'gestión de propiedades',
  'multi-publicación',
  'portales inmobiliarios',
  'leads inmobiliarios',
  'inmobiliaria Panamá',
  'inmobiliaria LATAM',
  'broker inmobiliario',
  'agentes inmobiliarios',
] as const

export const KEYWORDS_EN = [
  'real estate CRM',
  'real estate software',
  'AI real estate',
  'property management',
  'multi-listing',
  'real estate portals',
  'real estate leads',
  'Panama real estate',
  'LATAM real estate',
  'real estate broker',
  'real estate agents',
] as const

type PageMetaInput = {
  title: string
  description: string
  /** Path WITHOUT leading slash, no trailing slash. e.g. 'precios', '' for home. */
  path: string
  locale?: 'es' | 'en'
  /** Additional keywords to merge with the locale defaults. */
  keywords?: readonly string[]
  /** OG image override (absolute path or full URL). */
  image?: string
  noindex?: boolean
}

/**
 * Build a Metadata object with consistent OG, Twitter, canonical, and
 * hreflang annotations. Pass to `export const metadata` in any page or
 * `export async function generateMetadata` for dynamic ones.
 */
export function pageMetadata(input: PageMetaInput): Metadata {
  const locale = input.locale ?? SITE.defaultLocale
  const cleanPath = input.path.replace(/^\/|\/$/g, '')
  const localePrefix = locale === SITE.defaultLocale ? '' : `/${locale}`
  const canonical = `${SITE.url}${localePrefix}${cleanPath ? `/${cleanPath}` : ''}`

  // hreflang map — every page available in es + en
  const languages: Record<string, string> = {
    'es-PA': `${SITE.url}${cleanPath ? `/${cleanPath}` : ''}`,
    'en-US': `${SITE.url}/en${cleanPath ? `/${cleanPath}` : ''}`,
    'x-default': `${SITE.url}${cleanPath ? `/${cleanPath}` : ''}`,
  }

  const keywords = [
    ...(locale === 'en' ? KEYWORDS_EN : KEYWORDS_ES),
    ...(input.keywords ?? []),
  ]

  const ogImage = input.image ?? SITE.ogImagePath

  return {
    title: input.title,
    description: input.description,
    keywords: [...keywords],
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE.name,
      title: input.title,
      description: input.description,
      locale: locale === 'es' ? 'es_PA' : 'en_US',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitter,
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

/** JSON-LD: Organization. Use once on the homepage. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/icon.svg`,
    sameAs: [
      // TODO: add real socials when claimed
      // 'https://twitter.com/orkasa_io',
      // 'https://www.linkedin.com/company/orkasa',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: SITE.country,
    },
  }
}

/** JSON-LD: SoftwareApplication. Use on homepage + product page. */
export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'CRM',
    operatingSystem: 'Web',
    description:
      'CRM inmobiliario nativo de IA para brokers y agentes en Latinoamérica.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '39',
      highPrice: '149',
      offerCount: '3',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '12',
    },
  }
}

/** JSON-LD: BreadcrumbList. Use on every non-home page. */
export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Inicio', path: '' },
      ...items,
    ].map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE.url}${item.path ? `/${item.path.replace(/^\//, '')}` : ''}`,
    })),
  }
}

/** Inline `<script type="application/ld+json">` content. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

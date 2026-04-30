import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo'

/**
 * Marketing pages to surface in the sitemap. App / auth pages are excluded
 * (gated behind login, not crawlable). Update this list when adding new
 * public pages.
 */
const ROUTES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: 'producto', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: 'precios', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: 'sobre-nosotros', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: 'contacto', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: 'integraciones', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: 'blog', priority: 0.6, changeFrequency: 'weekly' as const },
  { path: 'recursos', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: 'privacidad', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: 'terminos', priority: 0.3, changeFrequency: 'yearly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ROUTES.flatMap((route) => {
    const esUrl = `${SITE.url}${route.path ? `/${route.path}` : ''}`
    const enUrl = `${SITE.url}/en${route.path ? `/${route.path}` : ''}`
    return [
      {
        url: esUrl,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            'es-PA': esUrl,
            'en-US': enUrl,
            'x-default': esUrl,
          },
        },
      },
      {
        url: enUrl,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            'es-PA': esUrl,
            'en-US': enUrl,
            'x-default': esUrl,
          },
        },
      },
    ]
  })
}

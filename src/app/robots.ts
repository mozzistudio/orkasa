import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/',
          '/api/',
          '/auth/',
          '/login',
          '/signup',
          '/en/app/',
          '/en/login',
          '/en/signup',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}

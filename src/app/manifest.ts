import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — CRM inmobiliario con IA para LATAM`,
    short_name: SITE.name,
    description:
      'Plataforma inmobiliaria nativa de IA para brokers en Latinoamérica.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        type: 'image/png',
        sizes: '64x64',
        purpose: 'any',
      },
      {
        src: '/icon0',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        type: 'image/png',
        sizes: '180x180',
        purpose: 'any',
      },
    ],
  }
}

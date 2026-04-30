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
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  }
}

import type { Metadata } from 'next'
import { Hero } from '@/components/marketing/hero'
import { LogoBar } from '@/components/marketing/logo-bar'
import { Pillars } from '@/components/marketing/pillars'
import { StatsBar } from '@/components/marketing/stats-bar'
import { Pricing } from '@/components/marketing/pricing'
import {
  pageMetadata,
  organizationJsonLd,
  softwareApplicationJsonLd,
  jsonLdScript,
} from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEs = locale === 'es'
  return pageMetadata({
    locale: isEs ? 'es' : 'en',
    path: '',
    title: isEs
      ? 'Orkasa — CRM inmobiliario con IA para LATAM'
      : 'Orkasa — AI-native real estate CRM for LATAM',
    description: isEs
      ? 'Gestioná inventario, multi-publicá en portales con texto adaptado por IA, calificá leads automáticamente y mantené el compliance en regla — todo en un único CRM diseñado para brokers en Latinoamérica.'
      : 'Manage inventory, multi-post listings to portals with AI-adapted copy, auto-qualify leads, and stay compliant — all in one CRM built for LATAM brokers.',
  })
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(organizationJsonLd()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(softwareApplicationJsonLd()),
        }}
      />
      <Hero />
      <LogoBar />
      <Pillars />
      <StatsBar />
      <Pricing />
    </>
  )
}

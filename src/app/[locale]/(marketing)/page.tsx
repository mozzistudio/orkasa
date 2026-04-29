import { Hero } from '@/components/marketing/hero'
import { LogoBar } from '@/components/marketing/logo-bar'
import { Pillars } from '@/components/marketing/pillars'
import { StatsBar } from '@/components/marketing/stats-bar'
import { Pricing } from '@/components/marketing/pricing'

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoBar />
      <Pillars />
      <StatsBar />
      <Pricing />
    </>
  )
}

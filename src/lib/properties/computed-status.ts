import { formatRelativeEs } from '@/lib/compliance-copy'
import { formatPriceCompact } from '@/lib/utils'
import type {
  ComputedAlert,
  ComputedStatus,
  PropertyWithMetrics,
} from './types'

const DAY_MS = 24 * 60 * 60 * 1000

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)
}

function daysUntil(iso: string | null | undefined): number {
  if (!iso) return Number.POSITIVE_INFINITY
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS)
}

/**
 * Status tag shown as the overlay pill on the property card photo.
 * Priority order: oportunidad > caliente > vence_pronto > estancada > atencion > activa.
 */
export function computePropertyStatus(p: PropertyWithMetrics): ComputedStatus {
  const m = p.metrics
  const stale = daysSince(p.created_at) > 14
  const expiringSoon =
    p.listing_expires_at !== null && daysUntil(p.listing_expires_at) <= 7

  if (m.recentPriceDrop) return { tag: 'oportunidad', tone: 'green' }
  if (m.hasOfferPending || m.recentLeads7d >= 3)
    return { tag: 'caliente', tone: 'signal' }
  if (expiringSoon) return { tag: 'vence_pronto', tone: 'amber' }
  if (m.totalLeads === 0 && stale) return { tag: 'estancada', tone: 'amber' }
  if (m.totalLeads >= 5 && m.visitsCount === 0)
    return { tag: 'atencion', tone: 'amber' }
  return { tag: 'activa', tone: 'neutral' }
}

/**
 * The contextual business alert shown inside the card body — one human-readable
 * sentence + a recommended action. Same priority order as computePropertyStatus
 * so the tag and the alert always agree.
 */
export function computePropertyAlert(p: PropertyWithMetrics): ComputedAlert {
  const m = p.metrics
  const stale = daysSince(p.created_at) > 14
  const daysSinceListing = daysSince(p.created_at)
  const expiringSoon =
    p.listing_expires_at !== null && daysUntil(p.listing_expires_at) <= 7

  if (m.recentPriceDrop) {
    const when = m.priceDropAt ? formatRelativeEs(m.priceDropAt) : 'recientemente'
    const eligible = m.totalLeads
    return {
      tone: 'opp',
      message: `Bajaste el precio ${when} · ${eligible} leads para avisar`,
      action: {
        label: `Notificar leads (${eligible})`,
        type: 'success',
      },
    }
  }

  if (m.hasOfferPending) {
    const offerName = m.pendingOfferLeadName ?? 'un cliente'
    const offerAmount = m.pendingOfferAmount
      ? formatPriceCompact(m.pendingOfferAmount)
      : null
    return {
      tone: 'hot',
      message: offerAmount
        ? `${m.recentLeads7d} leads esta semana · 1 oferta en mesa de ${offerName} (${offerAmount})`
        : `${m.recentLeads7d} leads esta semana · 1 oferta en mesa de ${offerName}`,
      action: { label: `Ver leads (${m.totalLeads})`, type: 'primary' },
    }
  }

  if (m.recentLeads7d >= 3) {
    return {
      tone: 'hot',
      message: `${m.recentLeads7d} leads esta semana · momento de empujar el cierre`,
      action: { label: `Ver leads (${m.totalLeads})`, type: 'primary' },
    }
  }

  if (expiringSoon) {
    const days = Math.max(0, daysUntil(p.listing_expires_at))
    return {
      tone: 'cool',
      message: `Listing vence en ${days} días · renová o se baja del portal automáticamente`,
      action: { label: 'Renovar listing', type: 'amber' },
    }
  }

  if (m.totalLeads === 0 && stale) {
    return {
      tone: 'cool',
      message: `0 leads en ${daysSinceListing} días · considerá nuevas fotos o bajar precio`,
      action: { label: 'Boostear', type: 'amber' },
    }
  }

  if (m.totalLeads >= 5 && m.visitsCount === 0) {
    return {
      tone: 'cool',
      message: `${m.totalLeads} leads pero 0 visitas · el pitch o el precio no enganchan`,
      action: { label: 'Revisar pitch', type: 'amber' },
    }
  }

  if (m.nextViewingAt) {
    return {
      tone: 'neutral',
      message: `Avanzando con normalidad · próxima visita ${formatRelativeEs(m.nextViewingAt)}`,
      action: { label: `Ver leads (${m.totalLeads})`, type: 'default' },
    }
  }

  return {
    tone: 'neutral',
    message: 'Avanzando con normalidad',
    action: { label: `Ver leads (${m.totalLeads})`, type: 'default' },
  }
}

export function getStatusLabel(tag: ComputedStatus['tag']): string {
  switch (tag) {
    case 'caliente':
      return 'Caliente'
    case 'oportunidad':
      return 'Oportunidad'
    case 'vence_pronto':
      return 'Vence pronto'
    case 'estancada':
      return 'Estancada'
    case 'atencion':
      return 'Atención'
    case 'activa':
      return 'Activa'
  }
}

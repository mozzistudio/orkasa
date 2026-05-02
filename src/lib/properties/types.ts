import type { Database } from '@/lib/database.types'

export type PropertyRow = Database['public']['Tables']['properties']['Row']
export type PropertyStatus = Database['public']['Enums']['property_status']
export type PropertyType = Database['public']['Enums']['property_type']
export type ListingType = Database['public']['Enums']['listing_type']

export type PriceHistoryEntry = {
  at: string
  from: number | null
  to: number
}

export type StoredImage = { path: string; url: string }

export type PropertyMetrics = {
  totalLeads: number
  recentLeads7d: number
  visitsCount: number
  nextViewingAt: string | null
  hasOfferPending: boolean
  pendingOfferAmount: number | null
  pendingOfferLeadName: string | null
  recentPriceDrop: boolean
  priceDropAt: string | null
  previousPrice: number | null
  ownerName: string | null
}

export type PropertyWithMetrics = PropertyRow & {
  metrics: PropertyMetrics
}

export type StatusTone = 'signal' | 'amber' | 'green' | 'neutral'

export type ComputedStatus = {
  tag:
    | 'caliente'
    | 'oportunidad'
    | 'vence_pronto'
    | 'estancada'
    | 'atencion'
    | 'activa'
  tone: StatusTone
}

export type AlertTone = 'hot' | 'cool' | 'opp' | 'neutral'
export type AlertActionType = 'primary' | 'signal' | 'amber' | 'success' | 'default'

export type ComputedAlert = {
  tone: AlertTone
  message: string
  action: { label: string; type: AlertActionType }
}

export type CompletionTone = 'low' | 'mid' | 'high'

export type ComputedCompletion = {
  percentage: number
  missing: string[]
  tone: CompletionTone
  isPublishable: boolean
}

export type AnomalyLevel = 'error' | 'warn'

export type Anomaly = {
  level: AnomalyLevel
  field: string
  message: string
  suggestion: string | null
}

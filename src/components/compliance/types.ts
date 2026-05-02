import type { DocumentReminderType } from '@/lib/whatsapp-templates'

export type DealSeverity = 'blocked' | 'waiting' | 'ready'

export type AwaitingClientItem = {
  leadId: string
  leadName: string
  phone: string | null
  pendingDocNames: string[]
  pendingDocType: DocumentReminderType
  propertyTitle: string
  propertyPrice: number | null
  listingType: 'sale' | 'rent' | null
  timingLabel: string
  timingVariant: 'late' | 'soon' | 'ok'
}

export type AwaitingBrokerItem = {
  leadId: string
  leadName: string
  checkId: string
  actionType: 'review' | 'approve'
  propertyTitle: string
  timingLabel: string
  timingVariant: 'late' | 'soon' | 'ok'
}

export type CheckProgress = {
  label: string
  status: 'done' | 'todo' | 'fail'
}

export type DealCardData = {
  leadId: string
  leadName: string
  phone: string | null
  propertyTitle: string
  propertyPrice: number | null
  listingType: 'sale' | 'rent' | null
  severity: DealSeverity
  statusLabel: string
  statusDescription: string
  checkIds: string[]
  assignedAgentId: string | null
  assignedAgentName: string | null
  progress: CheckProgress[]
  progressDone: number
  progressTotal: number
  timingLabel: string
  timingUrgent: boolean
  pendingDocType: DocumentReminderType
}

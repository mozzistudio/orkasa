export type TaskStatus = 'open' | 'done' | 'escalated' | 'skipped'

export type TaskPhase =
  | 'contacto_inicial'
  | 'visitas'
  | 'negociacion'
  | 'cumplimiento'
  | 'cierre_legal'
  | 'tramite_bancario'
  | 'entrega'
  | 'post_cierre'

export type CtaAction =
  | 'open_whatsapp'
  | 'open_call'
  | 'schedule_visit'
  | 'request_doc'
  | 'open_offer_form'
  | 'open_compliance_check'
  | 'post_visit_decision'
  | 'pep_verification_decision'
  | 'mark_done'
  | 'navigate'

export type TaskEvent =
  | 'lead_created'
  | 'lead_status_changed'
  | 'interaction_logged'
  | 'document_uploaded'
  | 'document_verified'
  | 'viewing_scheduled'
  | 'viewing_completed'
  | 'offer_created'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'compliance_approved'
  | 'pep_verification_rejected'
  | 'lead_property_status_changed'
  | 'task_completed'
  | 'cron_tick'

export type TaskEventPayload = {
  event: TaskEvent
  leadId: string
  brokerageId: string
  agentId: string
  propertyId?: string
  dealId?: string
  offerId?: string
  viewingId?: string
  interactionType?: string
  documentCode?: string
  oldStatus?: string
  newStatus?: string
  dealStage?: string
  completedStep?: number
  metadata?: Record<string, unknown>
}

export type TaskContext = {
  firstName: string
  leadName: string
  propertyTitle?: string
  agentName?: string
  amount?: number
  formattedAmount?: string
  ownerName?: string
  ownerPhone?: string
  offerLink?: string
  notaryName?: string
  notaryPhone?: string
  lawyerName?: string
  lawyerPhone?: string
  appraiserName?: string
  appraiserPhone?: string
  bankerName?: string
  bankerPhone?: string
}

export type TriggerContext = TaskEventPayload & {
  lead: {
    full_name: string
    phone: string | null
    status: string | null
    property_id: string | null
    metadata: Record<string, unknown> | null
  }
  property?: {
    title: string
    price: number | null
    property_type: string
    owner_name: string | null
    owner_phone: string | null
  } | null
  deal?: {
    id: string
    stage: string
    amount: number | null
    closed_at: string | null
    metadata: Record<string, unknown> | null
  } | null
  offer?: {
    id: string
    amount: number
    currency: string
    public_token: string | null
  } | null
  notary?: {
    name: string
    phone: string | null
  } | null
  lawyer?: {
    name: string
    phone: string | null
  } | null
  appraiser?: {
    name: string
    phone: string | null
  } | null
  banker?: {
    name: string
    phone: string | null
  } | null
  existingOpenSteps: number[]
  /** Days since `deal.closed_at` (null if no deal or no close date). Used by
   *  cron-driven steps to gate creation on elapsed time. */
  daysSinceClosed: number | null
  /** ISO timestamp of the most recent `done` task per step number for this
   *  lead. Used by perpetual steps (e.g. annual check-in) to enforce a
   *  minimum gap between recurrences. */
  lastDoneStepDates: Record<number, string>
}

export type TaskCatalogEntry = {
  stepNumber: number
  phase: TaskPhase
  titleTemplate: (ctx: TaskContext) => string
  description: string
  ctaAction: CtaAction
  ctaMetadataBuilder?: (ctx: TaskContext) => Record<string, unknown>
  dueDaysOffset: number
  escalationDaysOffset: number
  triggerEvents: TaskEvent[]
  triggerCondition?: (ctx: TriggerContext) => boolean
  autoCompleteOn?: string
  whatsappTemplate?: string
}

export type TaskRow = {
  id: string
  lead_id: string
  brokerage_id: string
  agent_id: string | null
  deal_id: string | null
  step_number: number
  phase: string
  title: string
  description: string | null
  cta_action: string
  cta_metadata: Record<string, unknown>
  due_at: string | null
  escalation_at: string | null
  auto_complete_on: string | null
  status: TaskStatus
  completed_at: string | null
  completed_by: string | null
  trigger_reason: Record<string, unknown>
  property_id: string | null
  offer_id: string | null
  viewing_id: string | null
  created_at: string
  updated_at: string
}

export type TaskAuditAction =
  | 'created'
  | 'completed'
  | 'auto_completed'
  | 'escalated'
  | 'skipped'

export type TaskWhatsAppTemplate =
  | 'firstContact'
  | 'sendPropertyOptions'
  | 'noResponseReminder48h'
  | 'visitInvitation'
  | 'preVisitReminder'
  | 'postVisitFollowUp'
  | 'offerPresentation'
  | 'requestPreapprovalLetter'
  | 'transmitOfferToOwner'
  | 'offerAccepted'
  | 'requestIdentityDocs'
  | 'notifyOwnerComplianceIssue'
  | 'notifyClientComplianceIssue'
  | 'requestSellerDocs'
  | 'promesaDraft'
  | 'notifyLawyerExpediente'
  | 'coordinateAppraisal'
  | 'coordinateNotaryEscritura'
  | 'thankYouAndReview'
  | 'escrituraRegistered'
  | 'welcomeNewOwner'
  | 'followUp1Month'
  | 'followUp3Months'
  | 'followUp6Months'
  | 'anniversary1Year'
  | 'annualCheckIn'
  | 'requestReferral'

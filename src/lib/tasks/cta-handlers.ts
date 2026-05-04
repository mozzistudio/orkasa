import {
  buildReminderUrl,
  firstContact,
  sendPropertyOptions,
  noResponseReminder48h,
  visitInvitation,
  preVisitReminder,
  postVisitFollowUp,
  offerPresentation,
  requestPreapprovalLetter,
  transmitOfferToOwner,
  offerAccepted,
  requestIdentityDocs,
  requestPayslips,
  requestBankStatements,
  askPepRelationship,
  requestSellerDocs,
  promesaDraft,
  notifyLawyerExpediente,
  coordinateAppraisal,
  coordinateNotaryEscritura,
  thankYouAndReview,
  escrituraRegistered,
  welcomeNewOwner,
  followUp1Month,
  followUp3Months,
  followUp6Months,
  anniversary1Year,
  annualCheckIn,
  requestReferral,
  reactivateColdLead,
} from '@/lib/whatsapp-templates'
import type { CtaAction, TaskWhatsAppTemplate } from './types'

export type CtaCallbacks = {
  openModal?: (modal: string, props: Record<string, unknown>) => void
  navigate?: (path: string) => void
  onComplete?: (taskId: string) => void
}

function buildWhatsAppMessage(
  template: TaskWhatsAppTemplate,
  meta: Record<string, unknown>,
): string {
  const clientName = (meta.clientName as string) ?? 'Cliente'
  const agentName = (meta.agentName as string) ?? ''
  const propertyTitle = (meta.propertyTitle as string) ?? ''
  const amount = (meta.formattedAmount as string) ?? ''

  switch (template) {
    case 'firstContact':
      return firstContact(clientName, agentName, propertyTitle)
    case 'sendPropertyOptions':
      return sendPropertyOptions(
        clientName,
        (meta.propertyTitles as string[]) ?? [propertyTitle],
      )
    case 'noResponseReminder48h':
      return noResponseReminder48h(clientName, propertyTitle)
    case 'visitInvitation':
      return visitInvitation(clientName, propertyTitle)
    case 'preVisitReminder':
      return preVisitReminder(clientName, propertyTitle, (meta.time as string) ?? '')
    case 'postVisitFollowUp':
      return postVisitFollowUp(clientName, propertyTitle)
    case 'offerPresentation':
      return offerPresentation(clientName, propertyTitle, amount)
    case 'requestPreapprovalLetter':
      return requestPreapprovalLetter(clientName, propertyTitle)
    case 'transmitOfferToOwner': {
      const ownerName = (meta.ownerName as string) ?? 'propietario'
      const offerLink = (meta.offerLink as string) ?? ''
      return transmitOfferToOwner(ownerName, propertyTitle, clientName, amount, offerLink)
    }
    case 'offerAccepted':
      return offerAccepted(clientName, propertyTitle)
    case 'requestIdentityDocs':
      return requestIdentityDocs(clientName, propertyTitle)
    case 'requestPayslips':
      return requestPayslips(clientName, propertyTitle)
    case 'requestBankStatements':
      return requestBankStatements(clientName, propertyTitle)
    case 'askPepRelationship':
      return askPepRelationship(clientName)
    case 'requestSellerDocs': {
      const sellerName = (meta.ownerName as string) ?? 'propietario'
      return requestSellerDocs(sellerName, propertyTitle)
    }
    case 'promesaDraft':
      return promesaDraft(clientName, propertyTitle)
    case 'coordinateNotaryEscritura': {
      const notaryName = (meta.notaryName as string) ?? ''
      const buyerFullName = (meta.leadFullName as string) ?? clientName
      return coordinateNotaryEscritura(notaryName, buyerFullName, propertyTitle)
    }
    case 'notifyLawyerExpediente': {
      const lawyerName = (meta.lawyerName as string) ?? ''
      const buyerFullName = (meta.leadFullName as string) ?? clientName
      return notifyLawyerExpediente(lawyerName, buyerFullName, propertyTitle)
    }
    case 'coordinateAppraisal': {
      const contactName =
        (meta.appraiserName as string) ?? (meta.bankerName as string) ?? ''
      const ownerName = (meta.ownerName as string) ?? ''
      return coordinateAppraisal(contactName, propertyTitle, ownerName)
    }
    case 'thankYouAndReview':
      return thankYouAndReview(clientName, propertyTitle)
    case 'escrituraRegistered':
      return escrituraRegistered(clientName, propertyTitle)
    case 'welcomeNewOwner':
      return welcomeNewOwner(clientName, propertyTitle)
    case 'followUp1Month':
      return followUp1Month(clientName)
    case 'followUp3Months':
      return followUp3Months(clientName)
    case 'followUp6Months':
      return followUp6Months(clientName)
    case 'anniversary1Year':
      return anniversary1Year(clientName, agentName)
    case 'annualCheckIn':
      return annualCheckIn(clientName)
    case 'requestReferral':
      return requestReferral(clientName, agentName)
    default:
      return reactivateColdLead(clientName, propertyTitle, 7)
  }
}

export function executeCtaAction(
  action: CtaAction,
  metadata: Record<string, unknown>,
  callbacks: CtaCallbacks,
): void {
  const phone = metadata.phone as string | undefined

  switch (action) {
    case 'open_whatsapp': {
      if (!phone) return
      const template = metadata.template as TaskWhatsAppTemplate | undefined
      const message = template
        ? buildWhatsAppMessage(template, metadata)
        : ''
      const leadId = metadata.leadId as string | undefined
      const fallbackToWaMe = () =>
        window.open(buildReminderUrl(phone, message), '_blank')

      if (!leadId) {
        fallbackToWaMe()
        break
      }

      // Try the WhatsApp Business API first; fall back to wa.me when unconfigured
      void fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, body: message }),
      })
        .then(async (res) => {
          if (res.ok) return
          const payload = (await res.json().catch(() => null)) as {
            error?: string
          } | null
          if (
            !payload?.error ||
            payload.error === 'whatsapp_not_configured' ||
            payload.error === 'lead_missing_phone'
          ) {
            fallbackToWaMe()
          }
        })
        .catch(() => fallbackToWaMe())
      break
    }

    case 'open_call':
      if (phone) window.open(`tel:${phone.replace(/[^0-9+]/g, '')}`)
      break

    case 'schedule_visit':
      callbacks.openModal?.('schedule_visit', {
        leadId: metadata.leadId,
        propertyId: metadata.propertyId,
      })
      break

    case 'request_doc':
      callbacks.openModal?.('request_doc', {
        leadId: metadata.leadId,
        docCodes: metadata.docCodes,
        target: metadata.target ?? 'buyer',
      })
      break

    case 'open_offer_form':
      callbacks.openModal?.('offer_form', {
        leadId: metadata.leadId,
        propertyId: metadata.propertyId,
      })
      break

    case 'open_compliance_check':
      callbacks.navigate?.(`/app/compliance/${metadata.checkId}`)
      break

    case 'post_visit_decision':
      // Handled inline by the task row UI (two-button decision).
      break

    case 'mark_done':
      if (metadata.taskId) {
        callbacks.onComplete?.(metadata.taskId as string)
      }
      break

    case 'navigate':
      if (metadata.path) {
        callbacks.navigate?.(metadata.path as string)
      }
      break
  }
}

const WHATSAPP_TEMPLATE_LABELS: Record<string, string> = {
  firstContact: 'Saludar',
  sendPropertyOptions: 'Enviar opciones',
  noResponseReminder48h: 'Recordar',
  visitInvitation: 'Invitar a visita',
  preVisitReminder: 'Confirmar visita',
  postVisitFollowUp: 'Seguimiento',
  offerPresentation: 'Avisar oferta',
  requestPreapprovalLetter: 'Pedir pre-aprobación',
  transmitOfferToOwner: 'Enviar oferta',
  offerAccepted: 'Avisar aceptación',
  requestIdentityDocs: 'Pedir cédula',
  requestPayslips: 'Pedir fichas',
  requestBankStatements: 'Pedir bancos',
  askPepRelationship: 'Preguntar PEP',
  requestSellerDocs: 'Pedir docs',
  promesaDraft: 'Enviar borrador',
  notifyLawyerExpediente: 'Avisar abogado',
  coordinateAppraisal: 'Coordinar avalúo',
  coordinateNotaryEscritura: 'Coordinar notario',
  thankYouAndReview: 'Agradecer',
  escrituraRegistered: 'Enviar escritura',
  welcomeNewOwner: 'Bienvenida',
  followUp1Month: 'Check-in 1 mes',
  followUp3Months: 'Pedir referidos',
  followUp6Months: 'Encuesta',
  anniversary1Year: 'Felicitar',
  annualCheckIn: 'Saludar',
  requestReferral: 'Pedir referido',
}

export function getCtaLabel(
  action: CtaAction,
  metadata?: Record<string, unknown>,
): string {
  if (action === 'open_whatsapp') {
    const template = metadata?.template as string | undefined
    if (template && WHATSAPP_TEMPLATE_LABELS[template]) {
      return WHATSAPP_TEMPLATE_LABELS[template]
    }
    return 'WhatsApp'
  }
  switch (action) {
    case 'open_call':
      return 'Llamar'
    case 'schedule_visit':
      return 'Agendar'
    case 'request_doc':
      return 'Pedir'
    case 'open_offer_form':
      return 'Oferta'
    case 'open_compliance_check':
      return 'Revisar'
    case 'post_visit_decision':
      return 'Decidir'
    case 'mark_done':
      return 'Listo'
    case 'navigate':
      return 'Ver'
  }
}

export type TaskRecipient = {
  name: string
  role: string
  isLead: boolean
}

const TARGET_ROLE_LABELS: Record<string, string> = {
  seller: 'Vendedor',
  notary: 'Notario',
  lawyer: 'Abogado',
  appraiser: 'Tasador',
  banker: 'Banco',
}

export function resolveTaskRecipient(
  metadata: Record<string, unknown>,
  leadName: string,
): TaskRecipient {
  const target = metadata.target as string | undefined
  switch (target) {
    case 'seller':
      return {
        name: (metadata.ownerName as string) || 'Vendedor',
        role: 'Vendedor',
        isLead: false,
      }
    case 'notary':
      return {
        name: (metadata.notaryName as string) || 'Notario',
        role: 'Notario',
        isLead: false,
      }
    case 'lawyer':
      return {
        name: (metadata.lawyerName as string) || 'Abogado',
        role: 'Abogado',
        isLead: false,
      }
    case 'appraiser':
      return {
        name: (metadata.appraiserName as string) || 'Tasador',
        role: 'Tasador',
        isLead: false,
      }
    case 'banker':
      return {
        name: (metadata.bankerName as string) || 'Banco',
        role: 'Banco',
        isLead: false,
      }
    default:
      return { name: leadName, role: 'Cliente', isLead: true }
  }
}

export function getTargetRoleLabel(target: string | undefined): string | null {
  if (!target) return null
  return TARGET_ROLE_LABELS[target] ?? null
}

export function resolveCtaPhone(
  metadata: Record<string, unknown>,
  fallbackPhone: string | null = null,
): string | null {
  // If the metadata builder set the phone key explicitly (even to null), trust
  // it — the WhatsApp/call is for a specific contact (notary, lawyer, owner)
  // and the lead's phone would reach the wrong person.
  if ('phone' in metadata) {
    const v = metadata.phone
    return typeof v === 'string' && v.length > 0 ? v : null
  }
  return fallbackPhone
}

export function isCtaActionable(
  action: CtaAction,
  metadata: Record<string, unknown>,
  fallbackPhone: string | null = null,
): boolean {
  if (action === 'open_whatsapp' || action === 'open_call') {
    return resolveCtaPhone(metadata, fallbackPhone) !== null
  }
  return true
}

export function getCtaUnavailableReason(
  action: CtaAction,
  metadata: Record<string, unknown>,
): string {
  const target = metadata.target as string | undefined
  if (action === 'open_whatsapp' || action === 'open_call') {
    if (target === 'notary') return 'Sin notario configurado en Proveedores'
    if (target === 'lawyer') return 'Sin abogado configurado en Proveedores'
    if (target === 'appraiser' || target === 'banker')
      return 'Sin tasador / banco configurado en Proveedores'
    if (target === 'seller') return 'Sin teléfono del vendedor en la propiedad'
    return 'Sin teléfono disponible'
  }
  return ''
}

export function getCtaIcon(action: CtaAction): string {
  switch (action) {
    case 'open_whatsapp':
      return 'whatsapp'
    case 'open_call':
      return 'phone'
    case 'schedule_visit':
      return 'calendar'
    case 'request_doc':
      return 'file'
    case 'open_offer_form':
      return 'dollar'
    case 'open_compliance_check':
      return 'shield'
    case 'post_visit_decision':
      return 'check'
    case 'mark_done':
      return 'check'
    case 'navigate':
      return 'arrow-right'
  }
}

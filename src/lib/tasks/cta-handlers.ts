import {
  buildReminderUrl,
  firstContact,
  sendPropertyOptions,
  noResponseReminder48h,
  visitInvitation,
  preVisitReminder,
  postVisitFollowUp,
  offerPresentation,
  transmitOfferToOwner,
  offerAccepted,
  requestIdentityDocs,
  requestPayslips,
  requestBankStatements,
  askPepRelationship,
  requestSellerDocs,
  promesaDraft,
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
    case 'requestSellerDocs':
      return requestSellerDocs(clientName, propertyTitle)
    case 'promesaDraft':
      return promesaDraft(clientName, propertyTitle)
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

    case 'open_financing_sim':
      callbacks.openModal?.('financing_sim', {
        dealId: metadata.dealId,
        leadId: metadata.leadId,
      })
      break

    case 'open_compliance_check':
      callbacks.navigate?.(`/app/compliance/${metadata.checkId}`)
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

export function getCtaLabel(action: CtaAction): string {
  switch (action) {
    case 'open_whatsapp':
      return 'WhatsApp'
    case 'open_call':
      return 'Llamar'
    case 'schedule_visit':
      return 'Agendar'
    case 'request_doc':
      return 'Pedir'
    case 'open_offer_form':
      return 'Oferta'
    case 'open_financing_sim':
      return 'Simular'
    case 'open_compliance_check':
      return 'Revisar'
    case 'mark_done':
      return 'Listo'
    case 'navigate':
      return 'Ver'
  }
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
    case 'open_financing_sim':
      return 'calculator'
    case 'open_compliance_check':
      return 'shield'
    case 'mark_done':
      return 'check'
    case 'navigate':
      return 'arrow-right'
  }
}

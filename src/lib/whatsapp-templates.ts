function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '')
}

export function buildReminderUrl(phone: string, message: string): string {
  return `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`
}

export function reminderCedula(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te escribo de Orkasa. Para avanzar con tu trámite del ${propertyTitle}, necesitamos una copia clara de tu cédula vigente. Podés enviármela por acá cuando puedas. ¡Gracias!`
}

export function reminderIncomeProof(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te escribo de Orkasa. Para seguir con el trámite del ${propertyTitle}, necesitamos un comprobante de ingresos reciente (puede ser una ficha de la CSS, carta de trabajo o estado de cuenta). Podés mandármelo por acá. ¡Gracias!`
}

export function reminderFundsOrigin(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te escribo de Orkasa. Para completar la documentación del ${propertyTitle}, necesitamos una declaración o documento que acredite el origen de los fondos. Podés enviarlo por acá o preguntar si tenés dudas. ¡Gracias!`
}

export function reminderUBO(companyName: string, propertyTitle: string): string {
  return `Hola, te escribo de Orkasa respecto a la operación del ${propertyTitle} a nombre de ${companyName}. Necesitamos la declaración de beneficiario final (dueño real) de la empresa. Podés enviarla por acá. ¡Gracias!`
}

export function readyToSign(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te escribo de Orkasa. Ya está todo listo para firmar el contrato del ${propertyTitle}. ¿Cuándo te queda bien pasar a firmar? ¡Gracias!`
}

export function reactivateColdLead(clientName: string, propertyTitle: string, daysAgo: number): string {
  if (daysAgo < 14) {
    return `Hola ${clientName}, ¿cómo estás? Te escribo para retomar lo del ${propertyTitle}. ¿Seguís interesado/a? Tengo novedades que te pueden interesar.`
  }
  return `Hola ${clientName}! Hace tiempo que no hablamos. Sigo atento a propiedades que se ajusten a lo que buscabas. ¿Te interesa que te mande algunas opciones nuevas?`
}

export function preVisitReminder(clientName: string, propertyTitle: string, time: string): string {
  return `Hola ${clientName}, te confirmo nuestra cita hoy a las ${time} para ver el ${propertyTitle}. La dirección y código de acceso te los paso por aquí. Cualquier cosa avísame!`
}

export function priceDropAlert(clientName: string, propertyTitle: string, oldPrice: string, newPrice: string): string {
  return `Hola ${clientName}! Buena noticia — el ${propertyTitle} bajó de ${oldPrice} a ${newPrice}. Vos lo viste hace poco, capaz ahora encaja con tu presupuesto. ¿Querés que te agende una segunda visita?`
}

export type DashboardReminderType = 'reactivate' | 'pre_visit' | 'price_drop'

export type DocumentReminderType = 'identity' | 'income_proof' | 'funds_origin' | 'company_ubo' | 'ready_to_sign'

export function requestPayslips(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te escribo de Orkasa. Para avanzar con la compra del ${propertyTitle}, el banco nos pide tus 3 últimas fichas de pago. ¿Me las podrías enviar por aquí cuando puedas? Gracias!`
}

export function askPepRelationship(clientName: string): string {
  return `Hola ${clientName}, una pregunta rápida obligatoria: ¿tenés parientes cercanos (padres, hermanos, cónyuge, hijos) que ocupen o hayan ocupado cargos públicos en el gobierno panameño? Si la respuesta es no, perfecto. Si es sí, vamos a necesitarte un papel adicional. Gracias!`
}

export function askUbo(clientName: string, companyName: string): string {
  return `Hola ${clientName}, para avanzar con la compra a nombre de ${companyName}, necesitamos una declaración firmada que indique quién es el dueño real (beneficiario final) de la empresa. Es un papel estándar que tu contador o abogado te lo prepara en minutos. Gracias!`
}

export function askGenericDocument(clientName: string, docName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te escribo de Orkasa. Para avanzar con el ${propertyTitle}, necesitamos ${docName.toLowerCase()}. ¿Me lo podrías enviar por aquí cuando puedas? Gracias!`
}

export type DetailReminderType =
  | 'request_payslips'
  | 'ask_pep'
  | 'ask_ubo'
  | 'ready_to_sign'

export function getReminderMessage(
  type: DocumentReminderType,
  clientName: string,
  propertyTitle: string,
): string {
  switch (type) {
    case 'identity':
      return reminderCedula(clientName, propertyTitle)
    case 'income_proof':
      return reminderIncomeProof(clientName, propertyTitle)
    case 'funds_origin':
      return reminderFundsOrigin(clientName, propertyTitle)
    case 'company_ubo':
      return reminderUBO(clientName, propertyTitle)
    case 'ready_to_sign':
      return readyToSign(clientName, propertyTitle)
  }
}

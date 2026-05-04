function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
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

export function askMultipleDocuments(clientName: string, docNames: string[], propertyTitle: string): string {
  if (docNames.length === 1) return askGenericDocument(clientName, docNames[0], propertyTitle)
  const list = docNames.map((d) => `• ${d}`).join('\n')
  return `Hola ${clientName}, te escribo de Orkasa. Para avanzar con el ${propertyTitle} nos faltan ${docNames.length} documentos:\n\n${list}\n\n¿Podemos coordinar para que los envíes por acá? Gracias!`
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

// ═══════════════════════════════════════════════════════════════════
// Task Engine Templates (Steps 1–34)
// ═══════════════════════════════════════════════════════════════════

export function firstContact(clientName: string, agentName: string, propertyTitle?: string): string {
  const propLine = propertyTitle
    ? ` Vi que te interesa el ${propertyTitle}.`
    : ''
  return `Hola ${clientName}, soy ${agentName} de Orkasa.${propLine} Estoy para ayudarte con lo que necesitás — ¿tenés un momento para conversar?`
}

export function sendPropertyOptions(clientName: string, propertyTitles: string[]): string {
  const list = propertyTitles.map((t) => `• ${t}`).join('\n')
  return `Hola ${clientName}! Te seleccioné estas ${propertyTitles.length} opciones que creo que te van a gustar:\n\n${list}\n\nDecime cuál(es) te llama la atención y armo una visita esta semana. Cualquier duda me escribís!`
}

export function noResponseReminder48h(clientName: string, propertyTitle?: string): string {
  const propLine = propertyTitle
    ? ` sobre el ${propertyTitle}`
    : ''
  return `Hola ${clientName}, ¿cómo vas? Te escribí hace unos días${propLine} y quería saber si pudiste revisar las opciones. Estoy pendiente por si tenés alguna pregunta!`
}

export function visitInvitation(clientName: string, propertyTitle: string, timeSlots?: string): string {
  const slotsLine = timeSlots
    ? `\n\nHorarios disponibles:\n${timeSlots}`
    : '\n\n¿Qué día y hora te queda bien?'
  return `Hola ${clientName}! Me encantaría mostrarte el ${propertyTitle} en persona. Creo que te va a gustar mucho.${slotsLine}\n\nAvisame y te confirmo!`
}

export function postVisitFollowUp(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, ¿qué tal te pareció el ${propertyTitle}? Estoy para aclararte cualquier duda que te haya quedado. ¿Querés que avancemos con algo?`
}

export function offerPresentation(clientName: string, propertyTitle: string, amount: string): string {
  return `Hola ${clientName}, ya presenté tu oferta de ${amount} por el ${propertyTitle} al propietario. Te aviso apenas tenga respuesta. ¡Crucemos los dedos!`
}

export function transmitOfferToOwner(
  ownerName: string,
  propertyTitle: string,
  buyerName: string,
  amount: string,
  offerLink: string,
): string {
  return `Hola ${ownerName}, te escribo de Orkasa. Recibimos una oferta formal de ${amount} por el ${propertyTitle} de parte de ${buyerName}.\n\nTe paso la carta de oferta acá: ${offerLink}\n\n¿Cuándo te queda bien que conversemos para revisar las condiciones?`
}

export function offerAccepted(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, buenísima noticia — el propietario aceptó tu oferta por el ${propertyTitle}! 🎉 Ahora vamos a necesitar algunos documentos para formalizar. Te explico todo en los próximos mensajes.`
}

export function requestIdentityDocs(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, para avanzar con la compra del ${propertyTitle} necesitamos:\n\n• Copia de tu cédula panameña vigente (o pasaporte si sos extranjero)\n• Un comprobante de domicilio reciente (recibo de luz o agua de menos de 3 meses)\n\n¿Me los podés enviar por acá? Gracias!`
}

export function requestBankStatements(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te escribo de Orkasa. Para completar el expediente del ${propertyTitle}, necesitamos tus estados bancarios de los últimos 6 meses. ¿Me los podés enviar por acá? Gracias!`
}

export function requestSellerDocs(sellerName: string, propertyTitle: string): string {
  return `Hola ${sellerName}, para avanzar con la venta del ${propertyTitle} necesitamos los siguientes documentos:\n\n• Certificado de paz y salvo nacional\n• Certificado de paz y salvo municipal\n• Certificado del Registro Público libre de gravámenes (con menos de 30 días)\n• Recibos de servicios públicos al día (luz, agua, gas)\n\nSi el inmueble es PH, también necesitamos el certificado de cuotas de mantenimiento al día.\n\n¿Podemos coordinar? Gracias!`
}

export function promesaDraft(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, el abogado ya preparó el borrador de la promesa de compraventa del ${propertyTitle}. Te lo envío por email para que lo revises. Si tenés comentarios o dudas, me escribís y se los paso al abogado. Gracias!`
}

export function coordinateNotaryEscritura(
  notaryName: string,
  buyerName: string,
  propertyTitle: string,
): string {
  const notarySalutation = notaryName ? `Hola ${notaryName}` : 'Buenas'
  return `${notarySalutation}, te escribo de Orkasa. El préstamo del comprador ${buyerName} para el ${propertyTitle} fue aprobado oficialmente por el banco. ¿Cuándo podemos coordinar la firma de la escritura pública? Pasame un par de fechas tentativas y confirmo con las partes. Gracias!`
}

export function notifyLawyerExpediente(
  lawyerName: string,
  buyerName: string,
  propertyTitle: string,
): string {
  const salutation = lawyerName ? `Hola ${lawyerName}` : 'Buenas'
  return `${salutation}, te escribo de Orkasa. El expediente de cumplimiento del comprador ${buyerName} para el ${propertyTitle} ya está completo y verificado. ¿Podés empezar a redactar el borrador de la promesa de compraventa? Te paso los documentos por email — avisame si necesitás algo más. Gracias!`
}

export function coordinateAppraisal(
  contactName: string,
  propertyTitle: string,
  ownerName: string,
): string {
  const salutation = contactName ? `Hola ${contactName}` : 'Buenas'
  const ownerLine = ownerName
    ? `El propietario ${ownerName} está al tanto y disponible para coordinar el acceso.`
    : 'Coordinamos con el propietario el acceso una vez tengamos fecha.'
  return `${salutation}, te escribo de Orkasa. Necesitamos agendar el avalúo de la propiedad ${propertyTitle} para avanzar con el trámite bancario. ¿Qué fechas tenés disponibles esta semana o la próxima? ${ownerLine} Gracias!`
}

export function thankYouAndReview(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, felicidades por tu nuevo hogar! 🏠 Fue un placer acompañarte en todo el proceso del ${propertyTitle}. Si tenés un minuto, me ayudaría mucho que dejes una reseña en Google — tu experiencia ayuda a otros compradores a confiar en nosotros. Gracias de corazón!`
}

export function escrituraRegistered(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}, te cuento que tu escritura del ${propertyTitle} ya está registrada en el Registro Público! 🎉 Te envío la copia certificada por email. Si tenés alguna pregunta, acá estoy.`
}

export function welcomeNewOwner(clientName: string, propertyTitle: string): string {
  return `Hola ${clientName}! Bienvenido oficialmente a tu nuevo hogar en ${propertyTitle}. Si necesitás contactos de confianza para la mudanza, plomero, electricista o cualquier servicio, avisame que te paso mi lista. Estoy para lo que necesités!`
}

export function followUp1Month(clientName: string): string {
  return `Hola ${clientName}, ¿cómo te estás instalando? Espero que todo bien con el nuevo hogar! ¿Necesitás contactos de algún servicio? Plomero, electricista, cerrajero — tengo una lista que te puede servir. Avisame!`
}

export function followUp3Months(clientName: string): string {
  return `Hola ${clientName}! ¿Cómo va todo con la propiedad? Espero que ya te sientas como en casa. Si conocés a alguien que esté buscando comprar o alquilar, sería genial que me lo refieras — voy a cuidarlo igual que a vos.`
}

export function followUp6Months(clientName: string): string {
  return `Hola ${clientName}, ya van 6 meses! ¿Cómo te ha ido con todo? Me encantaría saber tu opinión sobre la experiencia de compra — ¿del 1 al 5, cómo calificarías el proceso? Tu feedback me ayuda a mejorar.`
}

export function anniversary1Year(clientName: string, agentName: string): string {
  return `Hola ${clientName}! 🎉 Hoy se cumple un año desde que recibiste las llaves. Espero que hayas disfrutado muchísimo tu hogar. Fue un placer para mí, ${agentName}, acompañarte. Si algún día necesitás algo relacionado con propiedades, ya sabés dónde encontrarme!`
}

export function annualCheckIn(clientName: string): string {
  return `Hola ${clientName}, espero que todo bien con la propiedad! Solo paso a saludar y recordarte que si necesitás algo relacionado con bienes raíces, estoy siempre disponible. Un abrazo!`
}

export function requestReferral(clientName: string, agentName: string): string {
  return `Hola ${clientName}, soy ${agentName} de Orkasa. Si conocés a alguien que esté buscando propiedad, me encantaría que me lo refieras. Voy a darle la misma atención y dedicación que tuvimos en tu proceso. Gracias!`
}


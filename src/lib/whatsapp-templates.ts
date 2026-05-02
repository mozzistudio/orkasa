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

export type DocumentReminderType = 'identity' | 'income_proof' | 'funds_origin' | 'company_ubo' | 'ready_to_sign'

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

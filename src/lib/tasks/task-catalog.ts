import type { TaskCatalogEntry, TaskContext, TriggerContext } from './types'

function firstName(ctx: TaskContext): string {
  return ctx.firstName
}

export const TASK_CATALOG: TaskCatalogEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  // Phase: CONTACTO INICIAL (Steps 1–4)
  // ═══════════════════════��═══════════════════════════════════════════

  {
    stepNumber: 1,
    phase: 'contacto_inicial',
    titleTemplate: (ctx) =>
      `Enviarle primer mensaje por WhatsApp a ${firstName(ctx)}`,
    description:
      'Presentarte, confirmar el interés y ofrecer ayuda personalizada.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'firstContact',
    dueDaysOffset: 0,
    escalationDaysOffset: 1,
    triggerEvents: ['lead_created'],
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 2,
    phase: 'contacto_inicial',
    titleTemplate: (ctx) =>
      `Agendar llamada de calificación con ${firstName(ctx)} — presupuesto, tiempos, barrios preferidos`,
    description:
      'Llamar para entender qué busca: rango de precio, cuándo quiere mudarse, qué zonas le interesan.',
    ctaAction: 'open_call',
    dueDaysOffset: 1,
    escalationDaysOffset: 3,
    triggerEvents: ['lead_status_changed'],
    triggerCondition: (ctx) => ctx.newStatus === 'contacted',
    autoCompleteOn: 'interaction:call',
  },

  {
    stepNumber: 3,
    phase: 'contacto_inicial',
    titleTemplate: (ctx) =>
      `Enviar 3 propiedades a ${firstName(ctx)} y proponer visitas`,
    description:
      'Seleccionar las mejores opciones según presupuesto y zona, enviarlas por WhatsApp con links públicos y preguntar cuáles quiere visitar.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'sendPropertyOptions',
    dueDaysOffset: 1,
    escalationDaysOffset: 3,
    triggerEvents: ['lead_status_changed'],
    triggerCondition: (ctx) => ctx.newStatus === 'qualified',
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 4,
    phase: 'contacto_inicial',
    titleTemplate: (ctx) =>
      `Esperar reacción de ${firstName(ctx)} — recordatorio automático si no responde en 48h`,
    description:
      'Si no hay respuesta en 48 horas, enviar un recordatorio amigable.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'noResponseReminder48h',
    dueDaysOffset: 2,
    escalationDaysOffset: 5,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 3,
    autoCompleteOn: 'interaction:whatsapp',
  },

  // ═══════════════════════════════════════════════════════════════════
  // Phase: VISITAS (Steps 6–8)
  // Step 5 was merged into step 3 (proposing properties + asking which to
  // visit happens in a single WhatsApp message).
  // ═══════════════════════════════════════════════════════════════════

  {
    stepNumber: 6,
    phase: 'visitas',
    titleTemplate: (ctx) =>
      `Enviar recordatorio de visita a ${firstName(ctx)}`,
    description:
      'Confirmar la cita 24 horas antes por WhatsApp.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'preVisitReminder',
    dueDaysOffset: 0,
    escalationDaysOffset: 1,
    triggerEvents: ['viewing_scheduled'],
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 7,
    phase: 'visitas',
    titleTemplate: (ctx) =>
      `Hoy: visita con ${firstName(ctx)} a ${ctx.propertyTitle ?? 'la propiedad'}`,
    description:
      'Revisar historial del cliente, llevar la visita y registrar el resultado después.',
    ctaAction: 'navigate',
    dueDaysOffset: 0,
    escalationDaysOffset: 1,
    triggerEvents: ['cron_tick'],
    autoCompleteOn: 'viewing_completed',
  },

  {
    stepNumber: 8,
    phase: 'visitas',
    titleTemplate: (ctx) =>
      `Enviar seguimiento post-visita a ${firstName(ctx)} — aclarar dudas y pedir decisión`,
    description:
      'Enviar mensaje dentro de las 4 horas después de la visita con aclaraciones y preguntar si quiere avanzar.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'postVisitFollowUp',
    dueDaysOffset: 0,
    escalationDaysOffset: 1,
    triggerEvents: ['viewing_completed'],
    autoCompleteOn: 'interaction:whatsapp',
  },

  // ═══════════════════════════════════════════════════════════════════
  // Phase: FINANCIAMIENTO (Step 9)
  // ═════════════��═════════════════════════════════════════════════════

  {
    stepNumber: 9,
    phase: 'financiamiento',
    titleTemplate: (ctx) =>
      `Generar simulación de financiamiento para ${firstName(ctx)}`,
    description:
      'Crear PDF con el cálculo del préstamo personalizado y agendar llamada para revisarlo juntos.',
    ctaAction: 'open_financing_sim',
    dueDaysOffset: 1,
    escalationDaysOffset: 3,
    triggerEvents: ['interaction_logged'],
    triggerCondition: (ctx) => ctx.interactionType === 'financing_request',
    autoCompleteOn: 'interaction:whatsapp',
  },

  // ════���═════════════════════════════════════════════════════════��════
  // Phase: NEGOCIACION (Step 10)
  // ═══════════════���═══════════════════════════════════════════════════

  {
    stepNumber: 10,
    phase: 'negociacion',
    titleTemplate: (ctx) =>
      `Registrar oferta verbal de ${firstName(ctx)} por ${ctx.propertyTitle ?? 'la propiedad'}`,
    description:
      'Capturar el monto ofrecido y las condiciones, notificar al dueño de la propiedad.',
    ctaAction: 'open_offer_form',
    dueDaysOffset: 0,
    escalationDaysOffset: 2,
    triggerEvents: ['lead_status_changed'],
    triggerCondition: (ctx) => ctx.newStatus === 'negotiating',
    autoCompleteOn: 'offer_created',
  },

  // ═══════════════════════════���═══════════════════════════════════════
  // Phase: CUMPLIMIENTO (Steps 11–16)
  // ��═════════════════════════════════════════════���════════════════════

  {
    stepNumber: 11,
    phase: 'cumplimiento',
    titleTemplate: (ctx) =>
      `Pedirle a ${firstName(ctx)} su cédula panameña (o pasaporte si es extranjero) y un comprobante de domicilio reciente (recibo de luz o agua de menos de 3 meses)`,
    description:
      'Documentos de identidad necesarios para abrir el expediente de la operación.',
    ctaAction: 'request_doc',
    ctaMetadataBuilder: () => ({
      docCodes: ['identity', 'address_proof'],
      requiredDocCodesAny: ['identity_id_panamanian', 'identity_id_foreign'],
      requiredDocCodesAll: ['identity_address_proof'],
    }),
    dueDaysOffset: 3,
    escalationDaysOffset: 7,
    triggerEvents: ['offer_accepted'],
    autoCompleteOn: 'doc:identity',
    whatsappTemplate: 'requestIdentityDocs',
  },

  {
    stepNumber: 12,
    phase: 'cumplimiento',
    titleTemplate: (ctx) => {
      const meta = ctx as TaskContext & { isAutonomo?: boolean }
      if (meta.isAutonomo) {
        return `Pedirle a ${firstName(ctx)} sus estados financieros de los 2 últimos años`
      }
      return `Pedirle a ${firstName(ctx)} sus 3 últimas fichas de pago (o carta del empleador con salario)`
    },
    description:
      'Documentos que demuestran la capacidad financiera del comprador.',
    ctaAction: 'request_doc',
    ctaMetadataBuilder: () => ({
      docCodes: ['income_proof'],
    }),
    dueDaysOffset: 3,
    escalationDaysOffset: 7,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 11,
    autoCompleteOn: 'doc:income_proof',
    whatsappTemplate: 'requestPayslips',
  },

  {
    stepNumber: 13,
    phase: 'cumplimiento',
    titleTemplate: (ctx) =>
      `Verificar que los ingresos de ${firstName(ctx)} cubran la cuota (máximo 30% de ingreso mensual)`,
    description:
      'Confirmar que el monto de la cuota no supera el 30% de los ingresos declarados.',
    ctaAction: 'mark_done',
    dueDaysOffset: 2,
    escalationDaysOffset: 5,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 12,
  },

  {
    stepNumber: 14,
    phase: 'cumplimiento',
    titleTemplate: (ctx) => {
      const meta = ctx as TaskContext & { isCash?: boolean }
      if (meta.isCash) {
        return `Pedirle a ${firstName(ctx)} sus estados bancarios de los últimos 6 meses y una carta de constitución de fondos`
      }
      return `Pedirle a ${firstName(ctx)} sus estados bancarios de los últimos 6 meses y la pre-aprobación del banco`
    },
    description:
      'Documentos para verificar de dónde vienen los fondos de la compra.',
    ctaAction: 'request_doc',
    ctaMetadataBuilder: (ctx) => {
      const meta = ctx as TaskContext & { isCash?: boolean }
      const baseCodes = meta.isCash
        ? ['bank_statements_6m', 'funds_constitution_letter']
        : ['bank_statements_6m', 'pre_approval']
      const realCodes = meta.isCash
        ? ['sof_bank_statements']
        : ['sof_bank_statements', 'sof_credit_preapproval']
      return {
        docCodes: baseCodes,
        requiredDocCodesAll: realCodes,
      }
    },
    dueDaysOffset: 5,
    escalationDaysOffset: 10,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 13,
    autoCompleteOn: 'doc:funds_origin',
    whatsappTemplate: 'requestBankStatements',
  },

  {
    stepNumber: 15,
    phase: 'cumplimiento',
    titleTemplate: (ctx) =>
      `Preguntarle a ${firstName(ctx)} si tiene parientes cercanos en cargos de gobierno`,
    description:
      'Pregunta obligatoria cuando el monto supera los $300,000. Si la respuesta es sí, se necesitarán documentos adicionales según el origen de los fondos.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'askPepRelationship',
    dueDaysOffset: 2,
    escalationDaysOffset: 5,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => {
      if (ctx.completedStep !== 14) return false
      const amount = ctx.deal?.amount ?? 0
      return amount > 300_000
    },
    autoCompleteOn: 'doc:pep_declaration',
  },

  {
    stepNumber: 16,
    phase: 'cumplimiento',
    titleTemplate: (ctx) =>
      `Verificación de ${firstName(ctx)} requiere aclaración — revisar con el equipo`,
    description:
      'Se detectó una coincidencia en la verificación. Hay que aclarar la situación antes de continuar.',
    ctaAction: 'open_compliance_check',
    dueDaysOffset: 1,
    escalationDaysOffset: 3,
    triggerEvents: ['pep_match_flagged'],
    autoCompleteOn: 'compliance:pep_cleared',
  },

  // ═════════════���═══════════════════════════════��═════════════════════
  // Phase: CIERRE LEGAL (Steps 17–19)
  // ══════════════════���══════════════════════════════════════���═════════

  {
    stepNumber: 17,
    phase: 'cierre_legal',
    titleTemplate: (ctx) =>
      `Expediente de ${firstName(ctx)} completo — notificar al abogado para redactar la promesa de compraventa`,
    description:
      'Todos los documentos están verificados. Enviar el expediente al abogado para que prepare el borrador de promesa.',
    ctaAction: 'mark_done',
    dueDaysOffset: 2,
    escalationDaysOffset: 7,
    triggerEvents: ['compliance_approved'],
    autoCompleteOn: 'deal_stage:promesa_firmada',
  },

  {
    stepNumber: 18,
    phase: 'cierre_legal',
    titleTemplate: (ctx) =>
      `Enviar borrador de promesa a ${firstName(ctx)} y al vendedor para revisión`,
    description:
      'Compartir el PDF de la promesa para que ambas partes revisen y envíen comentarios.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'promesaDraft',
    dueDaysOffset: 2,
    escalationDaysOffset: 7,
    triggerEvents: ['deal_stage_changed'],
    triggerCondition: (ctx) => ctx.dealStage === 'promesa_firmada',
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 19,
    phase: 'cierre_legal',
    titleTemplate: (ctx) =>
      `Promesa firmada por ${firstName(ctx)} — iniciar seguimiento del trámite bancario`,
    description:
      'La promesa está firmada y las arras pagadas (10%). Iniciar el seguimiento semanal del proceso bancario.',
    ctaAction: 'mark_done',
    dueDaysOffset: 1,
    escalationDaysOffset: 3,
    triggerEvents: ['deal_stage_changed'],
    triggerCondition: (ctx) => ctx.dealStage === 'tramite_bancario',
    autoCompleteOn: 'deal_stage:tramite_bancario',
  },

  // ═════════════════════════════════════���═══════════════════════════��═
  // Phase: TRAMITE BANCARIO (Steps 20–22)
  // ══════��═══════════════════════════════���════════════════════════════

  {
    stepNumber: 20,
    phase: 'tramite_bancario',
    titleTemplate: (ctx) =>
      `Coordinar visita de avalúo del banco para ${ctx.propertyTitle ?? 'la propiedad'}`,
    description:
      'Avisar al dueño, confirmar la dirección y coordinar la cita del perito bancario.',
    ctaAction: 'schedule_visit',
    dueDaysOffset: 5,
    escalationDaysOffset: 14,
    triggerEvents: ['deal_stage_changed'],
    triggerCondition: (ctx) => ctx.dealStage === 'tramite_bancario',
    autoCompleteOn: 'viewing_scheduled',
  },

  {
    stepNumber: 21,
    phase: 'tramite_bancario',
    titleTemplate: () =>
      'Confirmar que el avalúo se realizó y recibir el reporte del banco',
    description:
      'Verificar que el valor del avalúo coincide con el precio de venta. Si es menor, habrá que renegociar.',
    ctaAction: 'mark_done',
    dueDaysOffset: 7,
    escalationDaysOffset: 14,
    triggerEvents: ['viewing_completed'],
    triggerCondition: (ctx) =>
      (ctx.metadata?.viewingType as string) === 'avaluo',
    autoCompleteOn: 'viewing_completed:avaluo',
  },

  {
    stepNumber: 22,
    phase: 'tramite_bancario',
    titleTemplate: (ctx) =>
      `Préstamo aprobado — coordinar escritura pública con el notario para ${ctx.propertyTitle ?? 'la propiedad'}`,
    description:
      'El banco aprobó el préstamo oficialmente. Coordinar con el notario la fecha de firma de la escritura.',
    ctaAction: 'mark_done',
    dueDaysOffset: 3,
    escalationDaysOffset: 7,
    triggerEvents: ['deal_stage_changed'],
    triggerCondition: (ctx) => ctx.dealStage === 'escritura_publica',
    autoCompleteOn: 'deal_stage:escritura_publica',
  },

  // ════════��════════════════════════════════════════════��═════════════
  // Phase: CIERRE LEGAL — seller docs + closing (Steps 23–26)
  // ════════════════════════════════════════════════��══════════════════

  {
    stepNumber: 23,
    phase: 'cierre_legal',
    titleTemplate: (ctx) => {
      const isAptOrCondo =
        ctx.propertyTitle !== undefined &&
        (ctx as TaskContext & { propertyType?: string }).propertyType !== 'house' &&
        (ctx as TaskContext & { propertyType?: string }).propertyType !== 'land' &&
        (ctx as TaskContext & { propertyType?: string }).propertyType !== 'commercial'
      const maintenanceLine = isAptOrCondo
        ? ', certificado de cuotas de mantenimiento al día'
        : ''
      return `Pedirle al vendedor: certificado de paz y salvo nacional + municipal${maintenanceLine}, certificado del Registro Público libre de gravámenes (< 30 días), recibos de servicios públicos al día`
    },
    description:
      'Documentos que el vendedor debe entregar antes del cierre para garantizar que la propiedad está libre de deudas.',
    ctaAction: 'request_doc',
    ctaMetadataBuilder: (ctx) => {
      const isAptOrCondo =
        (ctx as TaskContext & { propertyType?: string }).propertyType === 'apartment' ||
        (ctx as TaskContext & { propertyType?: string }).propertyType === 'condo'
      const codes = [
        'paz_y_salvo_nacional',
        'paz_y_salvo_municipal',
        'registro_publico_libre_gravamenes',
        'recibos_servicios_publicos',
      ]
      if (isAptOrCondo) codes.splice(2, 0, 'cuotas_mantenimiento')
      const realCodes = [
        'property_paz_idaan',
        'property_paz_imu',
        'property_paz_electric',
        'property_registro_publico',
      ]
      if (isAptOrCondo) realCodes.push('property_paz_condo')
      return {
        docCodes: codes,
        target: 'seller',
        requiredDocCodesAll: realCodes,
      }
    },
    dueDaysOffset: 7,
    escalationDaysOffset: 14,
    triggerEvents: ['deal_stage_changed'],
    triggerCondition: (ctx) => ctx.dealStage === 'escritura_publica',
    autoCompleteOn: 'doc:other',
    whatsappTemplate: 'requestSellerDocs',
  },

  {
    stepNumber: 24,
    phase: 'cierre_legal',
    titleTemplate: (ctx) =>
      `Documentos del vendedor recibidos — verificación final y confirmar fecha de cierre con ${firstName(ctx)}`,
    description:
      'Revisar que todo esté en orden y notificar a ambas partes la fecha confirmada de cierre.',
    ctaAction: 'mark_done',
    dueDaysOffset: 3,
    escalationDaysOffset: 7,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 23,
    autoCompleteOn: 'deal_stage:closing_confirmed',
  },

  {
    stepNumber: 25,
    phase: 'cierre_legal',
    titleTemplate: (ctx) =>
      `Programar y completar inspección final de ${ctx.propertyTitle ?? 'la propiedad'}`,
    description:
      'Inspección 1 semana antes del cierre. Si hay problemas, negociar reparación o ajuste de precio.',
    ctaAction: 'schedule_visit',
    dueDaysOffset: 7,
    escalationDaysOffset: 10,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 24,
    autoCompleteOn: 'viewing_completed',
  },

  {
    stepNumber: 26,
    phase: 'cierre_legal',
    titleTemplate: (ctx) =>
      `Día de firma — escritura pública de ${ctx.propertyTitle ?? 'la propiedad'}`,
    description:
      'Registrar el pago final (90% del saldo), cerrar las interacciones del negocio e iniciar el trámite en el Registro Público.',
    ctaAction: 'mark_done',
    dueDaysOffset: 0,
    escalationDaysOffset: 1,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 25,
    autoCompleteOn: 'deal_stage:entrega_llaves',
  },

  // ═══════════════════════════════════════════��═══════════════════════
  // Phase: ENTREGA (Steps 27–28)
  // ════════════════════���═══════════════════��══════════════════════════

  {
    stepNumber: 27,
    phase: 'entrega',
    titleTemplate: (ctx) =>
      `Coordinar entrega de llaves a ${firstName(ctx)}`,
    description:
      'Agendar la entrega, enviar mensaje de agradecimiento y pedir reseña en Google, LinkedIn o Instagram.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'thankYouAndReview',
    dueDaysOffset: 3,
    escalationDaysOffset: 7,
    triggerEvents: ['deal_stage_changed'],
    triggerCondition: (ctx) => ctx.dealStage === 'entrega_llaves',
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 28,
    phase: 'entrega',
    titleTemplate: (ctx) =>
      `Firmar acta de entrega con ${firstName(ctx)} — registrar llaves (principal + parking + bodega + buzón + controles remotos) e informar a la administración`,
    description:
      'Documentar la entrega completa de llaves y accesorios. Informar a la administración del edificio sobre el nuevo propietario.',
    ctaAction: 'mark_done',
    dueDaysOffset: 1,
    escalationDaysOffset: 3,
    triggerEvents: ['task_completed'],
    triggerCondition: (ctx) => ctx.completedStep === 27,
  },

  // ═══════════════════════════════════════════════════════════════════
  // Phase: POST CIERRE (Steps 29–34)
  // ══════════════════════════════════════════════���════════════════════

  {
    stepNumber: 29,
    phase: 'post_cierre',
    titleTemplate: (ctx) =>
      `Enviar copia certificada de la escritura a ${firstName(ctx)} — "tu escritura ya está registrada"`,
    description:
      'El Registro Público completó el trámite (15-30 días después de la firma). Enviar la copia certificada.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'escrituraRegistered',
    dueDaysOffset: 0,
    escalationDaysOffset: 3,
    triggerEvents: ['cron_tick'],
    triggerCondition: (ctx) => (ctx.daysSinceClosed ?? 0) >= 15,
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 30,
    phase: 'post_cierre',
    titleTemplate: (ctx) =>
      `Seguimiento 1 mes con ${firstName(ctx)} — "¿Cómo te estás instalando? ¿Necesitás contactos?"`,
    description:
      'Check-in amigable al mes de la mudanza. Ofrecer contactos de servicios (plomero, electricista, mudanza).',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'followUp1Month',
    dueDaysOffset: 0,
    escalationDaysOffset: 7,
    triggerEvents: ['cron_tick'],
    triggerCondition: (ctx) => (ctx.daysSinceClosed ?? 0) >= 30,
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 31,
    phase: 'post_cierre',
    titleTemplate: (ctx) =>
      `Seguimiento 3 meses con ${firstName(ctx)} — pedir referidos`,
    description:
      'Preguntar si conoce a alguien que esté buscando propiedad. Ofrecer incentivo si aplica.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'followUp3Months',
    dueDaysOffset: 0,
    escalationDaysOffset: 7,
    triggerEvents: ['cron_tick'],
    triggerCondition: (ctx) => (ctx.daysSinceClosed ?? 0) >= 90,
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 32,
    phase: 'post_cierre',
    titleTemplate: (ctx) =>
      `Seguimiento 6 meses con ${firstName(ctx)} — encuesta de satisfacción`,
    description:
      'Enviar encuesta corta (1-5 estrellas + pregunta abierta) para medir satisfacción.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'followUp6Months',
    dueDaysOffset: 0,
    escalationDaysOffset: 7,
    triggerEvents: ['cron_tick'],
    triggerCondition: (ctx) => (ctx.daysSinceClosed ?? 0) >= 180,
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 33,
    phase: 'post_cierre',
    titleTemplate: (ctx) =>
      `Aniversario 1 año con ${firstName(ctx)} — mensaje especial`,
    description:
      'Enviar felicitación de aniversario. Si es cliente VIP, enviar regalo o recuerdo fotográfico.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'anniversary1Year',
    dueDaysOffset: 0,
    escalationDaysOffset: 7,
    triggerEvents: ['cron_tick'],
    triggerCondition: (ctx) => (ctx.daysSinceClosed ?? 0) >= 365,
    autoCompleteOn: 'interaction:whatsapp',
  },

  {
    stepNumber: 34,
    phase: 'post_cierre',
    titleTemplate: (ctx) =>
      `Check-in anual con ${firstName(ctx)} — "espero que todo bien con la propiedad"`,
    description:
      'Contacto liviano cada 12 meses para mantener la relación activa.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'annualCheckIn',
    dueDaysOffset: 0,
    escalationDaysOffset: 14,
    triggerEvents: ['cron_tick'],
    triggerCondition: (ctx) => {
      if ((ctx.daysSinceClosed ?? 0) < 365) return false
      const lastDone = ctx.lastDoneStepDates[34]
      if (!lastDone) return true
      const daysSinceLast =
        (Date.now() - new Date(lastDone).getTime()) / 86_400_000
      return daysSinceLast >= 365
    },
    autoCompleteOn: 'interaction:whatsapp',
  },

  // ═══════════════════════════════════════════════════════════════════
  // Phase: NEGOCIACION — Step 35 (post-Step-10)
  // Fires immediately after an offer is created. The agent must transmit
  // the formal offer letter (PDF) to the property owner via WhatsApp.
  // ═══════════════════════════════════════════════════════════════════

  {
    stepNumber: 35,
    phase: 'negociacion',
    titleTemplate: (ctx) =>
      `Transmitir la oferta de ${firstName(ctx)} (${ctx.formattedAmount ?? ''}) al propietario${ctx.ownerName ? ` ${ctx.ownerName}` : ''}`,
    description:
      'Enviar la carta de oferta formal por WhatsApp al propietario, con el link al PDF.',
    ctaAction: 'open_whatsapp',
    whatsappTemplate: 'transmitOfferToOwner',
    ctaMetadataBuilder: (ctx) => ({
      phone: ctx.ownerPhone ?? null,
      ownerName: ctx.ownerName ?? null,
      offerLink: ctx.offerLink ?? null,
      propertyTitle: ctx.propertyTitle ?? null,
      formattedAmount: ctx.formattedAmount ?? null,
    }),
    dueDaysOffset: 0,
    escalationDaysOffset: 1,
    triggerEvents: ['offer_created'],
  },
]

export function getCatalogEntry(stepNumber: number): TaskCatalogEntry | undefined {
  return TASK_CATALOG.find((e) => e.stepNumber === stepNumber)
}

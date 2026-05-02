import { formatPriceCompact } from '@/lib/utils'

export function getGreeting(firstName: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Buenos días, ${firstName}`
  if (hour < 18) return `Buenas tardes, ${firstName}`
  return `Buenas noches, ${firstName}`
}

export function getGreetingEmoji(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '☕'
  if (hour < 18) return ''
  return '🌙'
}

export function buildPulsePhrase(pipeline: {
  totalValue: number
  readyToSign: number
  coolingCount: number
}): {
  prefix: string
  ready: string
  urgent: string
} {
  const total = formatPriceCompact(pipeline.totalValue)
  const ready = formatPriceCompact(pipeline.readyToSign)

  const prefix = `Empezás la semana con ${total} en pipeline.`

  const readyText = pipeline.readyToSign > 0
    ? `2 deals pueden cerrar esta semana (${ready})`
    : ''

  const urgentText = pipeline.coolingCount > 0
    ? `${pipeline.coolingCount} lead${pipeline.coolingCount > 1 ? 's' : ''} se enfría${pipeline.coolingCount > 1 ? 'n' : ''} y necesita${pipeline.coolingCount > 1 ? 'n' : ''} tu llamada`
    : ''

  return { prefix, ready: readyText, urgent: urgentText }
}

export function buildEmptyPulse(firstName: string): string {
  return `Bienvenida a Orkasa, ${firstName}. Cargá tu primera propiedad o creá un lead para empezar.`
}

export function formatDayOfWeek(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`
}

export function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

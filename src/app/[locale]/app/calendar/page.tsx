import { createClient } from '@/lib/supabase/server'
import { CalendarShell, type CalendarEvent } from '@/components/calendar/calendar-shell'

type Row = {
  id: string
  scheduled_at: string
  status: string
  lead_id: string | null
  property_id: string | null
  leads: { full_name: string } | null
  properties: { title: string } | null
}

export default async function CalendarPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('viewings')
    .select('id, scheduled_at, status, lead_id, property_id, leads(full_name), properties(title)')
    .order('scheduled_at', { ascending: true })
    .returns<Row[]>()

  const events: CalendarEvent[] = (data ?? []).map((v) => ({
    id: v.id,
    type: 'viewing',
    scheduledAt: v.scheduled_at,
    title: v.leads?.full_name ?? 'Cliente',
    subtitle: v.properties?.title ?? 'Propiedad',
    leadId: v.lead_id,
    propertyId: v.property_id,
    status: v.status,
  }))

  return (
    <div className="mx-auto max-w-[1320px]">
      <CalendarShell events={events} />
    </div>
  )
}

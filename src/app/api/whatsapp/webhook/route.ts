import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import {
  extractPortalRefs,
  resolvePortalRefs,
  scrapeListing,
  fuzzyMatchProperty,
  deriveLeadName,
} from '@/lib/leads/inbound-parser'
import { processTaskEvent } from '@/lib/tasks/trigger-engine'
import { notifyLeadCreated } from '@/lib/notifications'
import { pickNextAgent } from '@/lib/automation/auto-assign'

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Meta verification handshake
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

type WhatsAppPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string }
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>
        messages?: Array<{
          id: string
          from: string
          timestamp: string
          type: string
          text?: { body: string }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
        }>
      }
    }>
  }>
}

export async function POST(request: NextRequest) {
  const supabase = serviceClient()

  let payload: WhatsAppPayload
  try {
    payload = (await request.json()) as WhatsAppPayload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Log raw event for debugging / replay
  await supabase.from('webhook_events').insert({
    provider: 'whatsapp_business',
    event_type: 'incoming',
    payload: payload as unknown as Json,
    received_at: new Date().toISOString(),
  })

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      if (!value) continue
      const phoneNumberId = value.metadata?.phone_number_id

      // Resolve brokerage by phone_number_id (lookup integrations.config)
      let brokerageId: string | null = null
      if (phoneNumberId) {
        const { data: integration } = await supabase
          .from('integrations')
          .select('brokerage_id, config')
          .eq('provider', 'whatsapp_business')
          .returns<
            Array<{
              brokerage_id: string
              config: { phone_number_id?: string } | null
            }>
          >()
        const match = integration?.find(
          (i) => i.config?.phone_number_id === phoneNumberId,
        )
        brokerageId = match?.brokerage_id ?? null
      }

      // Inbound messages
      for (const m of value.messages ?? []) {
        if (!brokerageId) continue
        const phone = m.from
        const body = m.text?.body ?? null
        const profileName = value.contacts?.find((c) => c.wa_id === phone)
          ?.profile?.name

        // 1) Match an existing lead by phone (fuzzy on last 8 digits)
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, property_id')
          .eq('brokerage_id', brokerageId)
          .ilike('phone', `%${phone.slice(-8)}%`)
          .limit(1)
          .maybeSingle<{ id: string; property_id: string | null }>()

        let leadId = existingLead?.id ?? null
        let leadCreated = false
        let matchedPropertyId = existingLead?.property_id ?? null

        // 2) Identify property of interest from any URL in the message
        if (body) {
          const refs = extractPortalRefs(body)
          if (refs.length > 0) {
            // Try direct match by property_publications.external_id
            const direct = await resolvePortalRefs(supabase, brokerageId, refs)
            if (direct.propertyId) {
              matchedPropertyId ??= direct.propertyId
            } else {
              // Fall back: scrape the first portal URL and fuzzy-match
              for (const ref of refs) {
                const scraped = await scrapeListing(ref.url)
                if (!scraped) continue
                const fuzzyId = await fuzzyMatchProperty(
                  supabase,
                  brokerageId,
                  scraped,
                )
                if (fuzzyId) {
                  matchedPropertyId ??= fuzzyId
                  break
                }
              }
            }
          }
        }

        // 3) Auto-create the lead if this phone is unknown to us
        if (!leadId) {
          const nextAgent = await pickNextAgent(brokerageId, supabase)
          const assignedAgentId = nextAgent?.id ?? null
          const fullName = profileName ?? deriveLeadName(body, phone)
          const { data: created } = await supabase
            .from('leads')
            .insert({
              brokerage_id: brokerageId,
              full_name: fullName,
              phone,
              origin: 'whatsapp',
              status: 'new',
              property_id: matchedPropertyId,
              assigned_agent_id: assignedAgentId,
              metadata: {
                source: 'whatsapp_webhook',
                first_message: body?.slice(0, 500) ?? null,
              } as Json,
            })
            .select('id')
            .single<{ id: string }>()
          if (created) {
            leadId = created.id
            leadCreated = true

            // Fire lead_created so the task engine queues Step 1 etc.
            processTaskEvent({
              event: 'lead_created',
              leadId,
              brokerageId,
              agentId: assignedAgentId ?? '',
              propertyId: matchedPropertyId ?? undefined,
            }).catch(() => {})

            notifyLeadCreated({
              leadId,
              leadName: fullName,
              brokerageId,
              agentId: assignedAgentId,
            }).catch(() => {})
          }
        } else if (
          existingLead &&
          !existingLead.property_id &&
          matchedPropertyId
        ) {
          // Lead existed but had no property — backfill it
          await supabase
            .from('leads')
            .update({ property_id: matchedPropertyId })
            .eq('id', leadId)
        }

        // 4) Always log the message + interaction
        await supabase.from('messages').insert({
          brokerage_id: brokerageId,
          lead_id: leadId,
          channel: 'whatsapp',
          direction: 'inbound',
          status: 'received',
          external_id: m.id,
          from_address: phone,
          body,
          metadata: {
            type: m.type,
            timestamp: m.timestamp,
            leadCreated,
            matchedPropertyId,
          } as Json,
        })

        if (leadId) {
          await supabase.from('lead_interactions').insert({
            lead_id: leadId,
            type: 'whatsapp_inbound',
            content: body ?? '(media)',
          })
        }
      }

      // Status updates
      for (const s of value.statuses ?? []) {
        const ts = new Date(parseInt(s.timestamp) * 1000).toISOString()
        const update: Database['public']['Tables']['messages']['Update'] = {
          status: s.status,
          ...(s.status === 'sent' && { sent_at: ts }),
          ...(s.status === 'delivered' && { delivered_at: ts }),
          ...(s.status === 'read' && { read_at: ts }),
          ...(s.status === 'failed' && { failed_at: ts }),
        }

        await supabase
          .from('messages')
          .update(update)
          .eq('channel', 'whatsapp')
          .eq('external_id', s.id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

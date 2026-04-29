import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LeadForm } from '@/components/app/lead-form'
import { LeadDeleteButton } from './delete-button'
import { AddInteractionForm } from './add-interaction-form'
import { updateLead } from '../actions'
import type { Database } from '@/lib/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type Interaction = Database['public']['Tables']['lead_interactions']['Row']

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('leads')
  const { id } = await params
  const supabase = await createClient()

  const [leadRes, propertiesRes, agentsRes, interactionsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle<Lead>(),
    supabase
      .from('properties')
      .select('id, title')
      .returns<Array<{ id: string; title: string }>>(),
    supabase
      .from('agents')
      .select('id, full_name')
      .returns<Array<{ id: string; full_name: string }>>(),
    supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .returns<Interaction[]>(),
  ])

  const lead = leadRes.data
  if (!lead) notFound()

  const updateWithId = updateLead.bind(null, id)

  const property = lead.property_id
    ? (propertiesRes.data ?? []).find((p) => p.id === lead.property_id)
    : null
  const assignedAgent = lead.assigned_agent_id
    ? (agentsRes.data ?? []).find((a) => a.id === lead.assigned_agent_id)
    : null

  const interactions = interactionsRes.data ?? []

  const dateLong = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('es-PA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/app/leads"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {t('title')}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-steel">
            [ {lead.id.slice(0, 8)} ]
          </p>
          <h1 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink">
            {lead.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-steel">
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1.5 hover:text-signal"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {lead.email}
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 font-mono hover:text-signal"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                {lead.phone}
              </a>
            )}
          </div>
        </div>
        <LeadDeleteButton id={lead.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col: form (edit inline) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[4px] border border-bone bg-paper p-6">
            <LeadForm
              action={updateWithId}
              submitLabel={t('save')}
              defaults={{
                full_name: lead.full_name,
                email: lead.email,
                phone: lead.phone,
                origin: lead.origin,
                status: lead.status ?? 'new',
                property_id: lead.property_id,
                assigned_agent_id: lead.assigned_agent_id,
                ai_score: lead.ai_score,
                notes: lead.notes,
              }}
              properties={propertiesRes.data ?? []}
              agents={agentsRes.data ?? []}
            />
          </div>

          {/* Interactions */}
          <div className="rounded-[4px] border border-bone bg-paper">
            <div className="border-b border-bone px-4 py-3">
              <h3 className="text-[16px] font-medium tracking-[-0.3px] text-ink">
                {t('interaction.title')}
                <span className="ml-2 font-mono text-[11px] tabular-nums text-steel">
                  {interactions.length}
                </span>
              </h3>
            </div>
            <div className="p-4">
              <AddInteractionForm leadId={lead.id} />
            </div>
            <div className="border-t border-bone">
              {interactions.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-steel">
                  {t('interaction.empty')}
                </p>
              ) : (
                <ul className="divide-y divide-bone">
                  {interactions.map((it) => (
                    <li key={it.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                          {t(`interaction.type.${it.type}`, { fallback: it.type })}
                        </span>
                        <span className="font-mono text-[11px] text-steel">
                          {dateLong(it.created_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-ink">
                        {it.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right col: meta */}
        <div className="space-y-4">
          <SideCell label={t('table.status')}>
            <span className="font-mono text-[12px] uppercase tracking-wider text-ink">
              {t(`status.${lead.status ?? 'new'}`)}
            </span>
          </SideCell>
          <SideCell label={t('table.origin')}>
            <span className="font-mono text-[12px] uppercase tracking-wider text-steel">
              {t(`origin.${lead.origin}`)}
            </span>
          </SideCell>
          <SideCell label="Score IA">
            <span className="font-mono text-[18px] font-medium tabular-nums text-signal">
              {lead.ai_score ?? '—'}
            </span>
          </SideCell>
          <SideCell label={t('table.property')}>
            {property ? (
              <Link
                href={`/app/properties/${property.id}`}
                className="text-[13px] font-medium text-ink hover:text-signal"
              >
                {property.title}
              </Link>
            ) : (
              <span className="text-[13px] text-steel">{t('form.noProperty')}</span>
            )}
          </SideCell>
          <SideCell label={t('form.assignedAgent')}>
            <span className="text-[13px] text-ink">
              {assignedAgent?.full_name ?? t('form.noAssignment')}
            </span>
          </SideCell>
          <SideCell label="Creado">
            <span className="font-mono text-[11px] text-steel">
              {dateLong(lead.created_at)}
            </span>
          </SideCell>
        </div>
      </div>
    </div>
  )
}

function SideCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[4px] border border-bone bg-paper p-3">
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

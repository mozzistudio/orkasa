-- Phase 4 — External integrations: messaging + calendar
-- Run in Supabase Dashboard SQL editor, then regenerate types.

-- ─── New integration providers ────────────────────────────────────────
do $$ begin
  alter type integration_provider add value if not exists 'google_calendar';
  alter type integration_provider add value if not exists 'outlook_calendar';
  alter type integration_provider add value if not exists 'resend';
  alter type integration_provider add value if not exists 'sendgrid';
exception when others then null;
end $$;

-- ─── Messages table (unified inbound/outbound across channels) ────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  brokerage_id    uuid not null references public.brokerages(id) on delete cascade,
  lead_id         uuid references public.leads(id) on delete cascade,
  agent_id        uuid references public.agents(id) on delete set null,
  channel         text not null check (channel in ('whatsapp','email','sms','internal')),
  direction       text not null check (direction in ('inbound','outbound')),
  status          text not null default 'pending' check (status in ('pending','sent','delivered','read','failed','received')),
  -- Identifiers
  external_id     text,
  thread_id       text,
  from_address    text,
  to_address      text,
  -- Content
  subject         text,
  body            text,
  template_code   text,
  attachments     jsonb not null default '[]',
  metadata        jsonb not null default '{}',
  -- Errors
  error_code      text,
  error_message   text,
  -- Timestamps
  sent_at         timestamptz,
  delivered_at    timestamptz,
  read_at         timestamptz,
  failed_at       timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_lead_created_idx
  on public.messages (lead_id, created_at desc);
create index if not exists messages_brokerage_created_idx
  on public.messages (brokerage_id, created_at desc);
create index if not exists messages_channel_status_idx
  on public.messages (brokerage_id, channel, status);
create index if not exists messages_external_idx
  on public.messages (channel, external_id) where external_id is not null;

alter table public.messages enable row level security;

create policy "Agents see brokerage messages"
  on public.messages for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

create policy "Agents insert brokerage messages"
  on public.messages for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

create policy "Agents update brokerage messages"
  on public.messages for update using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

alter publication supabase_realtime add table public.messages;

-- ─── Calendar sync metadata on viewings ───────────────────────────────
alter table public.viewings
  add column if not exists external_calendar_id text,
  add column if not exists external_event_id   text,
  add column if not exists last_synced_at      timestamptz;

create index if not exists viewings_external_event_idx
  on public.viewings (external_calendar_id, external_event_id)
  where external_event_id is not null;

-- ─── Webhook event log (for debugging + replay) ───────────────────────
create table if not exists public.webhook_events (
  id              uuid primary key default gen_random_uuid(),
  brokerage_id    uuid references public.brokerages(id) on delete cascade,
  provider        text not null,
  event_type      text,
  external_id     text,
  payload         jsonb not null,
  signature_valid boolean,
  processed_at    timestamptz,
  error           text,
  received_at     timestamptz not null default now()
);

create index if not exists webhook_events_provider_received_idx
  on public.webhook_events (provider, received_at desc);

alter table public.webhook_events enable row level security;

-- Webhooks are processed by service role; agents can view their brokerage history
create policy "Agents view brokerage webhook events"
  on public.webhook_events for select using (
    brokerage_id is null
    or brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

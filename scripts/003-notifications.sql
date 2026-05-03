-- Notifications schema
-- Run in Supabase Dashboard SQL editor, then regenerate types:
--   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

-- ─── Notifications ───────────────────────────────────────────────────
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  brokerage_id  uuid not null references public.brokerages(id) on delete cascade,
  agent_id      uuid references public.agents(id) on delete cascade,
  type          text not null,
  -- task_created | task_escalated | task_due_soon
  -- lead_new | lead_assigned | lead_status_changed
  -- offer_received | offer_accepted | offer_rejected | offer_countered
  -- viewing_scheduled | viewing_reminder
  -- deal_created | deal_stage_changed | deal_won | deal_lost
  -- doc_uploaded
  title         text not null,
  body          text,
  entity_type   text,
  -- task | lead | offer | viewing | deal | property
  entity_id     uuid,
  metadata      jsonb not null default '{}',
  is_read       boolean not null default false,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index notifications_agent_unread_idx
  on public.notifications (agent_id, is_read)
  where is_read = false;

create index notifications_agent_created_idx
  on public.notifications (agent_id, created_at desc);

create index notifications_brokerage_idx
  on public.notifications (brokerage_id);

alter table public.notifications enable row level security;

-- Agents only see their own notifications (or brokerage-wide notifications when agent_id is null)
create policy "Agents see own notifications"
  on public.notifications for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
    and (agent_id = auth.uid() or agent_id is null)
  );

-- Authenticated users can insert into their brokerage (for triggers / server actions running with user context)
create policy "Agents insert own brokerage notifications"
  on public.notifications for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

-- Agents can mark their own notifications as read
create policy "Agents update own notifications"
  on public.notifications for update using (
    agent_id = auth.uid()
  );

-- Realtime publication
alter publication supabase_realtime add table public.notifications;

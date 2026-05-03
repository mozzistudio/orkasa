-- Task Engine Schema
-- Run in Supabase Dashboard SQL editor, then regenerate types:
--   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

-- ─── Deals ───────────────────────────────────────────────────────────
create table public.deals (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads(id) on delete cascade,
  property_id  uuid references public.properties(id) on delete set null,
  brokerage_id uuid not null references public.brokerages(id) on delete cascade,
  agent_id     uuid references public.agents(id) on delete set null,
  amount       numeric,
  currency     text not null default 'USD',
  stage        text not null default 'oferta_verbal',
  closed_at    timestamptz,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index deals_lead_idx on public.deals (lead_id);
create index deals_brokerage_idx on public.deals (brokerage_id);

alter table public.deals enable row level security;
create policy "Agents see own brokerage deals"
  on public.deals for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents insert own brokerage deals"
  on public.deals for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents update own brokerage deals"
  on public.deals for update using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

-- ─── Offers ──────────────────────────────────────────────────────────
create table public.offers (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid references public.deals(id) on delete set null,
  lead_id      uuid not null references public.leads(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  brokerage_id uuid not null references public.brokerages(id) on delete cascade,
  agent_id     uuid references public.agents(id) on delete set null,
  amount       numeric not null,
  currency     text not null default 'USD',
  status       text not null default 'pending',
  conditions   text,
  notes        text,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index offers_lead_idx on public.offers (lead_id);
create index offers_deal_idx on public.offers (deal_id);
create index offers_brokerage_idx on public.offers (brokerage_id);

alter table public.offers enable row level security;
create policy "Agents see own brokerage offers"
  on public.offers for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents insert own brokerage offers"
  on public.offers for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents update own brokerage offers"
  on public.offers for update using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

-- ─── Lead-Properties ─────────────────────────────────────────────────
create table public.lead_properties (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  brokerage_id uuid not null references public.brokerages(id) on delete cascade,
  role         text not null default 'sugerida',
  status       text not null default 'pendiente',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index lead_properties_dedup_idx
  on public.lead_properties (lead_id, property_id);
create index lead_properties_brokerage_idx on public.lead_properties (brokerage_id);

alter table public.lead_properties enable row level security;
create policy "Agents see own brokerage lead_properties"
  on public.lead_properties for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents insert own brokerage lead_properties"
  on public.lead_properties for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents update own brokerage lead_properties"
  on public.lead_properties for update using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

-- ─── Tasks ───────────────────────────────────────────────────────────
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  brokerage_id     uuid not null references public.brokerages(id) on delete cascade,
  agent_id         uuid references public.agents(id) on delete set null,
  deal_id          uuid references public.deals(id) on delete set null,
  step_number      smallint not null,
  phase            text not null,
  title            text not null,
  description      text,
  cta_action       text not null,
  cta_metadata     jsonb not null default '{}',
  due_at           timestamptz,
  escalation_at    timestamptz,
  auto_complete_on text,
  status           text not null default 'open',
  completed_at     timestamptz,
  completed_by     uuid references public.agents(id),
  trigger_reason   jsonb not null default '{}',
  property_id      uuid references public.properties(id) on delete set null,
  offer_id         uuid references public.offers(id) on delete set null,
  viewing_id       uuid references public.viewings(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index tasks_dedup_idx
  on public.tasks (lead_id, step_number)
  where status = 'open';
create index tasks_agent_open_idx
  on public.tasks (agent_id, status)
  where status = 'open';
create index tasks_due_idx
  on public.tasks (due_at)
  where status = 'open';
create index tasks_escalation_idx
  on public.tasks (escalation_at)
  where status = 'open';
create index tasks_brokerage_idx
  on public.tasks (brokerage_id, status);

alter table public.tasks enable row level security;
create policy "Agents see own brokerage tasks"
  on public.tasks for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents insert own brokerage tasks"
  on public.tasks for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents update own brokerage tasks"
  on public.tasks for update using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

-- ─── Task Audit Log ──────────────────────────────────────────────────
create table public.task_audit_log (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  brokerage_id uuid not null references public.brokerages(id) on delete cascade,
  agent_id     uuid references public.agents(id),
  action       text not null,
  details      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index task_audit_log_task_idx on public.task_audit_log (task_id);
create index task_audit_log_brokerage_idx on public.task_audit_log (brokerage_id);

alter table public.task_audit_log enable row level security;
create policy "Agents see own brokerage task audit"
  on public.task_audit_log for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents insert own brokerage task audit"
  on public.task_audit_log for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

-- Service Providers Schema
-- Stores broker's network of external service providers (notario, abogado, banco, etc.)
-- Used to populate WhatsApp CTAs and document templates for tasks like
-- "Notificar abogado para promesa", "Solicitar tasación", etc.
--
-- Run in Supabase Dashboard SQL editor, then regenerate types:
--   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

-- ─── Providers ───────────────────────────────────────────────────────
create table public.providers (
  id              uuid primary key default gen_random_uuid(),
  brokerage_id    uuid not null references public.brokerages(id) on delete cascade,
  service_type    text not null check (service_type in (
                    'notario',
                    'abogado',
                    'banco',
                    'tasador',
                    'inspector',
                    'topografo',
                    'registro_publico',
                    'aseguradora',
                    'contador',
                    'otro'
                  )),
  name            text not null,
  company         text,
  phone           text,
  email           text,
  tax_id          text,
  license_number  text,
  address         text,
  city            text,
  notes           text,
  metadata        jsonb not null default '{}',
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index providers_brokerage_idx       on public.providers (brokerage_id);
create index providers_brokerage_type_idx  on public.providers (brokerage_id, service_type);

-- Only one primary per (brokerage, service_type)
create unique index providers_one_primary_per_type_idx
  on public.providers (brokerage_id, service_type)
  where is_primary;

alter table public.providers enable row level security;

create policy "Agents see own brokerage providers"
  on public.providers for select using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents insert own brokerage providers"
  on public.providers for insert with check (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents update own brokerage providers"
  on public.providers for update using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );
create policy "Agents delete own brokerage providers"
  on public.providers for delete using (
    brokerage_id in (select brokerage_id from public.agents where id = auth.uid())
  );

-- updated_at trigger
create or replace function public.providers_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.providers_set_updated_at();

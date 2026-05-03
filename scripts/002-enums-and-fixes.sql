-- Phase 1 — Enum enforcement + cascade fixes
-- Run in Supabase Dashboard SQL editor, then regenerate types:
--   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

-- ─── Deal Stage Enum ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE deal_stage AS ENUM (
    'contacto_inicial',
    'visitas',
    'negociacion',
    'promesa_firmada',
    'tramite_bancario',
    'escritura_publica',
    'entrega_llaves',
    'post_cierre',
    'closed_won',
    'closed_lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.deals
  ALTER COLUMN stage DROP DEFAULT;
ALTER TABLE public.deals
  ALTER COLUMN stage TYPE deal_stage USING stage::deal_stage;
ALTER TABLE public.deals
  ALTER COLUMN stage SET DEFAULT 'contacto_inicial';

-- ─── Offer Status Enum ───────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM (
    'draft',
    'submitted',
    'countered',
    'accepted',
    'rejected',
    'expired',
    'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.offers
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.offers
  ALTER COLUMN status TYPE offer_status USING status::offer_status;
ALTER TABLE public.offers
  ALTER COLUMN status SET DEFAULT 'draft';

-- ─── Viewing Status Enum ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE viewing_status AS ENUM (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.viewings
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.viewings
  ALTER COLUMN status TYPE viewing_status USING status::viewing_status;
ALTER TABLE public.viewings
  ALTER COLUMN status SET DEFAULT 'scheduled';

-- ─── Lead-Property Enums ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE lead_property_role AS ENUM (
    'sugerida',
    'interesada',
    'visitada',
    'ofertada'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_property_status AS ENUM (
    'pendiente',
    'le_encanto',
    'descartada',
    'oferta_hecha'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.lead_properties
  ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.lead_properties
  ALTER COLUMN role TYPE lead_property_role USING role::lead_property_role;
ALTER TABLE public.lead_properties
  ALTER COLUMN role SET DEFAULT 'sugerida';

ALTER TABLE public.lead_properties
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.lead_properties
  ALTER COLUMN status TYPE lead_property_status USING status::lead_property_status;
ALTER TABLE public.lead_properties
  ALTER COLUMN status SET DEFAULT 'pendiente';

-- ─── Cascade Fixes ───────────────────────────────────────────────────
ALTER TABLE public.task_audit_log
  DROP CONSTRAINT IF EXISTS task_audit_log_agent_id_fkey;

ALTER TABLE public.task_audit_log
  ADD CONSTRAINT task_audit_log_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_completed_by_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_completed_by_fkey
  FOREIGN KEY (completed_by) REFERENCES public.agents(id) ON DELETE SET NULL;

-- ════════════════════════════════════════════════════════════════════
-- REGISTRE ÉLECTRONIQUE DES MANDATS — Casa Caraïbes
-- Conforme Loi Hoguet n°70-9 + Décret n°72-678
--
-- Modifications :
--   1. Séquence PostgreSQL irréversible pour numérotation légale
--   2. Colonnes : numero_registre, date_enregistrement, regularisation
--   3. Trigger auto-assignation à l'insertion
--   4. Backfill des mandats existants (régularisation)
--   5. Table mandate_audit_log (traçabilité légale)
--   6. Trigger audit sur INSERT/UPDATE
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Séquence de numérotation ──────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS mandate_registry_seq
  START 1
  INCREMENT 1
  NO CYCLE;

-- ── 2. Colonnes registre sur la table mandats ────────────────────────
ALTER TABLE public.mandats
  ADD COLUMN IF NOT EXISTS numero_registre   INTEGER,
  ADD COLUMN IF NOT EXISTS date_enregistrement TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS regularisation    BOOLEAN DEFAULT FALSE;

-- ── 3. Backfill des mandats existants (régularisation) ───────────────
-- On numérote chronologiquement par date_debut puis created_at.
-- Tous les mandats antérieurs sont marqués "regularisation = true".
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(date_debut, created_at::date) ASC,
               created_at ASC
    ) AS rn
  FROM public.mandats
  WHERE numero_registre IS NULL
)
UPDATE public.mandats AS m
SET
  numero_registre    = o.rn,
  date_enregistrement = NOW(),
  regularisation     = TRUE
FROM ordered o
WHERE m.id = o.id;

-- Avancer la séquence pour que les prochains numéros suivent le max actuel
SELECT setval(
  'mandate_registry_seq',
  COALESCE((SELECT MAX(numero_registre) FROM public.mandats), 0) + 1,
  false -- "false" = la prochaine valeur sera exactement ce nombre
);

-- Contraintes d'intégrité
ALTER TABLE public.mandats
  ALTER COLUMN numero_registre SET NOT NULL,
  ALTER COLUMN date_enregistrement SET NOT NULL;

ALTER TABLE public.mandats
  DROP CONSTRAINT IF EXISTS mandats_numero_registre_unique,
  ADD CONSTRAINT mandats_numero_registre_unique UNIQUE (numero_registre);

-- ── 4. Trigger : auto-assignation à chaque INSERT ────────────────────
CREATE OR REPLACE FUNCTION public.assign_mandate_registry_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero_registre IS NULL THEN
    NEW.numero_registre := nextval('mandate_registry_seq');
  END IF;
  IF NEW.date_enregistrement IS NULL THEN
    NEW.date_enregistrement := NOW();
  END IF;
  IF NEW.regularisation IS NULL THEN
    NEW.regularisation := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mandate_registry_trigger ON public.mandats;
CREATE TRIGGER mandate_registry_trigger
  BEFORE INSERT ON public.mandats
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_mandate_registry_number();

-- ── 5. Table audit log (traçabilité légale) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.mandate_audit_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mandat_id        TEXT        NOT NULL,
  numero_registre  INTEGER,
  action           TEXT        NOT NULL, -- 'created' | 'updated' | 'closed'
  old_values       JSONB,
  new_values       JSONB,
  agent_id         TEXT,
  timestamp        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS audit log : lecture directeur seulement, insertion par trigger
ALTER TABLE public.mandate_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select ON public.mandate_audit_log;
CREATE POLICY audit_log_select ON public.mandate_audit_log
  FOR SELECT USING (public.is_directeur());

DROP POLICY IF EXISTS audit_log_insert ON public.mandate_audit_log;
CREATE POLICY audit_log_insert ON public.mandate_audit_log
  FOR INSERT WITH CHECK (TRUE);

-- ── 6. Trigger audit sur INSERT/UPDATE mandats ───────────────────────
CREATE OR REPLACE FUNCTION public.log_mandate_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.mandate_audit_log
      (mandat_id, numero_registre, action, new_values, agent_id)
    VALUES
      (NEW.id::text, NEW.numero_registre, 'created', to_jsonb(NEW), NEW.agent_id);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.mandate_audit_log
      (mandat_id, numero_registre, action, old_values, new_values, agent_id)
    VALUES
      (OLD.id::text, OLD.numero_registre, 'updated', to_jsonb(OLD), to_jsonb(NEW), NEW.agent_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mandate_audit_trigger ON public.mandats;
CREATE TRIGGER mandate_audit_trigger
  AFTER INSERT OR UPDATE ON public.mandats
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mandate_change();

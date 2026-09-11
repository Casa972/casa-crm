-- ════════════════════════════════════════════════════════════════════
-- ÉTAPE 1 — Sortir baux & valeurs locatives du navigateur
-- À coller dans Supabase → SQL Editor → Run
-- Sans cette étape, la sauvegarde des baux / valeurs locatives échoue.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.baux (
  id            text primary key,
  agent_id      text,
  statut        text default 'Brouillon',
  type_bail     text,
  numero        text,
  commune       text,
  adresse_bien  text,
  date_debut    text,
  date_fin      text,
  loyer_hc      numeric default 0,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists baux_agent_id_idx on public.baux (agent_id);
create index if not exists baux_updated_at_idx on public.baux (updated_at desc);

grant all on public.baux to anon, authenticated;

create table if not exists public.valeurs_locatives (
  id               text primary key,
  agent_id         text,
  statut           text default 'Brouillon',
  titre_bien       text,
  regime_locatif   text,
  commune          text,
  mandant_nom      text,
  loyer_mensuel_hc numeric default 0,
  payload          jsonb not null default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists valeurs_locatives_agent_id_idx on public.valeurs_locatives (agent_id);
create index if not exists valeurs_locatives_updated_at_idx on public.valeurs_locatives (updated_at desc);

grant all on public.valeurs_locatives to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- TABLES : rdv, taches, activites — Casa Caraïbes
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── AGENDA ──────────────────────────────────────────────────────────
create table if not exists public.rdv (
  id          text primary key,
  agent_id    text,
  titre       text not null,
  client_id   text,
  bien_ref    text,
  date        text not null,
  heure_debut text not null default '09:00',
  heure_fin   text not null default '10:00',
  type_rdv    text not null default 'Autre',
  notes       text,
  statut      text not null default 'Planifié',
  created_at  timestamptz default now()
);

grant all on public.rdv to anon, authenticated;

-- ── TÂCHES ──────────────────────────────────────────────────────────
create table if not exists public.taches (
  id             text primary key,
  agent_id       text,
  texte          text not null,
  done           boolean not null default false,
  priorite       text not null default 'Normale',
  date_echeance  text,
  created_at     timestamptz default now()
);

grant all on public.taches to anon, authenticated;

-- ── ACTIVITÉS ───────────────────────────────────────────────────────
create table if not exists public.activites (
  id             text primary key,
  client_id      text not null,
  agent_id       text,
  type_activite  text not null default 'Note',
  note           text not null,
  date           text not null,
  created_at     timestamptz default now()
);

grant all on public.activites to anon, authenticated;

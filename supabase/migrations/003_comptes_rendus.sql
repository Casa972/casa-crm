-- ═══════════════════════════════════════════════
-- TABLE COMPTES RENDUS DE VISITE
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════
create table if not exists public.comptes_rendus (
  id                text primary key,
  agent_id          text,
  date              text,
  heure_debut       text,
  heure_fin         text,
  redacteur         text default 'M. Luc CLEMENTE',
  bien_ref          text,
  bien_adresse      text,
  bien_commune      text,
  bien_type         text,
  bien_surface      numeric default 0,
  bien_prix         numeric default 0,
  proprietaire_nom  text,
  proprietaire_tel  text,
  client_id         text,
  visiteur_nom      text,
  visiteur_tel      text,
  visiteur_email    text,
  nb_personnes      integer default 1,
  points_positifs   text,
  points_negatifs   text,
  avis_client       text,
  budget_client     numeric default 0,
  financement       text,
  delai_achat       text,
  suite_donner      text,
  date_relance      text,
  observations      text,
  statut            text default 'Brouillon',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

grant all on public.comptes_rendus to anon, authenticated;

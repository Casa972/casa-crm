-- Compromis : interagence en colonnes (plus dans les notes)
alter table public.compromis
  add column if not exists origine text not null default 'Maison',
  add column if not exists agence_partenaire text,
  add column if not exists pct_agence integer not null default 100,
  add column if not exists commune text;

comment on column public.compromis.pct_agence is 'Part Casa Caraïbes de la commission, 0-100. 100 si dossier maison.';

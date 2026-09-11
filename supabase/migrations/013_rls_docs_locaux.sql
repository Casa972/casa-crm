-- À coller dans Supabase → SQL Editor → Run
-- Sans ça, RLS bloque les baux (toasts « Migration impossible »).

alter table if exists public.baux disable row level security;
alter table if exists public.valeurs_locatives disable row level security;

grant all on public.baux to anon, authenticated;
grant all on public.valeurs_locatives to anon, authenticated;

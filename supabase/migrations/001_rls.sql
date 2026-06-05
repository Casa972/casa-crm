-- ════════════════════════════════════════════════════════════════════
-- SÉCURITÉ RLS — Casa Caraïbes
-- À exécuter dans Supabase SQL Editor. Remplace l'ancien "disable RLS".
--
-- Modèle : chaque agent ne voit/modifie que SES lignes (agent_id = auth.uid()).
-- Le directeur voit tout. Les biens/mandats/compromis/revenus sont partagés
-- en lecture pour toute l'agence, mais l'écriture reste tracée par agent.
--
-- Prérequis : migrer les USERS codés en dur vers Supabase Auth, et stocker
-- le rôle dans app_metadata.role ('directeur' | 'agent').
-- ════════════════════════════════════════════════════════════════════

-- Helper : l'utilisateur courant est-il directeur ?
create or replace function public.is_directeur()
returns boolean
language sql stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'directeur',
    false
  );
$$;

-- Activer RLS partout
alter table public.biens     enable row level security;
alter table public.mandats   enable row level security;
alter table public.compromis enable row level security;
alter table public.clients   enable row level security;
alter table public.revenus   enable row level security;

-- ── CLIENTS : strictement cloisonnés par agent (le directeur voit tout) ──
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select
  using (is_directeur() or agent_id = auth.uid()::text);

drop policy if exists clients_write on public.clients;
create policy clients_write on public.clients for all
  using  (is_directeur() or agent_id = auth.uid()::text)
  with check (is_directeur() or agent_id = auth.uid()::text);

-- ── BIENS / MANDATS / COMPROMIS / REVENUS ──
-- Lecture partagée (catalogue d'agence) ; écriture tracée par agent.
do $$
declare t text;
begin
  foreach t in array array['biens','mandats','compromis','revenus'] loop
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format(
      'create policy %I_select on public.%I for select using (auth.role() = ''authenticated'');', t, t);

    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format(
      'create policy %I_write on public.%I for all
         using (is_directeur() or agent_id = auth.uid()::text or agent_id is null)
         with check (is_directeur() or agent_id = auth.uid()::text or agent_id is null);',
      t, t);
  end loop;
end $$;

-- NB : retirer les anciens "grant all" + "disable row level security".
-- Avec RLS actif, l'accès se fait UNIQUEMENT via les policies ci-dessus.

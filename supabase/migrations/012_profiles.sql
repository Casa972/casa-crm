-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 2 — Comptes réels (Supabase Auth + profils)
-- 1. Authentication → Providers → Email : Confirm email = OFF
-- 2. Authentication → Users → Add user (3 fois) :
--      luc@casacaraibes.com      rôle directeur
--      noham@casacaraibes.com    rôle agent
--      steeve@casacaraibes.com   rôle agent
--    Cocher "Auto Confirm User". Choisir un mot de passe fort.
-- 3. Coller ce script → Run
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.is_directeur()
returns boolean
language sql stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'directeur',
    false
  );
$$;

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  name       text not null,
  role       text not null check (role in ('directeur', 'agent')),
  label      text not null default 'Agent commercial',
  legacy_id  text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_legacy_id_idx on public.profiles (legacy_id);

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  using (id = auth.uid() or public.is_directeur());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

grant select, update on public.profiles to authenticated;
grant select on public.profiles to anon;

create or replace function public.sync_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
       || jsonb_build_object('role', new.role)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_role on public.profiles;
create trigger trg_sync_profile_role
  after insert or update of role on public.profiles
  for each row execute procedure public.sync_profile_role();

insert into public.profiles (id, email, name, role, label, legacy_id)
select u.id, lower(u.email), v.name, v.role, v.label, v.legacy_id
from auth.users u
join (
  values
    ('luc@casacaraibes.com',    'Luc',    'directeur', 'Directeur',          'dir'),
    ('noham@casacaraibes.com',  'Noham',  'agent',     'Agent commercial',   'noham'),
    ('steeve@casacaraibes.com', 'Steeve', 'agent',     'Agent commercial',   'steeve')
) as v(email, name, role, label, legacy_id)
  on lower(u.email) = v.email
on conflict (id) do update
  set email     = excluded.email,
      name      = excluded.name,
      role      = excluded.role,
      label     = excluded.label,
      legacy_id = excluded.legacy_id,
      updated_at = now();

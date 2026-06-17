-- ════════════════════════════════════════════════════════════════════
-- BIBLIOTHÈQUE DE DOCUMENTS — Casa Caraïbes
-- Table documents + policies Storage
-- ════════════════════════════════════════════════════════════════════

-- Table documents (métadonnées)
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  agent_id     text not null,
  type_doc     text not null check (type_doc in ('mandat', 'compromis')),
  nom          text not null,
  numero       text,
  parties      text,
  bien         text,
  storage_path text not null,
  taille       integer,
  created_at   timestamptz default now()
);

alter table public.documents enable row level security;

-- Agents voient leurs propres documents, le directeur voit tout
create policy "documents_select"
  on public.documents for select
  using (agent_id = auth.uid()::text or is_directeur());

create policy "documents_insert"
  on public.documents for insert
  with check (agent_id = auth.uid()::text);

create policy "documents_delete"
  on public.documents for delete
  using (agent_id = auth.uid()::text or is_directeur());

-- ── Supabase Storage — bucket "documents" ──────────────────────────
-- Le bucket est créé programmatiquement au premier usage (voir documents.service.ts).
-- Les policies ci-dessous s'appliquent une fois le bucket créé.

-- Lecture : utilisateurs authentifiés uniquement
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

create policy "storage_documents_select"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_directeur()
    )
  );

create policy "storage_documents_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_documents_delete"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_directeur()
    )
  );

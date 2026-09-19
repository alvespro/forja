-- Busca full-text nas anotações (português, sem acento).
create extension if not exists unaccent with schema extensions;
create or replace function public.study_notes_tsv(titulo text, conteudo text, tags text[])
returns tsvector language sql immutable set search_path = '' as $$
  select setweight(to_tsvector('portuguese'::regconfig, extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(titulo,''))), 'A')
      || setweight(to_tsvector('portuguese'::regconfig, extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(array_to_string(tags,' '),''))), 'B')
      || setweight(to_tsvector('portuguese'::regconfig, extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(conteudo,''))), 'C')
$$;
alter table public.study_notes add column if not exists busca tsvector
  generated always as (public.study_notes_tsv(titulo, conteudo, tags)) stored;
create index if not exists study_notes_busca_idx on public.study_notes using gin (busca);
create index if not exists flashcards_revisao_idx on public.flashcards (user_id, proxima_revisao);
create index if not exists flashcards_fonte_idx on public.flashcards (fonte_tipo, fonte_id);

-- Bucket privado para EPUBs (50 MB), pasta = user_id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('epubs', 'epubs', false, 52428800, array['application/epub+zip','application/octet-stream','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 52428800;

create policy "epubs_own_select" on storage.objects for select to authenticated
  using (bucket_id = 'epubs' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "epubs_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'epubs' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "epubs_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'epubs' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "epubs_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'epubs' and (select auth.uid())::text = (storage.foldername(name))[1]);

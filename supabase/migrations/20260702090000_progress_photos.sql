-- Fotos de progresso corporal: antes/depois com snapshot de contexto
-- (peso na data) e relatório gerado por IA.

create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null default current_date,
  storage_path text not null,
  tipo text default 'frente' check (tipo in ('frente', 'costas', 'lado')),
  peso_kg numeric,
  notas text,
  relatorio_ia text,
  created_at timestamptz not null default now()
);

create index if not exists progress_photos_user_data on progress_photos (user_id, data desc);

alter table progress_photos enable row level security;

create policy "progress_photos_select_own" on progress_photos
  for select using (auth.uid() = user_id);
create policy "progress_photos_insert_own" on progress_photos
  for insert with check (auth.uid() = user_id);
create policy "progress_photos_update_own" on progress_photos
  for update using (auth.uid() = user_id);
create policy "progress_photos_delete_own" on progress_photos
  for delete using (auth.uid() = user_id);

-- Bucket privado; cada usuário só acessa a própria pasta (primeiro segmento = uid)
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress_photos_storage_select" on storage.objects
  for select using (
    bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "progress_photos_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "progress_photos_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

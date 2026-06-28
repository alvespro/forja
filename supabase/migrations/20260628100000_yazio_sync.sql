-- FORJA — integração Yazio: log de sincronização + agendamento diário.

create table yazio_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null,
  status text not null check (status in ('sucesso', 'erro')),
  registros_importados int not null default 0,
  erro text,
  created_at timestamptz default now()
);

create index on yazio_sync_logs (user_id, created_at desc);

alter table yazio_sync_logs enable row level security;
create policy "own_select" on yazio_sync_logs for select using (auth.uid() = user_id);
create policy "own_insert" on yazio_sync_logs for insert with check (auth.uid() = user_id);
create policy "own_update" on yazio_sync_logs for update using (auth.uid() = user_id);
create policy "own_delete" on yazio_sync_logs for delete using (auth.uid() = user_id);

-- Agendamento do sync diário fica fora desta migration (não é seguro cravar nenhuma chave em
-- arquivo versionado). Ver supabase/functions/sync-yazio/README.md para o passo a passo de
-- configurar o Cron Job pelo painel do Supabase (Integrations → Cron Jobs).
create extension if not exists pg_cron;
create extension if not exists pg_net;

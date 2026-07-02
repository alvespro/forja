-- Fase 4 — Gamificação: score diário persistido.
-- O cliente faz upsert do placar do dia; streak, XP e conquistas derivam daqui.

create table if not exists daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null,
  pontos int not null default 0,
  total int not null default 0,
  bonus int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

alter table daily_scores enable row level security;

create policy "daily_scores_select_own" on daily_scores
  for select using (auth.uid() = user_id);

create policy "daily_scores_insert_own" on daily_scores
  for insert with check (auth.uid() = user_id);

create policy "daily_scores_update_own" on daily_scores
  for update using (auth.uid() = user_id);

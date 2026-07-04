-- Conquistas persistidas com earned_at. Antes eram derivadas da janela móvel
-- de scores: saíam da janela e "desconquistavam" silenciosamente. Uma vez
-- desbloqueada, a conquista é definitiva.
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table achievements enable row level security;

create policy "achievements_select_own" on achievements
  for select using (auth.uid() = user_id);
create policy "achievements_insert_own" on achievements
  for insert with check (auth.uid() = user_id);

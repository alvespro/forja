-- Calendário de atividades (para o contribution graph)
create table if not exists activity_calendar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null,
  treino boolean default false,
  cardio boolean default false,
  habitos_pct int default 0,
  refeicoes_pct int default 0,
  score int default 0,
  unique (user_id, data)
);

alter table activity_calendar enable row level security;

drop policy if exists "own_select" on activity_calendar;
drop policy if exists "own_insert" on activity_calendar;
drop policy if exists "own_update" on activity_calendar;
drop policy if exists "own_delete" on activity_calendar;

-- auth.uid() embrulhado em subselect: avaliado 1x por query (advisor 0003), não por linha.
-- O unique (user_id, data) já cobre a FK user_id (coluna líder), dispensando índice extra.
create policy "own_select" on activity_calendar for select using ((select auth.uid()) = user_id);
create policy "own_insert" on activity_calendar for insert with check ((select auth.uid()) = user_id);
create policy "own_update" on activity_calendar for update using ((select auth.uid()) = user_id);
create policy "own_delete" on activity_calendar for delete using ((select auth.uid()) = user_id);

-- Onboarding status
alter table profiles
  add column if not exists onboarding_completo boolean default false,
  add column if not exists onboarding_step int default 0;

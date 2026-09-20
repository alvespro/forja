-- Preferências do Ritmo do Dia. Somente os quatro sinais úteis são elegíveis:
-- treino, alimentação, agenda e prioridade (sapo do dia).
create table if not exists public.daily_rhythm_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  interval_minutes smallint not null default 180 check (interval_minutes between 60 and 720 and interval_minutes % 15 = 0),
  start_time time not null default '08:00',
  end_time time not null default '22:00',
  active_days smallint[] not null default array[1,2,3,4,5,6,7]
    check (cardinality(active_days) between 1 and 7 and active_days <@ array[1,2,3,4,5,6,7]::smallint[]),
  notify_workout boolean not null default true,
  notify_meals boolean not null default true,
  notify_calendar boolean not null default true,
  notify_priority boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.daily_rhythm_preferences enable row level security;
create policy "daily_rhythm_preferences_select_own" on public.daily_rhythm_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_rhythm_preferences_insert_own" on public.daily_rhythm_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily_rhythm_preferences_update_own" on public.daily_rhythm_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Executa no quarto de hora. A função filtra a janela e intervalo de cada usuário.
select cron.unschedule(jobid) from cron.job where jobname = 'daily-rhythm-reminders-15min';
select cron.schedule('daily-rhythm-reminders-15min', '*/15 * * * *', $$select private.invocar_funcao_agendada('daily-rhythm-reminders')$$);

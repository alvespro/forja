-- Apple Health sync: atividade diária, sono e importações avulsas.
-- Alimentadas pela edge function apple-health-sync (Shortcut do iPhone).

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null,
  fc_repouso int,
  vo2max numeric,
  passos int,
  calorias_ativas int,
  calorias_totais int,
  distancia_km numeric,
  minutos_em_pe int,
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null,
  hora_dormir text,
  hora_acordar text,
  duracao_min int,
  sono_profundo_min int,
  sono_rem_min int,
  sono_leve_min int,
  acordou_vezes int,
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

create table if not exists apple_health_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null,
  tipo text not null,
  valor numeric,
  created_at timestamptz not null default now()
);

create index if not exists apple_health_imports_user_data
  on apple_health_imports (user_id, data desc, tipo);

alter table activity_logs enable row level security;
alter table sleep_logs enable row level security;
alter table apple_health_imports enable row level security;

create policy "activity_logs_own" on activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sleep_logs_own" on sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "apple_health_imports_own" on apple_health_imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

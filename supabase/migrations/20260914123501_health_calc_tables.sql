-- Health Calculator API (14/09/2026): tabelas de cálculos derivados, score de
-- recuperação e sono manual. Criadas antes direto no banco, sem migration;
-- este arquivo as versiona de forma idempotente e remove o último resquício
-- do Apple Health (valor 'apple_health_futuro' em sleep_logs.fonte).

create table if not exists health_metrics_derived (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tipo text not null,                    -- homa_ir | cholesterol_ratio | recomp_forecast | karvonen_zones
  valor numeric,
  interpretacao text,
  risco text check (risco in ('baixo', 'intermediario', 'alto', 'critico')),
  dados_input jsonb,
  dados_output jsonb,
  calculado_em timestamptz default now()
);
create index if not exists idx_health_derived_user_tipo
  on health_metrics_derived (user_id, tipo, calculado_em desc);

create table if not exists recovery_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null default current_date,
  score integer check (score >= 0 and score <= 100),
  classificacao text,
  sono_horas numeric,
  fc_repouso integer,
  dor_muscular integer check (dor_muscular >= 1 and dor_muscular <= 5),
  volume_ontem numeric,
  recomendacao text,
  componentes jsonb,
  unique (user_id, data)
);
create index if not exists idx_recovery_scores_date on recovery_scores (user_id, data desc);

create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null,                    -- dia em que a noite começou ("dormiu ontem" = ontem)
  hora_dormir time,
  hora_acordar time,
  duracao_min integer,
  qualidade integer check (qualidade >= 1 and qualidade <= 5),
  notas text,
  fonte text default 'manual',
  unique (user_id, data)
);
create index if not exists idx_sleep_logs_date on sleep_logs (user_id, data desc);

-- Apple Health removido: só existe registro manual.
update sleep_logs set fonte = 'manual' where fonte is distinct from 'manual';
alter table sleep_logs drop constraint if exists sleep_logs_fonte_check;
alter table sleep_logs add constraint sleep_logs_fonte_check check (fonte = 'manual');

-- RLS: dono lê/escreve só o que é seu; auth.uid() embrulhado (advisor initplan).
do $$
declare
  t text;
begin
  foreach t in array array['health_metrics_derived', 'recovery_scores', 'sleep_logs'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists own_select on %I', t);
    execute format('drop policy if exists own_insert on %I', t);
    execute format('drop policy if exists own_update on %I', t);
    execute format('drop policy if exists own_delete on %I', t);
    execute format('create policy own_select on %I for select using ((select auth.uid()) = user_id)', t);
    execute format('create policy own_insert on %I for insert with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_update on %I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_delete on %I for delete using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

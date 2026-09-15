-- ExerciseDB + mobilidade (15/09/2026).
-- As colunas do ExerciseDB em `exercises` foram criadas direto no banco; aqui
-- ficam versionadas (idempotente) junto com categoria, fonte, rotinas de
-- mobilidade e os registros que o Hoje precisa.

alter table public.exercises
  add column if not exists exercisedb_id text,
  add column if not exists video_url text,
  add column if not exists gif_url text,
  add column if not exists imagem_url text,
  add column if not exists instrucoes text[],
  add column if not exists dicas_execucao text[],
  add column if not exists variacoes text[],
  add column if not exists musculos_secundarios text[],
  add column if not exists equipamento text,
  add column if not exists nivel text,
  add column if not exists tipo_exercicio text,
  add column if not exists exercisedb_data jsonb,
  add column if not exists categoria text,
  add column if not exists fonte text not null default 'manual';

alter table public.exercises drop constraint if exists exercises_nivel_check;
alter table public.exercises add constraint exercises_nivel_check
  check (nivel in ('iniciante', 'intermediario', 'avancado'));
alter table public.exercises drop constraint if exists exercises_categoria_check;
alter table public.exercises add constraint exercises_categoria_check
  check (categoria in ('forca', 'cardio', 'mobilidade', 'equilibrio', 'alongamento', 'pliometria', 'reabilitacao'));
alter table public.exercises drop constraint if exists exercises_fonte_check;
alter table public.exercises add constraint exercises_fonte_check
  check (fonte in ('manual', 'exercisedb'));

-- Um exercício do ExerciseDB por usuário (upsert do import/sync).
create unique index if not exists exercises_user_exercisedb_key
  on public.exercises (user_id, exercisedb_id);
create index if not exists exercises_user_categoria_idx
  on public.exercises (user_id, categoria);

-- Rotinas de mobilidade (exercícios em ordem, tempo por exercício).
create table if not exists public.mobility_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  descricao text,
  duracao_min int default 5,
  contexto text check (contexto in ('manha', 'pre_forca', 'pre_corrida', 'pos_treino', 'recuperacao', 'qualquer')),
  ordem_exercicios uuid[],
  segundos_por_exercicio int not null default 40 check (segundos_por_exercicio between 10 and 180),
  ativo boolean default true,
  created_at timestamptz default now(),
  unique (user_id, nome)
);
create index if not exists mobility_routines_user_idx on public.mobility_routines (user_id);

alter table public.mobility_routines enable row level security;
drop policy if exists own_select on public.mobility_routines;
drop policy if exists own_insert on public.mobility_routines;
drop policy if exists own_update on public.mobility_routines;
drop policy if exists own_delete on public.mobility_routines;
create policy own_select on public.mobility_routines for select using ((select auth.uid()) = user_id);
create policy own_insert on public.mobility_routines for insert with check ((select auth.uid()) = user_id);
create policy own_update on public.mobility_routines for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.mobility_routines for delete using ((select auth.uid()) = user_id);

-- Calendário: dia com rotina de mobilidade concluída.
alter table public.activity_calendar add column if not exists mobilidade boolean default false;

-- Hoje: escolha diante de recuperação baixa ('mobilidade' | 'treino').
alter table public.recovery_scores add column if not exists decisao_treino text;
alter table public.recovery_scores drop constraint if exists recovery_scores_decisao_treino_check;
alter table public.recovery_scores add constraint recovery_scores_decisao_treino_check
  check (decisao_treino in ('mobilidade', 'treino'));

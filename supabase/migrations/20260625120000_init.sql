-- FORJA — migration inicial
-- Seção 5 do docs/SPEC.md: tabelas base, tabelas de treino, índices, RLS e trigger de seed.

-- =========================================================================
-- 5.1 Tabelas base
-- =========================================================================

-- PERFIL
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  nome text,
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz default now()
);

-- CICLOS (90 dias / 12-week year)
create table cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  data_inicio date not null,
  data_fim date not null,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- METAS (RPM)
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  cycle_id uuid references cycles on delete set null,
  area text not null check (area in ('fisico','mental','financeiro','vinculos','negocio')),
  titulo text not null,
  resultado_rpm text,         -- Resultado
  proposito_rpm text,         -- Propósito
  plano_rpm text,             -- Plano de Ação Massiva
  progresso int default 0 check (progresso between 0 and 100),
  status text default 'ativo' check (status in ('ativo','concluido','pausado')),
  created_at timestamptz default now()
);

create table key_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  goal_id uuid not null references goals on delete cascade,
  descricao text not null,
  valor_atual numeric default 0,
  valor_meta numeric not null,
  unidade text
);

-- HÁBITOS
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  area text,
  ativo boolean default true,
  ordem int default 0
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  habit_id uuid not null references habits on delete cascade,
  data date not null,
  concluido boolean default true,
  unique (habit_id, data)      -- impede log duplicado no mesmo dia
);

-- SAÚDE (definições + leituras)
create table health_metric_defs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  chave text not null,                 -- ex: 'glicemia'
  label text not null,                 -- ex: 'Glicemia em jejum'
  unidade text,                        -- ex: 'mg/dL'
  direcao text check (direcao in ('menor_melhor','maior_melhor')),
  valor_meta numeric,
  unique (user_id, chave)
);

create table health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  chave text not null,
  valor numeric not null,
  measured_at date not null default current_date
);

-- BIBLIOTECA
create table readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  trilha text,
  titulo text not null,
  autor text,
  status text default 'quero_ler' check (status in ('quero_ler','lendo','lido')),
  progresso int default 0 check (progresso between 0 and 100),
  nota_321 text                        -- 3 ideias / 2 aplicações / 1 ação
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provedor text,
  titulo text not null,
  status text default 'quero_ler' check (status in ('quero_ler','lendo','lido')),
  progresso int default 0 check (progresso between 0 and 100)
);

-- FOCO
create table focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tarefa text,
  tecnica text check (tecnica in ('pomodoro','frog')),
  duracao_min int,
  data timestamptz default now()
);

-- DIÁRIO
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  data date not null default current_date,
  tipo text check (tipo in ('diario','semanal')),
  humor int check (humor between 1 and 5),
  conteudo text,
  o_que_senti text
);

-- TAREFAS (inclui o "sapo do dia")
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  titulo text not null,
  area text,
  e_frog boolean default false,
  status text default 'aberto' check (status in ('aberto','feito')),
  data date default current_date
);

-- =========================================================================
-- 5.2 Tabelas de TREINO
-- =========================================================================

-- BIBLIOTECA DE EXERCÍCIOS (com vídeo do YouTube)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  grupo_muscular text,                 -- 'peito','costas','pernas',...
  youtube_video_id text,               -- SÓ o id (ex: 'dQw4w9WgXcQ')
  cues text,                           -- dicas de execução
  cadencia_padrao text,                -- ex: '3010'
  created_at timestamptz default now()
);

-- TREINOS / DIVISÃO (Treino A, B, C, D)
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,                  -- 'Treino A'
  foco text,                           -- 'Peito, Ombro e Tríceps'
  ordem int default 0,
  ativo boolean default true
);

-- PRESCRIÇÃO: exercícios de cada treino
create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  workout_id uuid not null references workouts on delete cascade,
  exercise_id uuid not null references exercises on delete cascade,
  ordem int default 0,
  series_alvo int,                     -- ex: 3
  reps_alvo text,                      -- ex: '15' ou '6-12'
  pausa_alvo_seg int,                  -- ex: 60
  cadencia_alvo text,                  -- ex: '3010'
  notas text
);

-- SESSÃO REALIZADA (instância de um treino feito)
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  workout_id uuid references workouts on delete set null,
  performed_at timestamptz default now(),
  duracao_seg int,
  esforco_percebido int check (esforco_percebido between 1 and 10),
  notas text
);

-- REGISTRO DE SÉRIE (carga, reps, pausa, cadência) — o coração do tracking
create table set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_id uuid not null references workout_sessions on delete cascade,
  exercise_id uuid not null references exercises on delete cascade,
  serie_num int not null,
  carga_kg numeric,
  reps int,
  pausa_seg int,                       -- pausa efetivamente cronometrada
  cadencia text,
  rpe numeric,                         -- esforço (Reps In Reserve opcional)
  concluida boolean default true,
  created_at timestamptz default now()
);

-- CARDIO / CORRIDA (treino híbrido)
create table cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tipo text check (tipo in ('intervalado','longo','recuperacao')),
  performed_at timestamptz default now(),
  distancia_km numeric,
  duracao_seg int,
  fc_media int,
  zona text,                           -- 'Z1'..'Z5'
  tiros text,                          -- descrição dos intervalos
  notas text
);

-- =========================================================================
-- 5.3 Índices recomendados
-- =========================================================================

create index on habit_logs (user_id, data);
create index on health_metrics (user_id, chave, measured_at);
create index on set_logs (user_id, exercise_id, created_at);
create index on workout_sessions (user_id, performed_at);
create index on goals (user_id, cycle_id);

-- =========================================================================
-- 5.4 RLS — padrão para TODAS as tabelas (4 políticas por tabela)
-- =========================================================================

alter table profiles enable row level security;
create policy "own_select" on profiles for select using (auth.uid() = id);
create policy "own_insert" on profiles for insert with check (auth.uid() = id);
create policy "own_update" on profiles for update using (auth.uid() = id);
create policy "own_delete" on profiles for delete using (auth.uid() = id);

alter table cycles enable row level security;
create policy "own_select" on cycles for select using (auth.uid() = user_id);
create policy "own_insert" on cycles for insert with check (auth.uid() = user_id);
create policy "own_update" on cycles for update using (auth.uid() = user_id);
create policy "own_delete" on cycles for delete using (auth.uid() = user_id);

alter table goals enable row level security;
create policy "own_select" on goals for select using (auth.uid() = user_id);
create policy "own_insert" on goals for insert with check (auth.uid() = user_id);
create policy "own_update" on goals for update using (auth.uid() = user_id);
create policy "own_delete" on goals for delete using (auth.uid() = user_id);

alter table key_results enable row level security;
create policy "own_select" on key_results for select using (auth.uid() = user_id);
create policy "own_insert" on key_results for insert with check (auth.uid() = user_id);
create policy "own_update" on key_results for update using (auth.uid() = user_id);
create policy "own_delete" on key_results for delete using (auth.uid() = user_id);

alter table habits enable row level security;
create policy "own_select" on habits for select using (auth.uid() = user_id);
create policy "own_insert" on habits for insert with check (auth.uid() = user_id);
create policy "own_update" on habits for update using (auth.uid() = user_id);
create policy "own_delete" on habits for delete using (auth.uid() = user_id);

alter table habit_logs enable row level security;
create policy "own_select" on habit_logs for select using (auth.uid() = user_id);
create policy "own_insert" on habit_logs for insert with check (auth.uid() = user_id);
create policy "own_update" on habit_logs for update using (auth.uid() = user_id);
create policy "own_delete" on habit_logs for delete using (auth.uid() = user_id);

alter table health_metric_defs enable row level security;
create policy "own_select" on health_metric_defs for select using (auth.uid() = user_id);
create policy "own_insert" on health_metric_defs for insert with check (auth.uid() = user_id);
create policy "own_update" on health_metric_defs for update using (auth.uid() = user_id);
create policy "own_delete" on health_metric_defs for delete using (auth.uid() = user_id);

alter table health_metrics enable row level security;
create policy "own_select" on health_metrics for select using (auth.uid() = user_id);
create policy "own_insert" on health_metrics for insert with check (auth.uid() = user_id);
create policy "own_update" on health_metrics for update using (auth.uid() = user_id);
create policy "own_delete" on health_metrics for delete using (auth.uid() = user_id);

alter table readings enable row level security;
create policy "own_select" on readings for select using (auth.uid() = user_id);
create policy "own_insert" on readings for insert with check (auth.uid() = user_id);
create policy "own_update" on readings for update using (auth.uid() = user_id);
create policy "own_delete" on readings for delete using (auth.uid() = user_id);

alter table courses enable row level security;
create policy "own_select" on courses for select using (auth.uid() = user_id);
create policy "own_insert" on courses for insert with check (auth.uid() = user_id);
create policy "own_update" on courses for update using (auth.uid() = user_id);
create policy "own_delete" on courses for delete using (auth.uid() = user_id);

alter table focus_sessions enable row level security;
create policy "own_select" on focus_sessions for select using (auth.uid() = user_id);
create policy "own_insert" on focus_sessions for insert with check (auth.uid() = user_id);
create policy "own_update" on focus_sessions for update using (auth.uid() = user_id);
create policy "own_delete" on focus_sessions for delete using (auth.uid() = user_id);

alter table journal_entries enable row level security;
create policy "own_select" on journal_entries for select using (auth.uid() = user_id);
create policy "own_insert" on journal_entries for insert with check (auth.uid() = user_id);
create policy "own_update" on journal_entries for update using (auth.uid() = user_id);
create policy "own_delete" on journal_entries for delete using (auth.uid() = user_id);

alter table tasks enable row level security;
create policy "own_select" on tasks for select using (auth.uid() = user_id);
create policy "own_insert" on tasks for insert with check (auth.uid() = user_id);
create policy "own_update" on tasks for update using (auth.uid() = user_id);
create policy "own_delete" on tasks for delete using (auth.uid() = user_id);

alter table exercises enable row level security;
create policy "own_select" on exercises for select using (auth.uid() = user_id);
create policy "own_insert" on exercises for insert with check (auth.uid() = user_id);
create policy "own_update" on exercises for update using (auth.uid() = user_id);
create policy "own_delete" on exercises for delete using (auth.uid() = user_id);

alter table workouts enable row level security;
create policy "own_select" on workouts for select using (auth.uid() = user_id);
create policy "own_insert" on workouts for insert with check (auth.uid() = user_id);
create policy "own_update" on workouts for update using (auth.uid() = user_id);
create policy "own_delete" on workouts for delete using (auth.uid() = user_id);

alter table workout_exercises enable row level security;
create policy "own_select" on workout_exercises for select using (auth.uid() = user_id);
create policy "own_insert" on workout_exercises for insert with check (auth.uid() = user_id);
create policy "own_update" on workout_exercises for update using (auth.uid() = user_id);
create policy "own_delete" on workout_exercises for delete using (auth.uid() = user_id);

alter table workout_sessions enable row level security;
create policy "own_select" on workout_sessions for select using (auth.uid() = user_id);
create policy "own_insert" on workout_sessions for insert with check (auth.uid() = user_id);
create policy "own_update" on workout_sessions for update using (auth.uid() = user_id);
create policy "own_delete" on workout_sessions for delete using (auth.uid() = user_id);

alter table set_logs enable row level security;
create policy "own_select" on set_logs for select using (auth.uid() = user_id);
create policy "own_insert" on set_logs for insert with check (auth.uid() = user_id);
create policy "own_update" on set_logs for update using (auth.uid() = user_id);
create policy "own_delete" on set_logs for delete using (auth.uid() = user_id);

alter table cardio_sessions enable row level security;
create policy "own_select" on cardio_sessions for select using (auth.uid() = user_id);
create policy "own_insert" on cardio_sessions for insert with check (auth.uid() = user_id);
create policy "own_update" on cardio_sessions for update using (auth.uid() = user_id);
create policy "own_delete" on cardio_sessions for delete using (auth.uid() = user_id);

-- =========================================================================
-- 5.5 Trigger de seed no cadastro
-- =========================================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := new.id;
  cid uuid;
begin
  insert into profiles (id, nome) values (uid, coalesce(new.raw_user_meta_data->>'nome',''));

  insert into cycles (user_id, nome, data_inicio, data_fim, ativo)
    values (uid, 'Ciclo 01 — 90 dias', current_date, current_date + 90, true)
    returning id into cid;

  -- Hábitos não-negociáveis
  insert into habits (user_id, nome, ordem) values
    (uid,'Acordar 5h sem soneca',1),
    (uid,'Mover o corpo',2),
    (uid,'Construir um ativo',3),
    (uid,'Tocar a alma (leitura/conexão)',4),
    (uid,'Desligamento noturno',5);

  -- Definições de saúde
  insert into health_metric_defs (user_id, chave, label, unidade, direcao, valor_meta) values
    (uid,'glicemia','Glicemia em jejum','mg/dL','menor_melhor',99),
    (uid,'ldl','Colesterol LDL','mg/dL','menor_melhor',100),
    (uid,'colesterol_total','Colesterol total','mg/dL','menor_melhor',190),
    (uid,'lpa','Lipoproteína (a)','mg/dL','menor_melhor',30),
    (uid,'peso','Peso','kg','menor_melhor',null),
    (uid,'corrida','Corrida contínua','km','maior_melhor',3);

  -- Leituras iniciais
  insert into health_metrics (user_id, chave, valor) values
    (uid,'glicemia',103),(uid,'ldl',119.4),(uid,'colesterol_total',197),(uid,'lpa',44),(uid,'corrida',0);

  insert into readings (user_id, trilha, titulo, autor) values
    (uid,'Mente & Disciplina','Hábitos Atômicos','James Clear'),
    (uid,'Mente & Disciplina','Essencialismo','Greg McKeown'),
    (uid,'Mente & Disciplina','Foco (Deep Work)','Cal Newport'),
    (uid,'Mente & Disciplina','Mindset','Carol Dweck'),
    (uid,'Negócio & Dinheiro','O Mito do Empreendedor','Michael Gerber'),
    (uid,'Negócio & Dinheiro','Trabalhe 4 Horas por Semana','Tim Ferriss'),
    (uid,'Negócio & Dinheiro','$100M Offers','Alex Hormozi'),
    (uid,'Negócio & Dinheiro','Pai Rico, Pai Pobre','Robert Kiyosaki'),
    (uid,'Profundidade Humana','O Poder do Agora','Eckhart Tolle'),
    (uid,'Profundidade Humana','A Coragem de Ser Imperfeito','Brené Brown'),
    (uid,'Profundidade Humana','O Homem em Busca de Sentido','Viktor Frankl'),
    (uid,'Profundidade Humana','A Sabedoria do Eneagrama','Riso & Hudson'),
    (uid,'Profundidade Humana','Meditações','Marco Aurélio'),
    (uid,'Profundidade Humana','As 5 Linguagens do Amor','Gary Chapman'),
    (uid,'Corpo & Energia','Por que Nós Dormimos','Matthew Walker');

  insert into courses (user_id, provedor, titulo) values
    (uid,'Tony Robbins','Date with Destiny'),
    (uid,'G4 Educação','Gestão e Escala'),
    (uid,'Sam Harris','Waking Up');

  -- Estrutura de treino (Welber pluga os exercícios + vídeos depois)
  insert into workouts (user_id, nome, foco, ordem) values
    (uid,'Treino A','Peito, Ombro e Tríceps',1),
    (uid,'Treino B','Membros Inferiores',2),
    (uid,'Treino C','Costas e Bíceps',3),
    (uid,'Treino D','Core / HIIT Abdominal',4);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

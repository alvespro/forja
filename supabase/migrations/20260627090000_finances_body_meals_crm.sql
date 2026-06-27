-- FORJA — finanças, métricas corporais, refeições e CRM de clientes
-- Segue o mesmo padrão da migration inicial (Seção 5 do docs/SPEC.md):
-- tabelas, índices, RLS (4 políticas por tabela) e seed no cadastro.

-- =========================================================================
-- Tabelas
-- =========================================================================

-- FINANÇAS — lançamentos de receita/gasto
create table finances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tipo text not null check (tipo in ('receita','gasto')),
  categoria text,
  valor numeric not null,
  descricao text,
  data date not null default current_date
);

-- FINANÇAS — metas por ciclo (meta mensal e número da liberdade financeira)
create table finance_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ciclo_id uuid references cycles on delete set null,
  meta_mensal numeric,
  numero_liberdade numeric
);

-- SAÚDE — métricas corporais (peso, % de gordura)
create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  peso_kg numeric,
  gordura_pct numeric,
  medido_em date not null default current_date
);

-- NUTRIÇÃO — refeições do dia
create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  refeicao int not null check (refeicao between 1 and 6),
  descricao text,
  proteina_g numeric,
  calorias numeric,
  tipo text,
  data date not null default current_date
);

-- NEGÓCIO — CRM de clientes/leads
create table crm_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  fase text,
  valor_estimado numeric,
  proxima_acao text,
  data_proxima_acao date,
  created_at timestamptz default now()
);

-- =========================================================================
-- Índices recomendados
-- =========================================================================

create index on finances (user_id, data);
create index on finance_goals (user_id, ciclo_id);
create index on body_metrics (user_id, medido_em);
create index on meals (user_id, data);
create index on crm_clients (user_id, fase);

-- =========================================================================
-- RLS — padrão para todas as tabelas (4 políticas por tabela)
-- =========================================================================

alter table finances enable row level security;
create policy "own_select" on finances for select using (auth.uid() = user_id);
create policy "own_insert" on finances for insert with check (auth.uid() = user_id);
create policy "own_update" on finances for update using (auth.uid() = user_id);
create policy "own_delete" on finances for delete using (auth.uid() = user_id);

alter table finance_goals enable row level security;
create policy "own_select" on finance_goals for select using (auth.uid() = user_id);
create policy "own_insert" on finance_goals for insert with check (auth.uid() = user_id);
create policy "own_update" on finance_goals for update using (auth.uid() = user_id);
create policy "own_delete" on finance_goals for delete using (auth.uid() = user_id);

alter table body_metrics enable row level security;
create policy "own_select" on body_metrics for select using (auth.uid() = user_id);
create policy "own_insert" on body_metrics for insert with check (auth.uid() = user_id);
create policy "own_update" on body_metrics for update using (auth.uid() = user_id);
create policy "own_delete" on body_metrics for delete using (auth.uid() = user_id);

alter table meals enable row level security;
create policy "own_select" on meals for select using (auth.uid() = user_id);
create policy "own_insert" on meals for insert with check (auth.uid() = user_id);
create policy "own_update" on meals for update using (auth.uid() = user_id);
create policy "own_delete" on meals for delete using (auth.uid() = user_id);

alter table crm_clients enable row level security;
create policy "own_select" on crm_clients for select using (auth.uid() = user_id);
create policy "own_insert" on crm_clients for insert with check (auth.uid() = user_id);
create policy "own_update" on crm_clients for update using (auth.uid() = user_id);
create policy "own_delete" on crm_clients for delete using (auth.uid() = user_id);

-- =========================================================================
-- Seed no cadastro: estende handle_new_user (Seção 5.5 da migration inicial)
-- com peso/gordura inicial em body_metrics para novos usuários.
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

  -- Métrica corporal inicial
  insert into body_metrics (user_id, peso_kg, gordura_pct) values (uid, 82, 20);

  return new;
end;
$$;

-- Backfill: usuários já cadastrados antes desta migration ainda não têm
-- nenhuma linha em body_metrics — insere a métrica inicial para eles também.
insert into body_metrics (user_id, peso_kg, gordura_pct)
select u.id, 82, 20
from auth.users u
where not exists (select 1 from body_metrics b where b.user_id = u.id);

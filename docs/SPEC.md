# FORJA — Especificação Técnica (build com Claude Code)

> **Sistema operacional pessoal de alta performance.** App web privado (um usuário por conta) para metas, hábitos, saúde, **treino**, foco e reflexão. Interface 100% em português do Brasil.

---

## 0. Como construir com o Claude Code

1. Salve este arquivo como `docs/SPEC.md` na raiz do repositório.
2. Crie também um `CLAUDE.md` curto na raiz apontando: *"Leia `docs/SPEC.md`. Construa nas fases da Seção 9, uma de cada vez, pedindo revisão ao fim de cada fase. Stack obrigatória na Seção 2."*
3. Peça ao Claude Code: **"Implemente a Fase 0"**, valide, e siga fase a fase. Não pule fases.
4. Configure as variáveis de ambiente da Seção 8 antes da Fase 1.

---

## 1. Princípios de produto

- **Mobile-first.** O uso real é no celular, às 5h e dentro da academia. Tudo precisa funcionar com uma mão.
- **Atrito zero para registrar.** Marcar hábito, logar uma série ou uma medição = no máximo 2 toques.
- **O número é o juiz.** Todo módulo termina em progresso medido e visível.
- **Estética "forja às 5h"**: tema escuro, sóbrio, focado (Seção 7).

---

## 2. Stack obrigatória

| Camada | Tecnologia | Motivo |
| :-- | :-- | :-- |
| Build/Frontend | **Vite + React 18 + TypeScript** | Rápido, tipado, ideal para o Claude Code |
| Estilo | **Tailwind CSS + shadcn/ui** | Componentes acessíveis, tema dark fácil |
| Estado de servidor | **TanStack Query (React Query)** | Cache, sync e estados de loading/erro padronizados |
| Roteamento | **React Router v6** | Rotas protegidas |
| Gráficos | **Recharts** | Histórico de carga, saúde e tendências |
| Backend/Banco/Auth | **Supabase** (Postgres + Auth + RLS + Storage) | Persistência real, segurança por linha |
| Datas | **date-fns** + `date-fns-tz` | Fuso `America/Sao_Paulo` consistente |
| PWA | **vite-plugin-pwa** | Instalável no celular, shell offline |
| Formulários | **react-hook-form + zod** | Validação tipada |

Gerenciador: `pnpm`. Deploy sugerido: frontend na **Vercel**, backend no **Supabase** gerenciado.

---

## 3. Decisões de arquitetura (correções aplicadas)

1. **Identificadores em inglês `snake_case`, sem acento.** Rótulos pt-BR vivem só na UI, via mapa `label`. (Corrige risco de encoding/SQL.)
2. **`user_id` desnormalizado em TODAS as tabelas filhas** (`key_results`, `set_logs`, `workout_exercises`, `habit_logs`) para RLS trivial e performática.
3. **Seed via trigger `handle_new_user`** no Postgres — confiável, atômico, roda no cadastro.
4. **Fuso fixo `America/Sao_Paulo`.** "Hoje" é sempre calculado nesse fuso no cliente. Datas de dia (`date`), eventos com `timestamptz`.
5. **RLS ligada em tudo.** Padrão de 4 políticas por tabela (Seção 5.4).
6. **Cronômetros por timestamp**, nunca por `setInterval` acumulado (Seção 6.4).
7. **Embed de YouTube por ID extraído**, render `youtube-nocookie`, sem `dangerouslySetInnerHTML` (Seção 6.3).
8. **Estados de vazio / carregando / erro obrigatórios** em toda tela (Seção 7).

---

## 4. Mapa de telas (navegação: sidebar no desktop, tab bar no mobile)

1. **Hoje** — dashboard diário
2. **Metas** — RPM/OKR por área
3. **Treino** — execução, registro e evolução de carga ⭐ (novo)
4. **Saúde** — placar de marcadores + gráficos
5. **Hábitos** — check-in, streaks
6. **Biblioteca** — leituras (3-2-1) + cursos
7. **Foco** — Pomodoro + anti-procrastinação
8. **Diário & Revisão** — diário e revisão semanal
9. **Nutrição** — plano alimentar, refeições do dia, macros e suplementos.
   Registro de alimentos via FoodSearch (TACO + Open Food Facts + USDA + IA estimada),
   com código de barras e atalhos de recentes/frequentes. Sem integrações externas de
   diário alimentar (Yazio removido em 15/09/2026).

---

## 5. Modelo de dados (SQL Supabase/Postgres)

### 5.1 Tabelas base

```sql
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
```

### 5.2 Tabelas de TREINO ⭐

```sql
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
```

### 5.3 Índices recomendados

```sql
create index on habit_logs (user_id, data);
create index on health_metrics (user_id, chave, measured_at);
create index on set_logs (user_id, exercise_id, created_at);
create index on workout_sessions (user_id, performed_at);
create index on goals (user_id, cycle_id);
```

### 5.4 RLS — padrão para TODAS as tabelas

Para **cada** tabela acima (todas têm `user_id`): habilitar RLS e criar 4 políticas. Exemplo concreto, replicar trocando o nome da tabela:

```sql
alter table goals enable row level security;

create policy "own_select" on goals for select using (auth.uid() = user_id);
create policy "own_insert" on goals for insert with check (auth.uid() = user_id);
create policy "own_update" on goals for update using (auth.uid() = user_id);
create policy "own_delete" on goals for delete using (auth.uid() = user_id);
```

> Claude Code: gere essas 4 políticas para **profiles, cycles, goals, key_results, habits, habit_logs, health_metric_defs, health_metrics, readings, courses, focus_sessions, journal_entries, tasks, exercises, workouts, workout_exercises, workout_sessions, set_logs, cardio_sessions**. (Em `profiles`, use `auth.uid() = id`.)

### 5.5 Trigger de seed no cadastro

```sql
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
```

---

## 6. Regras de negócio

### 6.1 Streak de hábito
Dias **consecutivos** com `concluido = true`, terminando em ontem ou hoje. O dia de hoje **ainda não marcado não quebra** a sequência (só conta a partir do dia anterior). Faltou um dia no meio → zera. Calcular no fuso `America/Sao_Paulo`.

### 6.2 Progresso de meta
- Se a meta tem `key_results`: `progresso = média( min(valor_atual / valor_meta, 1) ) * 100`.
- Se não tem: usa o `progresso` manual.

### 6.3 Embed seguro de YouTube
1. Usuário cola a URL. Extrair o ID com regex cobrindo `youtu.be/ID`, `watch?v=ID`, `/embed/ID`, `/shorts/ID`.
2. Validar: ID = `[A-Za-z0-9_-]{11}`. Se inválido, erro amigável.
3. Salvar **só o ID**. Renderizar `<iframe src="https://www.youtube-nocookie.com/embed/{id}" ...>`.
4. **Nunca** usar `dangerouslySetInnerHTML` com input do usuário.

### 6.4 Cronômetros (pausa e livre) — à prova de segundo plano
- Guardar `start = Date.now()` e o alvo (segundos). O tempo restante é **sempre** `alvo - (Date.now() - start)` recalculado no render — nunca decrementar uma variável.
- Ao zerar: tocar som (Web Audio) + `navigator.vibrate([200,100,200])`.
- Durante a sessão de treino: `navigator.wakeLock` para a tela não apagar.
- **Pausa automática:** ao marcar uma série como concluída, dispara o cronômetro com `pausa_alvo_seg` daquele exercício. O valor real decorrido é gravado em `set_logs.pausa_seg`.
- Modo **cronômetro livre** (stopwatch) e modo **cadência** (metrônomo opcional que bipa conforme a notação `EPCP`, ex: `3010`).

### 6.5 Evolução de carga (o ouro do módulo Treino)
A partir de `set_logs`, por exercício e ao longo do tempo:
- **Carga máxima** por sessão.
- **1RM estimado (Epley):** `carga * (1 + reps / 30)`. Plotar o melhor 1RM estimado por sessão.
- **Volume total:** `Σ (séries × reps × carga)` por sessão.
- **Recordes (PR):** destacar quando uma sessão supera o melhor 1RM estimado histórico.
- **Sugestão de sobrecarga progressiva:** se na última sessão o usuário bateu todas as `series_alvo × reps_alvo` na carga X, sugerir `X + 2,5kg` (ou +1 rep) na próxima. Mostrar "última carga" como referência ao iniciar o exercício.

### 6.6 Frequência de treino
- Sessões por semana ISO (força e cardio separados) vs. meta (força 4x, corrida 3x).
- Frequência por grupo muscular (via `workouts.foco` das sessões) — alerta se algum grupo ficou >7 dias sem estímulo.

---

## 7. Design system

```
--meia-noite:#0B1220   (fundo)
--aco:#131F33          (cards)
--aco-claro:#1B2A42    (hover)
--linha:#22324d        (bordas)
--brasa:#F0A93B        (acento/ouro — use com parcimônia)
--brasa-quente:#E07B2E (gradiente)
--nevoa:#EAE5D8        (texto principal)
--aco-texto:#8294B0    (texto secundário)
--ok:#5FA88C  --atencao:#E8A23D  --alerta:#CB6A4E
```

- **Fontes (Google Fonts):** títulos **Bricolage Grotesque** (peso forte); dados/números/labels **Space Mono**; corpo legível.
- **Status de saúde/treino:** âmbar = fora da meta, verde = dentro, tijolo = alerta.
- **Obrigatório em toda tela:** estado **carregando** (skeleton), **vazio** (com chamada para ação, não tela morta) e **erro** (mensagem clara + retry).
- Acessibilidade: contraste AA, foco de teclado visível, toques ≥ 44px, `prefers-reduced-motion` respeitado.

---

## 8. Variáveis de ambiente

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
(Service role **nunca** no frontend.)

---

## 9. Fases de build (ordem para o Claude Code)

- **Fase 0 — Fundação:** Vite+React+TS+Tailwind+shadcn, tokens do tema, layout shell (sidebar/tab bar), React Router, cliente Supabase, TanStack Query.
- **Fase 1 — Auth & Seed:** cadastro/login, rotas protegidas, migrations da Seção 5 (tabelas + RLS + trigger). Validar que um novo usuário nasce com tudo semeado.
- **Fase 2 — Hoje & Hábitos:** dashboard (hábitos do dia + check rápido + streak + sapo do dia + progresso do ciclo + humor); tela de Hábitos (grade semanal, streaks, % semanal).
- **Fase 3 — Metas:** CRUD RPM por área, Resultados-Chave, progresso automático, filtro por ciclo.
- **Fase 4 — Saúde:** placar dos marcadores (cor por meta) + registrar medição + gráficos de histórico (Recharts).
- **Fase 5 — TREINO ⭐:** biblioteca de exercícios com embed do YouTube; montar treinos (prescrição); **executar sessão** com registro de carga/reps/pausa/cadência; cronômetro de pausa automático + wake lock; cardio/corrida; **gráficos de evolução de carga, 1RM e volume, PRs e sugestão de sobrecarga**; painel de frequência.
- **Fase 6 — Biblioteca:** leituras por trilha + notas 3-2-1 + cursos.
- **Fase 7 — Foco & Diário:** Pomodoro (timestamp) + checklist anti-atrito; diário diário/semanal + revisão semanal (placar da semana).
- **Fase 8 — PWA & polish:** instalável, ícones, shell offline, varredura de estados vazio/erro, auditoria de acessibilidade.

---

## 10. Roadmap pós-v1
1. Lembretes (ritual 5AM, desligamento noturno, reteste de 90 dias).
2. Tendências cross-ciclo (saúde e carga ao longo dos ciclos).
3. Revisão de fim de ciclo: planejado vs. atingido + sugestão do próximo.
4. Importar exames (PDF) e preencher marcadores.
5. Export do progresso do ciclo em PDF.
6. Modo "deep work" em tela cheia com som ambiente.

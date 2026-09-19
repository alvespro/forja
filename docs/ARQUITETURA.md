# Arquitetura do FORJA

App pessoal de alta performance: treino, corpo, nutrição, protocolo médico,
desenvolvimento, finanças, tarefas e gamificação — tudo em um dashboard.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite (rolldown), PWA |
| UI | Tailwind CSS v4 + shadcn/ui (Radix), sonner (toasts), Recharts |
| Estado de servidor | TanStack Query (staleTime 60s, retry inteligente) |
| Rotas | React Router v7, lazy por página, `errorElement` em todas |
| Backend | Supabase: Postgres + Auth + RLS + Storage + Edge Functions (Deno) |
| IA | Claude (Anthropic API) via edge functions |
| Testes | Vitest (`npm test`) — funções puras críticas |

## Estrutura de pastas

```
src/
  pages/           1 arquivo por rota (lazy no router.tsx)
  components/
    ui/            primitivos shadcn + Modal reutilizável
    layout/        app-shell, sidebar, tab-bar, nav-items
    feedback/      empty/error states, route-error, app-error-boundary
    today/         cards do dashboard Hoje (gamificação, resumos)
    body/          Corpo: metas, gráficos, fotos de progresso
    protocolo/     wizard de criação de protocolo
    <módulo>/      componentes específicos por módulo
  hooks/           1 arquivo por tabela/recurso (use-<tabela>.ts)
  lib/             lógica pura: date, gamification, protocol, daily-quote,
                   crud-factory, query-client (erros globais)
  types/           database.ts (manual, auditado) + database.generated.ts
supabase/
  migrations/      fonte da verdade do schema (npx supabase db push)
  functions/       forja-ai, forja-vision, weekly-suggestions, daily-briefing,
                   protocol-reminders, analyze-progress-photo, search-food, health-calc
docs/              esta doc + plano de refatoração
```

## Convenções

### Hooks de dados
- Um hook por tabela: `useXxx()` (lista), `useCreateXxx()`, `useUpdateXxx()`.
- Tabelas simples usam `createCrudHooks` (lib/crud-factory) — user_id
  automático, invalidação por `[queryKey]`.
- Queries de séries temporais têm **janela** (não crescem para sempre):
  workout_sessions 12 meses, supplement_logs 180d, finances 1000.
- RLS cuida do escopo por usuário; os hooks não precisam de `.eq('user_id')`.

### Tratamento de erros (lib/query-client.ts)
- Toda mutação que falha mostra toast com mensagem humanizada.
- `meta: { silent: true }` — sem toast (telemetria, ex.: daily_scores).
- `meta: { errorMessage: '...' }` — prefixo específico no toast.
- Camadas: MutationCache/QueryCache → RouteError (por rota) →
  AppErrorBoundary (nunca tela branca).

### Comentários
Doc-comment em português no topo de hooks/libs (o quê + por quê);
inline apenas para restrições não óbvias (timezone SP, regra médica,
dedupe). Sem comentários narrando o óbvio.

### Datas
Sempre `todayInSaoPaulo()` e helpers de `lib/date` — o app opera no fuso
America/Sao_Paulo; nunca `new Date().toISOString().slice(0,10)` direto.

## Módulos com regras especiais

### Protocolo (supervisão médica)
**Regra absoluta**: o app registra o que o médico prescreveu e monitora
marcadores — **nunca sugere compostos, doses ou protocolos**. A regra está
no system prompt do agente `protocolo` (forja-ai) e nos avisos da UI.
Fluxo: wizard de criação → compostos → transições com confirmação
(planejado→ativo→tpc→concluído) → logs de aplicação → exames com valores
salvos em `health_metrics` → alertas críticos persistentes
(`checkCriticalMarkers` — limiares travados por teste em
`use-protocol-alerts.test.ts`).

### Gamificação (lib/gamification.ts)
Score diário calculado no cliente (GamifiedDashboard) e persistido via
upsert em `daily_scores`. Dele derivam: streak (dias com 50%+), XP total →
níveis de 500 XP com títulos da Forja, e 8 conquistas. Frase do dia:
banco FORJA + citações/aprendizados salvos pelo usuário em livros, cursos
e mídias (rotação determinística por data — lib/daily-quote.ts).

### Fotos de progresso
Bucket privado `progress-photos` (pasta = uid, URLs assinadas 1h).
`analyze-progress-photo` valida o dono, monta contexto (medições, fotos
anteriores, treinos 30d) e gera relatório via Claude vision.

### Cálculos clínicos (health-calc)
Edge Function `health-calc` (secret `HEALTH_CALC_API_KEY`, RapidAPI Health
Calculator API) calcula HOMA-IR, ratios lipídicos, previsão de recomposição,
zonas Karvonen e score de recuperação. As fórmulas e faixas vivem em
`supabase/functions/_shared/health-calc.ts` (reexportado em
`src/lib/health-calc.ts`, testado) e são a fonte da classificação: o valor da
API só é aceito quando concorda com o cálculo local; API fora do plano, fora
do ar ou timeout (8s) → cálculo local com `offline_fallback: true`. Em
14/09/2026 o plano gratuito bloqueia HOMA-IR/ratios/Karvonen e recomposição/
recuperação só existem no plano enterprise (api.hefitapi.com) — tudo roda
localmente. Resultados: `health_metrics_derived` (histórico) e
`recovery_scores` (um por dia). Disparos: exame confirmado no Document Vision,
nova pesagem com % de gordura, primeiro treino/cardio (zonas padrão 32 anos /
FC 62), slider do card de recuperação no Hoje. Sono é manual (`sleep_logs`,
data = noite em que começou). Apple Health foi removido em 04/07/2026.

### Alimentos multi-banco (search-food)
Cascata por nome: **TACO** (597 alimentos, importados em `foods_cache` por
`scripts/import-taco.ts`) → **Open Food Facts** (search.openfoodfacts.org; o
`cgi/search.pl` legado respondia 503 em 14/09/2026) → **USDA FoodData
Central** (`USDA_API_KEY`, senão DEMO_KEY) → **estimativa por IA**
(claude-sonnet-4-6, JSON estruturado, validada por Atwater e cacheada pelo
termo). Código de barras vai direto ao OFF. Filtro `fonte` pula a cascata.
Busca no cache: `search_foods_cache()` — sem acento (`f_unaccent`), por
prefixo, `prioridade` (alimentos do plano) primeiro. Resultado do OFF só entra
se toda palavra do termo estiver no nome/marca e os macros forem possíveis.
`foods_cache` é só leitura para usuários (escrita via service role);
`foods.ref_externa` liga o registro à fonte (`taco:3`, `usda:…`, barcode, `ia:…`).
Regras e badges compartilhados em `supabase/functions/_shared/foods.ts`.

Registro de refeições é só nativo (Yazio removido em 15/09/2026): FoodSearch →
porção → `meal_logs` com `fonte` `foods_cache` (ou `ia_estimado`); o formulário
livre grava `manual`. Atalhos "Recentes" (5 últimos) e "Frequentes no mês"
(top 5) vêm de `meal_logs → foods` (`lib/food-shortcuts.ts`).

### Biblioteca de exercícios (exercise-import)
ExerciseDB clássica na RapidAPI (host `exercisedb.p.rapidapi.com`, secret
`EXERCISEDB_API_KEY`; plano básico: 690 chamadas/mês, 10 itens por página, GIF
só em 180px). Campos: nome, bodyPart, target, equipment, category, difficulty,
description, instruções — **sem vídeo, dicas nem variações** (isso é da v2
"EDB with Videos and Images", assinatura separada). Cache-first: a API só é
chamada para `busca` / `importar` / `sync_seed`; o app lê sempre de
`exercises`. O GIF exige a chave, então é baixado uma vez e guardado no bucket
público `exercise-media` (`exercisedb/<id>.gif`, compartilhado); a busca só
mostra miniatura do que já está em cache, para não gastar cota. A API é só em
inglês: nome, instruções e descrição são traduzidos por IA no import; o
original fica em `exercises.exercisedb_data`. Ao vincular a um exercício
existente, o nome em pt-BR e os `cues` escritos à mão são preservados.
Mapeamentos (grupo, categoria, nível, equipamento) e montagem das rotinas em
`supabase/functions/_shared/exercisedb.ts` (o normalizador também aceita o
formato da v2). Mídia na tela de detalhe: MP4 do ExerciseDB → GIF → YouTube →
imagem → BodyMap.

### Vídeos do YouTube (Data API v3)
`src/hooks/useYouTubeSearch.ts` busca direto do navegador com
`VITE_YOUTUBE_API_KEY` (a chave vai no bundle — restrinja por referrer HTTP no
Google Cloud: localhost:5173 e forja-chi.vercel.app). Cada `search.list` custa
100 unidades de 10.000/dia; o cache é `exercises.youtube_video_id` — com ID salvo
ou MP4 próprio, nunca busca. Na tela do exercício: "Buscar vídeo no YouTube" →
grade de 6 → "Usar este vídeo" (e "Trocar vídeo" depois); com GIF, o vídeo
escolhido aparece abaixo dele. Ao importar do ExerciseDB (ExerciseSearch), busca
silenciosa grava o primeiro resultado. Embed sempre `youtube-nocookie.com`.

### Mobilidade
`sync_seed` também importa mobility/stretching/rehabilitation (a API não filtra
por categoria: buscas por nome paginadas — "stretch", "circles", "rotation"; nomes
traduzidos em lote; GIF e instruções só dos que entram em rotina) e cria 4
`mobility_routines` (Ativação Matinal 5AM, Aquecimento Pré-Força, Mobilidade
Pós-Corrida, Recuperação Ativa) via `montarRotina` — um exercício por região do
corpo. Execução em tela cheia (`MobilityRunner`): tempo por exercício
30/45/60s, avanço automático, beep/vibração suaves. Ao concluir: `activity_calendar.mobilidade`,
+15 XP em `xp_logs` (o total de XP exibido ainda soma só `daily_scores`) e, vindo
do hábito "Mover o corpo", marca o hábito. No Hoje, `useRecoveryGate` troca a ação
principal: score < 40 → só mobilidade suave; < 60 com treino de força
programado → mobilidade ou "treinar mesmo" (`recovery_scores.decisao_treino`).

## Edge functions e segurança

- As funções agendadas (weekly-suggestions, daily-briefing e
  protocol-reminders) exigem `CRON_SECRET` e o header `x-cron-secret`; sem o
  segredo configurado, retornam 503 e não executam. As demais autenticam o JWT
  do usuário antes de acessar dados.
- Functions com service role sempre revalidam a posse do recurso
  (`eq('user_id', user.id)`).
- Migrations: `npx supabase db push` (pede confirmação). Tipos:
  `npm run types:gen` gera `database.generated.ts` para auditar drift
  contra os tipos manuais.

## Comandos

```
npm run dev        # dev server (5173)
npm run build      # tsc -b + vite build (typecheck incluso)
npm test           # vitest — limiares médicos, gamificação, protocolo
npm run lint       # oxlint
npm run types:gen  # tipos do schema remoto p/ auditoria
npx supabase functions deploy <nome> --project-ref devwqshyiatvhwrudfpa
```

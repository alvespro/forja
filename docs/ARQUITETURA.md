# Arquitetura do FORJA

App pessoal de alta performance: treino, corpo, nutrição, protocolo médico,
desenvolvimento, finanças, tarefas e gamificação — tudo em um dashboard.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite (rolldown), PWA |
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
  functions/       forja-ai, forja-vision, weekly-suggestions,
                   protocol-reminders, analyze-progress-photo, sync-yazio
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

## Edge functions e segurança

- `verify_jwt` em todas; as **agendadas** (weekly-suggestions,
  protocol-reminders) exigem também o header `x-cron-secret` (env
  CRON_SECRET) — a publishable key sozinha recebe 401.
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

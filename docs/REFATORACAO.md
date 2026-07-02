# Plano de Refatoração e Otimização — FORJA

Plano em etapas, ordenado por impacto ÷ risco. Cada etapa é independente,
commitável sozinha e não quebra as demais. Etapas marcadas ✅ já foram
executadas; as demais são o backlog priorizado.

---

## Etapa 1 — Fundação de segurança e erros ✅ (concluída)

- [x] Error boundary global (`AppErrorBoundary`) + `errorElement` em todas as rotas
- [x] Toast global para mutações que falham (MutationCache + sonner), com
      mensagens humanizadas e `meta.silent`/`meta.errorMessage`
- [x] Retry inteligente (não repete erros de auth/permissão)
- [x] CRON_SECRET nas edge functions agendadas (anti-abuso de custo)
- [x] RLS auditada ao vivo nas tabelas sensíveis

## Etapa 2 — Performance de dados ✅ (concluída nesta rodada)

- [x] Janelas nas queries que cresciam sem limite:
      `workout_sessions` (12 meses), `supplement_logs` (180 dias),
      `finances` (1000 lançamentos)
- [x] Índices para os predicados quentes (RLS + filtros de data):
      migration `20260702100000_hot_indexes.sql` — ver detalhes lá
- [ ] **Futuro**: view/RPC agregada para a página Hoje (reduzir ~15 queries
      para 1-2). Fazer apenas quando houver lentidão medida no mobile —
      hoje o cache de 60s do TanStack absorve bem.

## Etapa 3 — Acessibilidade e base de UI ✅ (concluída nesta rodada)

- [x] `:focus-visible` global (anel brasa) — navegação por teclado visível
- [x] `aria-label` nos botões só-ícone dos módulos principais
- [x] Componente `<Modal>` reutilizável (Radix Dialog): foco preso, Esc
      fecha, `aria-modal`, backdrop clicável — substitui os shells
      copiados-e-colados de modal
- [x] TODOS os 9 modais migrados para `<Modal>`: protocolo-page (6:
      composto, suporte, aplicação, resultado de exame, agendar, editar),
      protocol-create-wizard, progress-photos-card (2). Zero shells
      artesanais restantes no app.
- [ ] **Próximo**: revisar contraste AA nos badges coloridos do iOS-style
      (tarefas) e nos chips do dashboard.

## Etapa 4 — Documentação ✅ (concluída nesta rodada)

- [x] `docs/ARQUITETURA.md`: stack, estrutura de pastas, fluxo de dados,
      convenções (hooks, crud-factory, meta de erros), módulos especiais
      (protocolo médico, gamificação, fotos de progresso)
- [x] Este plano (`docs/REFATORACAO.md`)
- Convenção vigente de comentários: doc-comment em português no topo de
  cada hook/lib explicando O QUE e POR QUÊ; comentários inline apenas para
  restrições não óbvias (ex.: regra médica, timezone, dedupe). O código
  novo já segue; aplicar nos arquivos antigos conforme forem tocados —
  **não** fazer sweep de comentários por si só (ruído em diff).

## Etapa 5 — Reorganização em componentes (backlog priorizado)

Duplicações reais identificadas, em ordem de valor:

1. **`<Modal>`** ✅ criado e adotado nos 9 shells.
2. **`<FieldInput>` / `<FieldSelect>` / `<FieldTextarea>`** ✅ criados em
   `components/ui/field.tsx` e adotados em protocolo-page, wizard e
   fotos de progresso. Restam usos avulsos da classe em páginas antigas
   (tarefas, suplementos etc.) — trocar conforme forem tocadas.
3. **`<StatCard>`**: o padrão "label pequeno + valor grande + delta
   colorido" aparece em Corpo, Protocolo (monitoramento), Metas do ciclo.
4. **`<SectionCard>`**: Card com header "título + botão de ação" repetido
   em ~10 lugares.
5. **protocolo-page.tsx (~1500 linhas)**: extrair as 5 abas para
   `components/protocolo/tab-*.tsx` — maior arquivo do app, mexer por
   último e com testes manuais das 5 abas.

## Etapa 6 — Bundle (só se houver dor real)

Medidos hoje: CategoricalChart 262KB (Recharts, lazy por rota ✓),
button/radix 245KB, index 395KB. PWA precache 1.8MB.

- [ ] Trocar import do meta-pacote `radix-ui` pelos pacotes individuais
      `@radix-ui/react-*` (tree-shaking melhor no chunk de 245KB)
- [ ] Avaliar `manualChunks` para vendor estável (melhor cache em deploy)
- Não fazer antes de medir: o app é PWA com precache — segundo load é
  local. Otimizar bundle aqui tem retorno baixo até existir métrica real
  (Speed Insights já está instalado — usar os dados dele).

## Regras do jogo (valem para todas as etapas)

1. Uma etapa = um commit = build verde + `npm test` verde.
2. Nada de refactor misturado com feature no mesmo commit.
3. `protocolo-page` e `checkCriticalMarkers` só mudam com os testes de
   limiar médico passando — são a parte crítica do app.
4. Cores e identidade FORJA (meia-noite/aço/brasa/névoa) não mudam.

# Auditoria Completa do FORJA — Julho/2026

Gerada por 9 auditores de IA lendo o código real (234 leituras de arquivo),
8 por módulo + 1 coach transversal analisando o sistema contra o perfil do
usuário (3w2, empresário imobiliário, recomposição corporal + protocolo).

---

## 1. Nota executiva

O FORJA está **funcional de ponta a ponta**: 16 páginas, 7 agentes de IA com
contexto real, 4 integrações (Yazio, Apple Health, vision de documentos e de
fotos), gamificação persistida e um módulo de protocolo médico com segurança
em 3 camadas. A engenharia é acima da média (RLS auditada, testes nos limiares
médicos, tratamento de erros global, janelas de query, índices).

Os problemas encontrados se dividem em três categorias:

1. **Bugs reais** (7 confirmados no código) — nenhum trava o app, mas três
   corrompem métricas que orientam decisão.
2. **Loops abertos** — dados coletados que não geram insight (sono/atividade
   do Apple Health, RPE de treino, dev_progress vazio) e ciclos que não fecham
   (meta→tarefa, comida→corpo, aprendizado→aplicação).
3. **Vieses de design** — o sistema mede presença e volume, pune descanso e
   deixa o trabalho interno (diário, vínculos) ser opcional — exatamente o
   perfil de armadilha de um 3w2.

## 2. Bugs confirmados (corrigir primeiro)

| # | Bug | Onde | Efeito |
|---|-----|------|--------|
| 1 | Bônus de tarefas conta 2× no XP (pontos já inclui bônus; totalXP soma de novo) | gamified-dashboard.tsx:199, gamification.ts:101 | Nível/conquistas inflados; pct do dia pode passar de 100% |
| 2 | XP/nível/conquistas calculados sobre janela móvel de 120 dias, nada persistido | use-daily-scores.ts (default 120) | Nível REGRIDE com o tempo; conquistas "desconquistam" |
| 3 | Agente de nutrição lê a tabela morta `meals` — o app inteiro escreve em `meal_logs` | forja-ai/index.ts:241-248 | O "Analista Metabólico" nunca vê as refeições reais/Yazio |
| 4 | Sync Yazio importa ONTEM, UI só lê HOJE | use-yazio-sync.ts (body vazio) + useMealLogsToday | "Sincronizar agora" não muda nada visível |
| 5 | Baseline de metas corporais usa a 1ª medição da HISTÓRIA, não do ciclo ativo | GoalProgressCards, projectWeeksToGoal | % de progresso e projeção errados a partir do 2º ciclo |
| 6 | Exame sem data_prevista NUNCA gera alerta de atraso (semana_alvo ignorada) | use-protocol-alerts.ts:73 + protocol-reminders | Maior furo de segurança do módulo médico |
| 7 | MAX_TOKENS=500 global vs prompts de "300 palavras" | forja-ai/index.ts:16 | JSON do modo metas pode truncar e quebrar o parse |

> ✅ **Status (04/07/2026): os 7 bugs foram corrigidos** (commit `fix: 7 bugs da auditoria 2026-07`),
> com testes novos para XP, janela do ciclo e atraso por semana_alvo. Notas da verificação:
> no #3, a tabela `meals` não estava morta (a página /meals ainda escreve nela) — o agente passou
> a ler `meal_logs` e a unificação meals×meal_logs foi para o backlog; no #2, a correção lê o
> histórico completo de `daily_scores` (persistir conquistas segue no item 14 do backlog médio);
> no #6, o lembrete atrasado agora também reincide semanalmente (antes disparava 1× para sempre).

## 3. Estado por módulo (resumo)

### 🎮 Hoje & Gamificação — bom motor, loop de hábito aberto
Score 100% derivado de logs reais, streak tolerante testado, frase do dia
pessoal. Falta: celebração de conquista, alerta de "streak em risco" à noite,
recálculo retroativo (dia sem abrir a aba = streak quebrado injustamente),
teto de progressão (~2-3 meses e as conquistas esgotam) e **conceito de
descanso** — dia de recovery planejado nunca passa de ~77%.

### 💪 Treino & Corpo — MVP maduro; periodização inexistente
Session runner excelente (wake lock, pausa real, prefill), 1RM/PR/overload em
lib pura testável, ciclo medição→foto→IA fechado. Falta: **zero deload/
periodização no código**, RPE coletado e nunca usado, sugestão de overload
fora do momento de decisão (só na aba Evolução, não na sessão), Antes/Depois
compara ângulos diferentes e a IA vê só a foto atual (anteriores viram texto).

### 🍽️ Nutrição — bom dashboard do dia; não é instrumento de recomposição
Aderência diária visual, guard do jantar (glicemia 103), sync Yazio robusto.
Falta: **zero histórico** (nenhuma visão semanal, nenhum cruzamento
comida×peso/BF), sistema duplicado (meals vs meal_logs), impossível editar/
excluir um log errado, e macroStatus trata estourar caloria como "verde".

### 🔬 Protocolo & Saúde — o mais maduro em segurança; monitoramento com furos
Regra "não prescreve" em 3 camadas, alertas críticos não-dispensáveis,
transições com guarda. Falta: alerta por semana_alvo (bug #6), os 10 marcadores
de exame **invisíveis na página Saúde** (sem defs), IA do ciclo promete vigiar
hematócrito/PA mas nunca recebe os valores, PSA/hemoglobina coletados e nunca
checados, pressão arterial não rastreável, lembrete de atraso dispara 1× para
sempre.

### 🧠 Desenvolvimento — captura boa; aprendizado não fecha
3-2-1 força aplicação, sugestões IA anti-ponto-cego (prioriza o que 3w2 evita).
Falta: dev_progress existe no banco e **nunca é gravada** (zero histórico de
skills), nenhuma revisão espaçada (7/30/90d), ação→tarefa sem vínculo nem
cobrança, mídia tem 3-2-1 só no schema, insights de IA somem ao sair da página,
aceitar sugestão joga fora habilidades_alvo.

### ✅ Execução & Ritmo — cinco silos bonitos, uma ponte fina
Pomodoro sério, ritual anti-atrito como gate, sapo atravessa 3 camadas. Falta:
**meta→tarefa não existe** (sem goal_id), foco→tarefa é string livre, revisão
semanal ignora tarefas/metas/placar gamificado, tarefa de ontem some da lista
Hoje (sem "Atrasadas"), hábitos sem CRUD (só via banco), sapo sem unicidade.

### 💼 Finanças & CRM — os mais rasos; proporção invertida com o que paga as contas
CRUDs sólidos, mas: **não existe visão mensal** (meta mensal nunca comparada
com nada), número da liberdade decorativo, CRM sem contato/histórico/pipeline
fixo (fase é texto livre → "proposta" ≠ "Proposta"), ordenação ignora
data_proxima_acao, e zero presença no Hoje/notificações/IA.

### 🤖 Infra de IA & Integrações — backend forte, consumo fraco
7 agentes seguros e contextualizados, 2 pipelines de vision, 4 crons/sync.
Falta: **sono/atividade/hidratação do Apple Health têm ZERO leitura** (entram
no banco e morrem), coach "Mentor 5AM" nunca fala primeiro (sem trigger),
chat single-turn e efêmero, alertas críticos não geram notificação.

## 4. Backlog priorizado (impacto alto)

**Esforço BAIXO (fazer já):**
1. Corrigir os bugs #1, #3, #4, #5, #7 (todos ~1-10 linhas cada)
2. Alertar exames por semana_alvo (bug #6)
3. health_metric_defs para os 10 marcadores → Saúde mostra o ciclo
4. Completar checkCriticalMarkers (PSA >4, TGO/TGP atenção, E2 baixo, Hb >18)
5. Sugestão de overload DENTRO da sessão de treino
6. Sono+atividade no contexto do coach e do agente treino
7. Resumo financeiro mensal + barra da meta
8. Pipeline fixo no CRM + ordenação por próxima ação
9. Placar da semana com tarefas/sapos/metas
10. Rest day no score (treino sai do denominador em dia planejado de descanso)

**Esforço MÉDIO (próximas semanas):**
11. Card de Recuperação no Hoje (sono, FC repouso, passos — Apple Health)
12. Briefing diário automático do coach às 5h (cron + notification)
13. Recálculo retroativo de daily_scores (últimos 7 dias)
14. Conquistas persistidas com earned_at + celebração + conquistas de retorno
15. Visão semanal comida×corpo (aderência × peso/BF)
16. Revisão espaçada 7/30/90d dos aprendizados (card no Hoje)
17. goal_id em tasks + picker de tarefa no Foco + conclusão pós-pomodoro
18. Card "Ações do CRM hoje" no dashboard + fechado→receita em 1 clique
19. Detector de estagnação/deload usando o RPE já coletado
20. Relatório pré-consulta exportável (protocolo)
21. Conversas de IA persistidas (follow-up + coach que cobra o que sugeriu)

## 5. Análise comportamental (coach transversal)

### Armadilhas que o sistema atual REFORÇA no seu perfil
- **Mede presença, não verdade**: diário vale 10 pts por existir; 3 registros
  de qualquer coisa = 15 pts de refeição. Um 3w2 otimiza a métrica e chama de
  evolução.
- **Dá para ser FORJADO fugindo do trabalho interno**: sapo+treino+refeições
  = 86% sem abrir o diário. O item mais barato é exatamente o que você evita.
- **Bônus ilimitado de tarefas** alimenta o "ocupado = valioso" — grind
  operacional vira status.
- **O sistema pune descanso** (25 pts perdidos em dia de recovery) — incentivo
  para treino-lixo com protocolo médico ativo. Perigoso, não só ineficiente.
- **Quebrar streak vira vergonha** em vez de dado, e não existe mecânica de
  retorno — a recaída típica do 3 é abandonar o app, não encarar a queda.
- **A frase do dia é 100% execução/pancada** — zero sobre vulnerabilidade,
  vínculo ou descanso legítimo. O app motiva com a voz que é a sua prisão.
- **Humor é o dado mais honesto e o mais decorativo**: um mês FORJADO com
  humor 2 passa batido — o cenário exato de burnout do perfil.

### Medido demais → presença binária, volume bruto, 4 representações do mesmo pct.
### Medido de menos → profundidade do diário, aplicação do aprendizado,
**vínculos (invisíveis no sistema)**, descanso/recuperação, humor×performance,
finanças no ritual de revisão, retorno pós-queda.

## 6. Rotinas recomendadas (o sistema serve a rotina, não o contrário)

| Cadência | Ritual |
|---|---|
| **Diária** | Diário ANTES do placar — 3 linhas: o que senti de verdade, o que evitei, onde fui genuíno (não útil). Só depois olhar o anel. |
| **Diária** | Um ponto invisível por dia: uma ação que vale zero XP e ninguém vê. Treina agir sem plateia. |
| **Semanal** | Revisão de domingo com script fixo: reler humores; "onde performei para ser visto vs. o que era real"; escolher 1 de 5 sugestões (as outras morrem sem culpa). |
| **Semanal** | 1 rest day declarado de véspera, tratado como vitória. Proibido treino-lixo para salvar rank. |
| **Semanal** | Bloco de vínculo sem ROI: encontro sem agenda, registrar "com quem e o que senti", não "o que rendeu". |
| **Mensal** | Auditoria de vaidade: qual métrica inflei? Qual dia FORJADO foi mentira? O humor confirma o placar? |
| **Mensal** | Fechamento de aprendizado: item sem mudança de comportamento não conta como lido. |
| **Trimestral** | Recalibração da Forja (meio dia fora): reler diários, matar hábitos-teatro, revisar protocolo com médico, e **declarar 1 área onde aceitará ser mediano**. |

## 7. Complementos de sistema para a evolução pessoal (Fase 5 sugerida)

1. **Rebalancear o motor de score**: diário pontua por profundidade; teto no
   bônus de tarefas (máx +15/dia) e bônus fora do XP; rest day planejado vale
   ponto cheio.
2. **Prompts rotativos no diário + alerta de dissonância**: se pct ≥70 e humor
   ≤2.5 por 5+ dias → aviso persistente "placar alto, tanque vazio" em vez de
   celebrar streak.
3. **Loop de fechamento nas sugestões**: status consumido→aplicado com "o que
   mudou na prática" obrigatório; IA reduz a 3 sugestões se 5+ pendentes.
4. **Módulo leve de Vínculos**: registro de interações significativas com chip
   no dashboard — torna pontuável a área que o 3w2 mais negligencia.
5. **Conquistas anti-3 + relatório-espelho mensal**: "Voltou depois da queda",
   "Semana humana", "Fechou o loop"; e uma edge function mensal que cruza
   placar × humor × diário e devolve um espelho via Claude — que confronta em
   vez de parabenizar.

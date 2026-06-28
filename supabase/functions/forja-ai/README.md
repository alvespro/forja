# forja-ai — Edge Function

Edge Function com 4 agentes de IA (`treino`, `biblioteca`, `coach`, `nutricao`). Cada agente busca
os dados do próprio usuário no Postgres (via RLS, usando o JWT da requisição) e usa esses dados como
contexto para uma chamada à API da Anthropic.

A `ANTHROPIC_API_KEY` só existe como secret da Edge Function — roda no servidor (Deno), nunca é
enviada ao bundle do frontend, e o cliente React nunca tem acesso a ela.

## Configurar a ANTHROPIC_API_KEY

1. Gere uma chave em https://console.anthropic.com/settings/keys.
2. No painel do Supabase do projeto (`devwqshyiatvhwrudfpa`): **Edge Functions → Manage secrets**
   (ou **Project Settings → Edge Functions → Secrets**).
3. Adicione um secret chamado `ANTHROPIC_API_KEY` com o valor da chave gerada.
4. Ou via Supabase CLI, a partir da raiz do projeto:

   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

`SUPABASE_URL` e `SUPABASE_ANON_KEY` já existem automaticamente em toda Edge Function — não
precisam ser configurados manualmente.

## Deploy

```bash
supabase functions deploy forja-ai
```

(ou via MCP do Supabase: `deploy_edge_function`).

## Contrato da função

`POST /functions/v1/forja-ai`, com `Authorization: Bearer <jwt-do-usuario>` (o cliente
`supabase-js` já envia isso automaticamente em `supabase.functions.invoke`).

Body:

```json
{ "agente": "treino" | "biblioteca" | "coach" | "nutricao", "pergunta": "..." }
```

Resposta:

```json
{ "resposta": "..." }
```

ou `{ "error": "..." }` com status 4xx/5xx.

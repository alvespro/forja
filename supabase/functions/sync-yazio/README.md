# sync-yazio — Edge Function

Sincroniza diariamente o diário de refeições do Yazio (API não-oficial e reversa, sem suporte
oficial da Yazio — pode parar de funcionar se eles mudarem a API) com `meal_logs` do FORJA (Fase
4.5 — Nutrição). Cada item consumido é gravado individualmente, com `meal_slot_id` resolvido pelo
horário mais próximo dentre os slots do plano ativo, e `yazio_sync_id = <id do item no Yazio>`
para upsert idempotente (rodar de novo no mesmo dia não duplica).

## Secrets necessários

Configure em **Edge Functions → sync-yazio → Secrets** (mesmo lugar do `ANTHROPIC_API_KEY`):

- `YAZIO_USERNAME` — o e-mail da conta Yazio
- `YAZIO_PASSWORD` — a senha da conta Yazio
- `YAZIO_CLIENT_ID` e `YAZIO_CLIENT_SECRET` — credenciais do app cliente usado pela API reversa
  do Yazio (não são da sua conta pessoal; são os mesmos valores públicos usados por qualquer
  integração open-source dessa API não-oficial — veja `examples/login.js` em
  [saganos/yazio_public_api](https://github.com/saganos/yazio_public_api) para os valores
  exatos a colar aqui)

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente em
toda Edge Function — não precisam ser configurados.

## Deploy

Via MCP do Supabase (`deploy_edge_function`) ou:

```bash
npx supabase functions deploy sync-yazio
```

## Agendamento diário (06:00 America/Sao_Paulo)

Correção: a versão anterior deste README dizia que o painel "Cron Jobs" cuidava da autenticação
sozinho. Não é bem assim — o padrão oficial do Supabase para chamar uma Edge Function por
`pg_cron`/`pg_net` exige guardar a `service_role key` no **Vault** e referenciá-la por nome no
SQL do job (nunca o valor literal num arquivo versionado). Como essa chave é uma credencial real,
só você pode colá-la — eu não posso digitá-la em nenhum comando.

**Passo 1 — você roda isto uma vez, no SQL Editor do painel** (substituindo pela sua
`service_role key` real, em Project Settings → API):

```sql
select vault.create_secret('SUA_SERVICE_ROLE_KEY_AQUI', 'service_role_key');
```

**Passo 2 — isto pode ir numa migration versionada** (não tem nenhum segredo literal, só a
referência por nome ao que foi guardado no Vault no passo 1):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sync-yazio-daily',
  '0 9 * * *', -- 06:00 America/Sao_Paulo (UTC-3, sem horário de verão desde 2019)
  $$
  select net.http_post(
    url := 'https://devwqshyiatvhwrudfpa.supabase.co/functions/v1/sync-yazio',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

A function já reconhece esse JWT (`role: service_role`) e autoriza o sync sem precisar de
nenhum outro segredo além do que já existe.

## Contrato da função

`POST /functions/v1/sync-yazio`, autenticado por (a) usuário logado do FORJA ou (b) o Cron Job
nativo do Supabase (`service_role`).

Body opcional: `{ "date": "YYYY-MM-DD" }` — se omitido, sincroniza o dia anterior.

Resposta: `{ "status": "ok" | "erro", "sincronizados": number, "error"?: string }`

## Por que não busco direto via `npx yazio-mcp`

`yazio-mcp` é um servidor MCP feito para ser chamado por um cliente MCP (Claude Desktop, Claude
Code etc.) via stdio — não é uma lib HTTP para importar num backend, e Edge Functions do Supabase
(Deno, sandboxed) não suportam `npx`/spawnar processos Node. Em vez disso, esta function reimplementa
diretamente as chamadas HTTP da mesma API reversa do Yazio que o `yazio-mcp` usa por baixo dos panos
(login OAuth2 em `/oauth/token`, diário em `/user/consumed-items`, detalhe de produto em `/products/{id}`).

# Apple Health → FORJA (via Shortcut do iPhone)

A edge function `apple-health-sync` recebe o resumo diário do Apple Health
e distribui nos módulos do FORJA:

| Campo do payload | Destino |
|---|---|
| `peso_kg` | `body_metrics` (só insere se ainda não houver medição na data) |
| `fc_repouso`, `vo2max`, `passos`, `calorias_ativas`, `calorias_totais`, `distancia_km`, `minutos_em_pe` | `activity_logs` (upsert por dia) |
| `sono { ... }` | `sleep_logs` (upsert por dia) |
| `hidratacao_ml` | `apple_health_imports` (tipo `hidratacao`) |
| `pressao_sistolica` + `pressao_diastolica` | `apple_health_imports` (2 registros) **e** `health_metrics` (histórico/alertas) |

## Endpoint

```
POST https://devwqshyiatvhwrudfpa.supabase.co/functions/v1/apple-health-sync
Authorization: Bearer {PUBLISHABLE_KEY}   ← chave pública do projeto (fixa, nunca expira; só passa no gateway)
X-Forja-Secret: {APPLE_HEALTH_SECRET}     ← a autenticação real (env var da função)
Content-Type: application/json
```

Body (campos ausentes/null são simplesmente ignorados; `user_id` é obrigatório):

```json
{
  "tipo": "daily_summary",
  "data": "2026-06-29",
  "user_id": "778d59c3-0313-409e-a7ed-a6fcd2bcaadf",
  "peso_kg": 84.4,
  "fc_repouso": 62,
  "vo2max": 38.5,
  "passos": 8432,
  "calorias_ativas": 520,
  "calorias_totais": 2180,
  "distancia_km": 6.2,
  "minutos_em_pe": 8,
  "sono": {
    "hora_dormir": "22:45",
    "hora_acordar": "05:00",
    "duracao_min": 375,
    "sono_profundo_min": 89,
    "sono_rem_min": 94,
    "sono_leve_min": 192,
    "acordou_vezes": 2
  },
  "hidratacao_ml": 1800,
  "pressao_sistolica": 118,
  "pressao_diastolica": 76
}
```

Resposta de sucesso: `{ "sincronizados": N, "data": "YYYY-MM-DD", "status": "ok" }`
Erros: `401` (secret inválido), `400` (body malformado ou sem user_id, com
mensagem clara), `500` (erro de banco, logado na function).

## Autenticação (secret fixo — sem JWT que expira)

Shortcuts não gerenciam renovação de JWT, então a função usa um **secret
fixo** (`APPLE_HEALTH_SECRET`, env var da função) + `user_id` explícito no
body. Nenhum dos valores expira — configura uma vez e esquece:

1. `Authorization: Bearer {publishable key}` — a mesma chave pública do app
   (Settings → API Keys). Só serve para passar no gateway do Supabase.
2. `X-Forja-Secret: {secret}` — valor gerado e configurado via
   `supabase secrets set APPLE_HEALTH_SECRET=...`. É a autenticação real:
   sem ele (ou errado), a função responde 401 antes de tocar no banco.
3. `user_id` no body — UUID do usuário (Authentication → Users → ID).

> Para rotacionar o secret: gere outro valor, rode
> `npx supabase secrets set APPLE_HEALTH_SECRET=<novo>` e atualize o
> Shortcut. O anterior deixa de valer no próximo cold start da função.

## Montando o Shortcut (resumo)

1. **Obter dados de saúde** (ações "Find Health Sample" para cada métrica
   do dia: peso, passos, FC de repouso, sono etc.)
2. **Dicionário** com o formato do body acima (data = data de hoje
   formatada `yyyy-MM-dd`, user_id fixo)
3. **Obter conteúdo da URL**: método POST, headers `Authorization: Bearer
   {publishable key}` + `X-Forja-Secret: {secret}`, corpo = dicionário JSON
4. **Obter valor de "status"** do dicionário da resposta e **Se status = ok**
   → notificação "FORJA ✅ [sincronizados] dados" / senão → "FORJA ⚠️ falhou"
5. Automação pessoal: rodar todo dia às 06h (após acordar, com o sono do
   dia anterior consolidado)

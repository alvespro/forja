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
Authorization: Bearer {APPLE_HEALTH_TOKEN}
Content-Type: application/json
```

Body (campos ausentes/null são simplesmente ignorados):

```json
{
  "tipo": "daily_summary",
  "data": "2026-06-29",
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
Erros: `401` (token inválido/expirado), `400` (body malformado, com mensagem),
`500` (erro de banco, logado na function).

## Obtendo o APPLE_HEALTH_TOKEN

O token é o **Access Token (JWT) da sessão ativa** do seu usuário:

1. Abra o dashboard do Supabase → **Authentication → Users**
2. Clique no seu usuário (welberalves14@gmail.com)
3. Copie o **Access Token** da sessão ativa
4. Cole no Shortcut como header `Authorization: Bearer {token}`

> ⚠️ **Importante — validade do token**: o access token de sessão **expira**
> (por padrão em 1 hora). Para um Shortcut que roda todo dia, isso significa
> reconfigurar o token com frequência. Alternativas melhores quando isso
> incomodar:
> 1. **Refresh no Shortcut**: guardar o `refresh_token` e fazer o Shortcut
>    chamar `POST /auth/v1/token?grant_type=refresh_token` antes do sync
>    (2 ações a mais no Shortcut, token sempre válido).
> 2. Aumentar o JWT expiry do projeto (Authentication → Settings), com o
>    trade-off de segurança correspondente.

## Montando o Shortcut (resumo)

1. **Obter dados de saúde** (ações "Find Health Sample" para cada métrica
   do dia: peso, passos, FC de repouso, sono etc.)
2. **Dicionário** com o formato do body acima (data = data de hoje
   formatada `yyyy-MM-dd`)
3. **Obter conteúdo da URL**: método POST, header
   `Authorization: Bearer {token}`, corpo = dicionário como JSON
4. (Opcional) **Mostrar notificação** com o campo `sincronizados` da resposta
5. Automação pessoal: rodar todo dia às 06h (após acordar, com o sono do
   dia anterior consolidado)

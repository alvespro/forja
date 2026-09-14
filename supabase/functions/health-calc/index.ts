// health-calc — cálculos clínicos via Health Calculator API (RapidAPI), com
// cálculo local como fonte da classificação e fallback.
// POST { endpoint, params } → resultado + gravação (health_metrics_derived ou recovery_scores).
// O usuário vem do JWT; um user_id no corpo só é aceito se for o mesmo.
// A API não publica schema: o valor dela só é usado quando concorda com o
// cálculo local (protege contra unidade trocada); senão fica o local.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

import {
  cholesterolRatios,
  classifyHomaIr,
  classifyRecovery,
  concorda,
  findNumber,
  homaIr,
  karvonenZones,
  recompForecast,
  recoveryScore,
  FC_REPOUSO_BASE,
} from '../_shared/health-calc.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const HEALTH_CALC_API_KEY = Deno.env.get('HEALTH_CALC_API_KEY')

const BASE_URL = 'https://health-calculator-api.p.rapidapi.com'
const RAPIDAPI_HOST = 'health-calculator-api.p.rapidapi.com'
const API_TIMEOUT_MS = 8000

// Caminhos confirmados na RapidAPI em 14/09/2026. HOMA-IR, ratios e Karvonen
// existem (plano gratuito responde "disabled for your subscription"); recomposição
// e recuperação só existem na plataforma enterprise (api.hefitapi.com) — ficam
// aqui para passar a funcionar se forem publicados na RapidAPI.
const API_PATHS = {
  homa_ir: { path: '/homa-ir-calculator', method: 'GET' },
  cholesterol_ratio: { path: '/cholesterol-ratio-calculator', method: 'POST' },
  recomp_forecast: { path: '/body-recomposition', method: 'POST' },
  karvonen: { path: '/karvonen', method: 'GET' },
  recovery_score: { path: '/daily-recovery-score', method: 'POST' },
} as const

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

class ParamError extends Error {}

// deno-lint-ignore no-explicit-any
type Params = Record<string, any>

function num(params: Params, key: string, label: string, opts: { min?: number; max?: number; optional?: boolean } = {}) {
  const raw = params[key]
  if (raw == null || raw === '') {
    if (opts.optional) return null
    throw new ParamError(`Parâmetro obrigatório ausente: ${label} (${key}).`)
  }
  const n = typeof raw === 'string' ? Number(raw.replace(',', '.')) : raw
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new ParamError(`${label} precisa ser um número.`)
  if ((opts.min != null && n < opts.min) || (opts.max != null && n > opts.max)) {
    throw new ParamError(`${label} fora da faixa esperada (${opts.min ?? '−∞'} a ${opts.max ?? '∞'}).`)
  }
  return n
}

type ApiResult = { ok: true; path: string; body: unknown } | { ok: false; motivo: string }

/** Chama a API com timeout de 8s. Qualquer falha vira `ok: false` — o chamador cai no cálculo local. */
async function callApi(endpoint: keyof typeof API_PATHS, params: Params): Promise<ApiResult> {
  if (!HEALTH_CALC_API_KEY) return { ok: false, motivo: 'HEALTH_CALC_API_KEY não configurada' }
  const { path, method } = API_PATHS[endpoint]
  const query = method === 'GET' ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : ''
  try {
    const res = await fetch(`${BASE_URL}${path}${query}`, {
      method,
      headers: {
        'X-RapidAPI-Key': HEALTH_CALC_API_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(params) : undefined,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })
    if (!res.ok) {
      const texto = (await res.text()).slice(0, 200)
      if (res.status === 404) return { ok: false, motivo: 'endpoint indisponível na RapidAPI' }
      if (/disabled for your subscription/i.test(texto)) return { ok: false, motivo: 'endpoint fora do plano da RapidAPI' }
      return { ok: false, motivo: `HTTP ${res.status}: ${texto}` }
    }
    return { ok: true, path, body: await res.json() }
  } catch (err) {
    return { ok: false, motivo: err instanceof Error && err.name === 'TimeoutError' ? 'timeout (8s)' : 'API fora do ar' }
  }
}

function meta(api: ApiResult, usouApi: boolean) {
  return {
    fonte: usouApi ? 'api' : 'local',
    offline_fallback: !usouApi,
    api_status: api.ok ? `ok (${api.path})` : api.motivo,
  }
}

async function salvarDerivado(
  sb: SupabaseClient,
  userId: string,
  row: { tipo: string; valor: number | null; interpretacao: string; risco: string | null; dados_input: Params; dados_output: unknown },
) {
  const { data, error } = await sb
    .from('health_metrics_derived')
    .insert({ user_id: userId, ...row })
    .select('id, calculado_em')
    .single()
  if (error) throw error
  return data
}

// ─────────────────────────────── endpoints ───────────────────────────────

async function handleHomaIr(sb: SupabaseClient, userId: string, params: Params) {
  const glucose = num(params, 'glucose', 'Glicemia em jejum (mg/dL)', { min: 20, max: 600 })!
  const insulin = num(params, 'insulin', 'Insulina em jejum (µUI/mL)', { min: 0.1, max: 300 })!

  const local = homaIr(glucose, insulin)
  const api = await callApi('homa_ir', { glucose, insulin })
  const apiValor = api.ok ? findNumber(api.body, /homa|result|value/i) : null
  const usouApi = concorda(apiValor, local)
  const valor = usouApi ? Math.round(apiValor! * 100) / 100 : local
  const { risco, interpretacao } = classifyHomaIr(valor)

  const output = { valor, risco, interpretacao, ...meta(api, usouApi), api_resposta: api.ok ? api.body : null }
  const saved = await salvarDerivado(sb, userId, {
    tipo: 'homa_ir',
    valor,
    interpretacao,
    risco,
    dados_input: { glucose, insulin },
    dados_output: output,
  })
  return { ...output, id: saved.id, calculado_em: saved.calculado_em }
}

async function handleCholesterolRatio(sb: SupabaseClient, userId: string, params: Params) {
  const tc = num(params, 'tc', 'Colesterol total (mg/dL)', { min: 50, max: 600 })!
  const hdl = num(params, 'hdl', 'HDL (mg/dL)', { min: 5, max: 200 })!
  const ldl = num(params, 'ldl', 'LDL (mg/dL)', { min: 10, max: 500 })!
  const tg = num(params, 'tg', 'Triglicerídeos (mg/dL)', { min: 10, max: 3000, optional: true })

  const local = cholesterolRatios(tc, hdl, ldl, tg)
  const body: Params = { tc, hdl, ldl, ...(tg != null ? { tg } : {}) }
  const api = await callApi('cholesterol_ratio', body)
  const apiTcHdl = api.ok ? findNumber(api.body, /(tc|total).*hdl/i) : null
  const usouApi = concorda(apiTcHdl, local.tc_hdl.valor, 0.05)

  const output = { ...local, ...meta(api, usouApi), api_resposta: api.ok ? api.body : null }
  const saved = await salvarDerivado(sb, userId, {
    tipo: 'cholesterol_ratio',
    valor: local.tc_hdl.valor,
    interpretacao: local.interpretacao,
    risco: local.risco,
    dados_input: body,
    dados_output: output,
  })
  return { ...output, id: saved.id, calculado_em: saved.calculado_em }
}

async function handleRecompForecast(sb: SupabaseClient, userId: string, params: Params) {
  const input = {
    weight: num(params, 'weight', 'Peso (kg)', { min: 30, max: 300 })!,
    body_fat_pct: num(params, 'body_fat_pct', 'Gordura corporal (%)', { min: 3, max: 70 })!,
    protein_g: num(params, 'protein_g', 'Proteína diária (g) do plano alimentar', { min: 0, max: 600 })!,
    calories: num(params, 'calories', 'Calorias diárias do plano alimentar', { min: 800, max: 8000 })!,
    weeks: num(params, 'weeks', 'Semanas', { min: 1, max: 104, optional: true }) ?? 12,
    training_days_week: num(params, 'training_days_week', 'Dias de treino por semana', { min: 0, max: 7, optional: true }) ?? 4,
  }

  const local = recompForecast(input)
  const api = await callApi('recomp_forecast', { ...input, goal: 'recomposition' })
  const apiGordura = api.ok ? findNumber(api.body, /fat.*(change|loss|kg)/i) : null
  const apiMusculo = api.ok ? findNumber(api.body, /(muscle|lean).*(change|gain|kg)/i) : null
  const apiProb = api.ok ? findNumber(api.body, /probab/i) : null
  const usouApi = apiGordura !== null && apiMusculo !== null
  const resultado = usouApi
    ? {
        ...local,
        gordura_kg: -Math.abs(apiGordura!),
        musculo_kg: Math.abs(apiMusculo!),
        probabilidade: apiProb != null ? Math.round(apiProb <= 1 ? apiProb * 100 : apiProb) : local.probabilidade,
      }
    : local

  const output = { ...resultado, ...meta(api, usouApi), api_resposta: api.ok ? api.body : null }
  const saved = await salvarDerivado(sb, userId, {
    tipo: 'recomp_forecast',
    valor: resultado.probabilidade,
    interpretacao: `Em ${resultado.semanas} semanas: gordura ${resultado.gordura_kg} kg, músculo +${resultado.musculo_kg} kg`,
    risco: null,
    dados_input: input,
    dados_output: output,
  })
  return { ...output, id: saved.id, calculado_em: saved.calculado_em }
}

async function handleKarvonen(sb: SupabaseClient, userId: string, params: Params) {
  const age = num(params, 'age', 'Idade', { min: 10, max: 100 })!
  const resting_hr = num(params, 'resting_hr', 'FC de repouso (bpm)', { min: 30, max: 120 })!

  const zonas = karvonenZones(age, resting_hr)
  const api = await callApi('karvonen', { age, resting_hr })
  // A API só "confirma" as zonas se a FC máxima dela bater com a nossa (220 − idade).
  const apiMax = api.ok ? findNumber(api.body, /max/i) : null
  const usouApi = concorda(apiMax, 220 - age, 0.05)

  const output = { idade: age, fc_repouso: resting_hr, fc_maxima: 220 - age, zonas, ...meta(api, usouApi), api_resposta: api.ok ? api.body : null }
  const saved = await salvarDerivado(sb, userId, {
    tipo: 'karvonen_zones',
    valor: resting_hr,
    interpretacao: `Zonas Karvonen — ${age} anos, FC repouso ${resting_hr} bpm`,
    risco: null,
    dados_input: { age, resting_hr },
    dados_output: output,
  })
  return { ...output, id: saved.id, calculado_em: saved.calculado_em }
}

async function handleRecoveryScore(sb: SupabaseClient, userId: string, params: Params) {
  const sono = num(params, 'sleep_hours', 'Horas de sono', { min: 0, max: 16 })!
  const disposicao = num(params, 'muscle_soreness', 'Disposição / dor muscular (1 a 5)', { min: 1, max: 5 })!
  const fc = num(params, 'resting_hr', 'FC de repouso (bpm)', { min: 30, max: 120, optional: true }) ?? FC_REPOUSO_BASE
  const volume = num(params, 'training_load', 'Volume de ontem (kg)', { min: 0, max: 500000, optional: true })
  const data = typeof params.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : null
  if (!data) throw new ParamError('Parâmetro obrigatório ausente: data do dia (AAAA-MM-DD).')

  const local = recoveryScore({ sono_horas: sono, disposicao: Math.round(disposicao), fc_repouso: fc, volume_ontem: volume })
  // A API usa dor muscular 1–10 (10 = muita dor); o FORJA registra disposição 1–5.
  const api = await callApi('recovery_score', {
    sleep_hours: sono,
    resting_hr: fc,
    muscle_soreness: (6 - Math.round(disposicao)) * 2,
    training_load_yesterday: volume ?? 0,
  })
  const apiScore = api.ok ? findNumber(api.body, /recovery.*score|readiness|^score$/i) : null
  const usouApi = apiScore !== null && apiScore >= 0 && apiScore <= 100
  const score = usouApi ? Math.round(apiScore!) : local.score
  const { classificacao, recomendacao } = classifyRecovery(score)

  const row = {
    user_id: userId,
    data,
    score,
    classificacao,
    recomendacao,
    sono_horas: sono,
    fc_repouso: fc,
    dor_muscular: 6 - Math.round(disposicao),
    volume_ontem: volume,
    componentes: { ...local.componentes, ...meta(api, usouApi) },
  }
  const { error } = await sb.from('recovery_scores').upsert(row, { onConflict: 'user_id,data' })
  if (error) throw error
  return { score, classificacao, recomendacao, componentes: local.componentes, ...meta(api, usouApi) }
}

/** Diagnóstico para Configurações: quais endpoints o plano da RapidAPI libera. Não grava nada. */
async function handleStatus() {
  const amostras: [keyof typeof API_PATHS, Params][] = [
    ['homa_ir', { glucose: 90, insulin: 8 }],
    ['cholesterol_ratio', { tc: 180, hdl: 50, ldl: 100 }],
    ['recomp_forecast', { weight: 80, body_fat_pct: 20, goal: 'recomposition' }],
    ['karvonen', { age: 32, resting_hr: 62 }],
    ['recovery_score', { sleep_hours: 7, resting_hr: 62, muscle_soreness: 4 }],
  ]
  const endpoints = await Promise.all(
    amostras.map(async ([endpoint, params]) => {
      const api = await callApi(endpoint, params)
      return { endpoint, disponivel: api.ok, detalhe: api.ok ? 'ok' : api.motivo }
    }),
  )
  return { chave_configurada: !!HEALTH_CALC_API_KEY, endpoints }
}

const HANDLERS: Record<string, (sb: SupabaseClient, userId: string, params: Params) => Promise<unknown>> = {
  homa_ir: handleHomaIr,
  cholesterol_ratio: handleCholesterolRatio,
  recomp_forecast: handleRecompForecast,
  karvonen: handleKarvonen,
  recovery_score: handleRecoveryScore,
  status: handleStatus,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonResponse({ error: 'Use POST.' }, 405)

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    // Cliente com o JWT do usuário: as gravações passam pelo RLS.
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const {
      data: { user },
    } = await sb.auth.getUser()
    if (!user) return jsonResponse({ error: 'Não autenticado.' }, 401)

    let body: Params
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Corpo da requisição precisa ser JSON.' }, 400)
    }
    if (body.user_id && body.user_id !== user.id) return jsonResponse({ error: 'user_id não corresponde à sessão.' }, 403)

    const handler = HANDLERS[String(body.endpoint)]
    if (!handler) {
      return jsonResponse({ error: `Endpoint inválido. Use: ${Object.keys(HANDLERS).join(', ')}.` }, 400)
    }
    const params = body.params && typeof body.params === 'object' ? body.params : {}
    return jsonResponse(await handler(sb, user.id, params))
  } catch (err) {
    if (err instanceof ParamError) return jsonResponse({ error: err.message }, 400)
    console.error('health-calc', err)
    return jsonResponse({ error: 'Falha ao calcular. Tente novamente.' }, 500)
  }
})

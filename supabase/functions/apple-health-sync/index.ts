// apple-health-sync — recebe o resumo diário do Apple Health via Shortcut
// do iPhone e distribui os dados nas tabelas do FORJA.
// Autenticação: Bearer token (JWT de sessão do usuário) — ver docs/APPLE_HEALTH.md.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

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

type SonoPayload = {
  hora_dormir?: string
  hora_acordar?: string
  duracao_min?: number
  sono_profundo_min?: number
  sono_rem_min?: number
  sono_leve_min?: number
  acordou_vezes?: number
}

type DailySummary = {
  tipo?: string
  data?: string
  peso_kg?: number
  fc_repouso?: number
  vo2max?: number
  passos?: number
  calorias_ativas?: number
  calorias_totais?: number
  distancia_km?: number
  minutos_em_pe?: number
  sono?: SonoPayload
  hidratacao_ml?: number
  pressao_sistolica?: number
  pressao_diastolica?: number
}

/** Aceita apenas números finitos — Shortcuts às vezes manda "" ou strings. */
function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonResponse({ status: 'erro', error: 'Use POST' }, 405)

  try {
    // ── 1-2. Validar JWT e extrair usuário ──
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ status: 'erro', error: 'Header Authorization: Bearer {token} obrigatório' }, 401)
    }
    const sbAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await sbAuth.auth.getUser()
    if (!user) return jsonResponse({ status: 'erro', error: 'Token inválido ou expirado' }, 401)

    // ── Validar body ──
    const body: DailySummary | null = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return jsonResponse({ status: 'erro', error: 'Body JSON malformado' }, 400)
    }
    if (body.tipo !== 'daily_summary') {
      return jsonResponse({ status: 'erro', error: `tipo deve ser "daily_summary" (recebido: ${body.tipo ?? 'nenhum'})` }, 400)
    }
    if (!body.data || !/^\d{4}-\d{2}-\d{2}$/.test(body.data)) {
      return jsonResponse({ status: 'erro', error: 'data deve estar no formato YYYY-MM-DD' }, 400)
    }

    const data = body.data
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    let sincronizados = 0

    // ── 3a. Peso → body_metrics (só se ainda não houver medição na data) ──
    const peso = num(body.peso_kg)
    if (peso !== null) {
      const { data: existing, error: findError } = await sb
        .from('body_metrics')
        .select('id')
        .eq('user_id', user.id)
        .eq('medido_em', data)
        .maybeSingle()
      if (findError) throw findError
      if (!existing) {
        const { error } = await sb
          .from('body_metrics')
          .insert({ user_id: user.id, medido_em: data, peso_kg: peso })
        if (error) throw error
        sincronizados++
      }
    }

    // ── 3b. Atividade → activity_logs (upsert por user_id+data) ──
    const atividade = {
      fc_repouso: num(body.fc_repouso),
      vo2max: num(body.vo2max),
      passos: num(body.passos),
      calorias_ativas: num(body.calorias_ativas),
      calorias_totais: num(body.calorias_totais),
      distancia_km: num(body.distancia_km),
      minutos_em_pe: num(body.minutos_em_pe),
    }
    const camposAtividade = Object.fromEntries(
      Object.entries(atividade).filter(([, v]) => v !== null),
    )
    if (Object.keys(camposAtividade).length > 0) {
      const { error } = await sb
        .from('activity_logs')
        .upsert(
          { user_id: user.id, data, ...camposAtividade, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,data' },
        )
      if (error) throw error
      sincronizados += Object.keys(camposAtividade).length
    }

    // ── 3c. Sono → sleep_logs (upsert por user_id+data) ──
    if (body.sono && typeof body.sono === 'object') {
      const sono = {
        hora_dormir: body.sono.hora_dormir ?? null,
        hora_acordar: body.sono.hora_acordar ?? null,
        duracao_min: num(body.sono.duracao_min),
        sono_profundo_min: num(body.sono.sono_profundo_min),
        sono_rem_min: num(body.sono.sono_rem_min),
        sono_leve_min: num(body.sono.sono_leve_min),
        acordou_vezes: num(body.sono.acordou_vezes),
      }
      const temAlgo = Object.values(sono).some((v) => v !== null)
      if (temAlgo) {
        const { error } = await sb
          .from('sleep_logs')
          .upsert(
            { user_id: user.id, data, ...sono, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,data' },
          )
        if (error) throw error
        sincronizados++
      }
    }

    // ── 3d. Hidratação → apple_health_imports ──
    const hidratacao = num(body.hidratacao_ml)
    if (hidratacao !== null) {
      const { error } = await sb
        .from('apple_health_imports')
        .insert({ user_id: user.id, data, tipo: 'hidratacao', valor: hidratacao })
      if (error) throw error
      sincronizados++
    }

    // ── 3e. Pressão → apple_health_imports + health_metrics ──
    const sistolica = num(body.pressao_sistolica)
    const diastolica = num(body.pressao_diastolica)
    if (sistolica !== null && diastolica !== null) {
      const { error: impError } = await sb.from('apple_health_imports').insert([
        { user_id: user.id, data, tipo: 'pressao_sistolica', valor: sistolica },
        { user_id: user.id, data, tipo: 'pressao_diastolica', valor: diastolica },
      ])
      if (impError) throw impError

      const { error: hmError } = await sb.from('health_metrics').insert([
        { user_id: user.id, chave: 'pressao_sistolica', valor: sistolica, measured_at: data },
        { user_id: user.id, chave: 'pressao_diastolica', valor: diastolica, measured_at: data },
      ])
      if (hmError) throw hmError
      sincronizados += 2
    }

    return jsonResponse({ sincronizados, data, status: 'ok' })
  } catch (e) {
    console.error('apple-health-sync error:', e)
    return jsonResponse(
      { status: 'erro', error: e instanceof Error ? e.message : String(e) },
      500,
    )
  }
})

// Cálculos clínicos locais do FORJA — fonte da verdade da classificação e
// fallback quando a Health Calculator API está fora/estourou o timeout.
// Puro (sem Deno/DOM): importado pela Edge Function health-calc e pelo app.

export type Risco = 'baixo' | 'intermediario' | 'alto' | 'critico'
export type StatusRatio = 'ok' | 'atencao' | 'alerta'

const round = (n: number, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// ───────────────────────────── HOMA-IR ─────────────────────────────

/** HOMA-IR = glicemia (mg/dL) × insulina (µUI/mL) / 405. */
export function homaIr(glicemiaMgDl: number, insulina: number): number {
  return round((glicemiaMgDl * insulina) / 405)
}

export function classifyHomaIr(valor: number): { risco: Risco; interpretacao: string } {
  if (valor < 1.5) return { risco: 'baixo', interpretacao: 'Sensibilidade à insulina normal' }
  if (valor < 2.5) return { risco: 'intermediario', interpretacao: 'Resistência à insulina leve — monitorar' }
  if (valor <= 5) return { risco: 'alto', interpretacao: 'Resistência à insulina — intervenção recomendada' }
  return { risco: 'critico', interpretacao: 'Resistência à insulina severa — consulte médico' }
}

// ───────────────────────── Ratios lipídicos ─────────────────────────

export type Ratio = { valor: number; status: StatusRatio; faixa: string }
export type CholesterolRatios = {
  tc_hdl: Ratio
  ldl_hdl: Ratio
  tg_hdl: Ratio | null
  risco: Risco
  interpretacao: string
}

function ratio(valor: number, ok: number, atencao: number): Ratio {
  const v = round(valor, 1)
  const status: StatusRatio = v < ok ? 'ok' : v <= atencao ? 'atencao' : 'alerta'
  return { valor: v, status, faixa: `ideal < ${String(ok).replace('.', ',')}` }
}

/** TC/HDL, LDL/HDL e TG/HDL (mg/dL). TG é opcional — sem ele o terceiro ratio fica null. */
export function cholesterolRatios(tc: number, hdl: number, ldl: number, tg?: number | null): CholesterolRatios {
  const tc_hdl = ratio(tc / hdl, 4, 5)
  const ldl_hdl = ratio(ldl / hdl, 2.5, 3.5)
  const tg_hdl = tg != null && tg > 0 ? ratio(tg / hdl, 2, 4) : null

  const todos = [tc_hdl, ldl_hdl, tg_hdl].filter((r): r is Ratio => r !== null)
  const alertas = todos.filter((r) => r.status === 'alerta').length
  const atencoes = todos.filter((r) => r.status === 'atencao').length
  const risco: Risco = alertas >= 2 ? 'critico' : alertas === 1 ? 'alto' : atencoes > 0 ? 'intermediario' : 'baixo'
  const interpretacao =
    risco === 'baixo'
      ? 'Perfil lipídico dentro das faixas ideais'
      : risco === 'intermediario'
        ? 'Ratios limítrofes — monitorar no próximo exame'
        : risco === 'alto'
          ? 'Ratio elevado — risco cardiovascular aumentado'
          : 'Vários ratios elevados — converse com seu médico'

  return { tc_hdl, ldl_hdl, tg_hdl, risco, interpretacao }
}

// ─────────────────────────── Zonas de FC ───────────────────────────

export type ZonaFc = { zona: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'; nome: string; min: number; max: number }

const ZONAS: { zona: ZonaFc['zona']; nome: string; de: number; ate: number }[] = [
  { zona: 'Z1', nome: 'Recuperação', de: 0.5, ate: 0.6 },
  { zona: 'Z2', nome: 'Aeróbico base', de: 0.6, ate: 0.7 },
  { zona: 'Z3', nome: 'Tempo', de: 0.7, ate: 0.8 },
  { zona: 'Z4', nome: 'Limiar', de: 0.8, ate: 0.9 },
  { zona: 'Z5', nome: 'VO₂ máx', de: 0.9, ate: 1 },
]

export function fcMaxima(idade: number): number {
  return 220 - idade
}

/** Karvonen: alvo = FC repouso + % × (FC máx − FC repouso). */
export function karvonenZones(idade: number, fcRepouso: number): ZonaFc[] {
  const max = fcMaxima(idade)
  const reserva = max - fcRepouso
  return ZONAS.map(({ zona, nome, de, ate }) => ({
    zona,
    nome,
    min: Math.round(fcRepouso + de * reserva),
    max: Math.round(fcRepouso + ate * reserva),
  }))
}

/** Fórmula simples (% da FC máxima), usada enquanto não há zonas Karvonen salvas. */
export function simpleZones(idade: number): ZonaFc[] {
  const max = fcMaxima(idade)
  return ZONAS.map(({ zona, nome, de, ate }) => ({ zona, nome, min: Math.round(de * max), max: Math.round(ate * max) }))
}

// ───────────────────────── Score de recuperação ─────────────────────────

export type RecoveryInput = {
  sono_horas: number
  /** Disposição 1 (péssimo) → 5 (ótimo). Dor muscular = 6 − disposição. */
  disposicao: number
  fc_repouso?: number | null
  /** FC de repouso habitual; acima dela a recuperação cai. */
  fc_base?: number
  /** Volume de ontem (Σ carga × reps, em kg). */
  volume_ontem?: number | null
}

export type RecoveryResult = {
  score: number
  classificacao: string
  recomendacao: string
  componentes: { sono: number; disposicao: number; fc: number; carga: number }
}

export const FC_REPOUSO_BASE = 62

export function classifyRecovery(score: number): { classificacao: string; recomendacao: string } {
  if (score >= 80) return { classificacao: '🟢 Treino pesado recomendado', recomendacao: 'Corpo pronto: siga o treino como prescrito.' }
  if (score >= 60) return { classificacao: '🟡 Treino moderado', recomendacao: 'Treine, mas segure a intensidade (RPE ≤ 8).' }
  if (score >= 40)
    return { classificacao: '🟠 Treino leve ou técnica', recomendacao: 'Versão leve: −30% de carga, foco em técnica e mobilidade.' }
  return { classificacao: '🔴 Descanso ativo', recomendacao: 'Descanso ativo: caminhada leve em Z1 e alongamento.' }
}

/**
 * Composto 0–100: sono 40% (8h = 100, 4h = 0), disposição 35%, FC de repouso 15%
 * (−10 pontos por bpm acima da base) e carga de ontem 10% (0 kg = 100, 20 t = 40).
 */
export function recoveryScore(input: RecoveryInput): RecoveryResult {
  const sono = clamp(((input.sono_horas - 4) / 4) * 100, 0, 100)
  const disposicao = clamp(((input.disposicao - 1) / 4) * 100, 0, 100)
  const base = input.fc_base ?? FC_REPOUSO_BASE
  const fc = input.fc_repouso == null ? 100 : clamp(100 - Math.max(0, input.fc_repouso - base) * 10, 0, 100)
  const carga = input.volume_ontem == null ? 100 : clamp(100 - (input.volume_ontem / 20000) * 60, 40, 100)

  const score = Math.round(sono * 0.4 + disposicao * 0.35 + fc * 0.15 + carga * 0.1)
  return {
    score,
    ...classifyRecovery(score),
    componentes: { sono: Math.round(sono), disposicao: Math.round(disposicao), fc: Math.round(fc), carga: Math.round(carga) },
  }
}

// ─────────────────────── Previsão de recomposição ───────────────────────

export type RecompInput = {
  weight: number
  body_fat_pct: number
  protein_g: number
  calories: number
  weeks?: number
  training_days_week?: number
}

export type RecompForecast = {
  semanas: number
  gordura_kg: number
  musculo_kg: number
  probabilidade: number
  gasto_estimado_kcal: number
  recomendacao: string
}

/**
 * Estimativa grosseira (fallback): gasto por Katch-McArdle × fator de atividade;
 * gordura muda pelo balanço (7.700 kcal/kg); músculo até 0,1 kg/semana, escalado
 * por proteína (alvo 1,8 g/kg), dias de treino (alvo 4) e tamanho do déficit.
 */
export function recompForecast(input: RecompInput): RecompForecast {
  const semanas = input.weeks ?? 12
  const dias = input.training_days_week ?? 4
  const massaMagra = input.weight * (1 - input.body_fat_pct / 100)
  const gasto = (370 + 21.6 * massaMagra) * (1.2 + 0.075 * clamp(dias, 0, 7))
  const balancoDia = input.calories - gasto

  const fatorProteina = clamp(input.protein_g / (1.8 * input.weight), 0, 1)
  const fatorTreino = clamp(dias / 4, 0, 1)
  const fatorDeficit = balancoDia < -500 ? 0.5 : balancoDia < -250 ? 0.8 : 1
  const musculoSemana = 0.1 * fatorProteina * fatorTreino * fatorDeficit

  const gorduraSemana = (balancoDia * 7) / 7700
  const probabilidade = Math.round(
    clamp(30 + fatorProteina * 30 + fatorTreino * 20 + (balancoDia >= -500 && balancoDia <= 0 ? 15 : 0), 5, 95),
  )

  const recomendacao =
    fatorProteina < 0.9
      ? `Suba a proteína para ~${Math.round(1.8 * input.weight)} g/dia`
      : fatorTreino < 1
        ? 'Treine força pelo menos 4x por semana'
        : balancoDia < -500
          ? `Déficit agressivo (${Math.round(balancoDia)} kcal/dia) — suavize para preservar músculo`
          : balancoDia > 300
            ? `Superávit de ${Math.round(balancoDia)} kcal/dia — reduza para não ganhar gordura`
            : 'Mantenha a consistência: proteína, treino e sono'

  return {
    semanas,
    gordura_kg: round(gorduraSemana * semanas, 1),
    musculo_kg: round(musculoSemana * semanas, 1),
    probabilidade,
    gasto_estimado_kcal: Math.round(gasto),
    recomendacao,
  }
}

// ─────────────────────────── Leitura da API ───────────────────────────

/**
 * Procura, em qualquer profundidade da resposta da API, o primeiro número cuja
 * chave casa com o padrão. A API não tem schema publicado — isto evita acoplar
 * o app a um formato que pode mudar.
 */
export function findNumber(obj: unknown, pattern: RegExp): number | null {
  if (obj == null || typeof obj !== 'object') return null
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (pattern.test(key)) {
      const n = typeof value === 'string' ? Number(value) : value
      if (typeof n === 'number' && Number.isFinite(n)) return n
    }
  }
  for (const value of Object.values(obj as Record<string, unknown>)) {
    const found = findNumber(value, pattern)
    if (found !== null) return found
  }
  return null
}

/** Valor da API só é aceito se estiver a até `tolerancia` do cálculo local (unidade trocada, bug etc.). */
export function concorda(api: number | null, local: number, tolerancia = 0.15): boolean {
  if (api === null) return false
  if (local === 0) return Math.abs(api) < 0.01
  return Math.abs(api - local) / Math.abs(local) <= tolerancia
}

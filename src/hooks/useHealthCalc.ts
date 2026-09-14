import { useQueryClient } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'

import { useAuth } from '@/hooks/use-auth'
import type { CholesterolRatios, RecompForecast, Risco, ZonaFc } from '@/lib/health-calc'
import { supabase } from '@/lib/supabase'

/**
 * Cálculos clínicos via Edge Function `health-calc` (Health Calculator API com
 * fallback local). O servidor grava cada resultado; aqui só invalidamos o cache
 * das telas que o exibem. `fonte`/`offline_fallback` dizem se a API respondeu.
 */

type MetaCalculo = { fonte: 'api' | 'local'; offline_fallback: boolean; api_status: string }

export type HomaIrResult = MetaCalculo & { valor: number; risco: Risco; interpretacao: string; calculado_em: string }
export type CholesterolRatioResult = MetaCalculo & CholesterolRatios & { calculado_em: string }
export type RecompForecastResult = MetaCalculo & RecompForecast & { calculado_em: string }
export type KarvonenResult = MetaCalculo & { idade: number; fc_repouso: number; fc_maxima: number; zonas: ZonaFc[] }
export type RecoveryScoreResult = MetaCalculo & {
  score: number
  classificacao: string
  recomendacao: string
  componentes: { sono: number; disposicao: number; fc: number; carga: number }
}
export type ApiStatusResult = {
  chave_configurada: boolean
  endpoints: { endpoint: string; disponivel: boolean; detalhe: string }[]
}

async function invoke<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('health-calc', { body: { endpoint, params } })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const corpo = await error.context
        .clone()
        .json()
        .catch(() => null)
      if (corpo?.error) throw new Error(corpo.error)
    }
    throw new Error('Não foi possível calcular agora. Tente novamente.')
  }
  if (!data) throw new Error('Resposta vazia do cálculo.')
  return data
}

export function useHealthCalc() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  function exigirLogin() {
    if (!user) throw new Error('Usuário não autenticado')
  }

  async function calcHOMAIR(glucose: number, insulin: number) {
    exigirLogin()
    const result = await invoke<HomaIrResult>('homa_ir', { glucose, insulin })
    await queryClient.invalidateQueries({ queryKey: ['health-derived', 'homa_ir'] })
    return result
  }

  async function calcCholesterolRatio(tc: number, hdl: number, ldl: number, tg?: number | null) {
    exigirLogin()
    const result = await invoke<CholesterolRatioResult>('cholesterol_ratio', { tc, hdl, ldl, tg: tg ?? undefined })
    await queryClient.invalidateQueries({ queryKey: ['health-derived', 'cholesterol_ratio'] })
    return result
  }

  async function calcRecompForecast(params: {
    weight: number
    bodyFatPct: number
    proteinG: number
    calories: number
    weeks?: number
    trainingDaysWeek?: number
  }) {
    exigirLogin()
    const result = await invoke<RecompForecastResult>('recomp_forecast', {
      weight: params.weight,
      body_fat_pct: params.bodyFatPct,
      protein_g: params.proteinG,
      calories: params.calories,
      weeks: params.weeks,
      training_days_week: params.trainingDaysWeek,
    })
    await queryClient.invalidateQueries({ queryKey: ['health-derived', 'recomp_forecast'] })
    return result
  }

  async function calcKarvonen(age: number, restingHr: number) {
    exigirLogin()
    const result = await invoke<KarvonenResult>('karvonen', { age, resting_hr: restingHr })
    await queryClient.invalidateQueries({ queryKey: ['health-derived', 'karvonen_zones'] })
    return result
  }

  /** `muscleSoreness` é a disposição do slider (1 péssimo → 5 ótimo); `data` é o dia do score. */
  async function calcRecoveryScore(params: {
    data: string
    sleepHours: number
    restingHr?: number
    muscleSoreness: number
    trainingLoad?: number | null
  }) {
    exigirLogin()
    const result = await invoke<RecoveryScoreResult>('recovery_score', {
      data: params.data,
      sleep_hours: params.sleepHours,
      resting_hr: params.restingHr,
      muscle_soreness: params.muscleSoreness,
      training_load: params.trainingLoad ?? undefined,
    })
    await queryClient.invalidateQueries({ queryKey: ['recovery-scores'] })
    return result
  }

  function checkApiStatus() {
    exigirLogin()
    return invoke<ApiStatusResult>('status')
  }

  return { calcHOMAIR, calcCholesterolRatio, calcRecompForecast, calcKarvonen, calcRecoveryScore, checkApiStatus }
}

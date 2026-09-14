import { useQueryClient } from '@tanstack/react-query'

import { useLatestDerived } from '@/hooks/use-health-derived'
import { useHealthCalc } from '@/hooks/useHealthCalc'
import { simpleZones, type ZonaFc } from '@/lib/health-calc'
import { supabase } from '@/lib/supabase'

/** Pré-preenchimento das zonas até o usuário informar os próprios valores. */
export const ZONAS_PADRAO = { idade: 32, fcRepouso: 62 }

export type HeartZones = {
  zonas: ZonaFc[]
  /** karvonen = calculadas com FC de repouso e salvas; estimado = % da FC máxima. */
  metodo: 'karvonen' | 'estimado'
  idade: number
  fcRepouso: number | null
}

/** Zonas de FC do módulo Cardio: Karvonen salvas em health_metrics_derived, senão a fórmula simples. */
export function useHeartZones() {
  const derived = useLatestDerived('karvonen_zones')
  const out = derived.data?.dados_output as { zonas?: ZonaFc[]; idade?: number; fc_repouso?: number } | undefined

  const zones: HeartZones =
    out?.zonas && out.zonas.length === 5
      ? { zonas: out.zonas, metodo: 'karvonen', idade: out.idade ?? ZONAS_PADRAO.idade, fcRepouso: out.fc_repouso ?? null }
      : { zonas: simpleZones(ZONAS_PADRAO.idade), metodo: 'estimado', idade: ZONAS_PADRAO.idade, fcRepouso: null }

  return { ...derived, zones }
}

/**
 * Na primeira atividade registrada (treino ou cardio), calcula as zonas Karvonen
 * com os valores padrão — editáveis depois em Configurações. Silencioso: falha
 * aqui nunca atrapalha o registro do treino.
 */
export function useEnsureKarvonenZones() {
  const { calcKarvonen } = useHealthCalc()
  const queryClient = useQueryClient()

  return async function ensureKarvonenZones() {
    try {
      const { count, error } = await supabase
        .from('health_metrics_derived')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', 'karvonen_zones')
      if (error || (count ?? 0) > 0) return
      await calcKarvonen(ZONAS_PADRAO.idade, ZONAS_PADRAO.fcRepouso)
      await queryClient.invalidateQueries({ queryKey: ['health-derived', 'karvonen_zones'] })
    } catch {
      // zonas ficam na estimativa simples até a próxima tentativa
    }
  }
}

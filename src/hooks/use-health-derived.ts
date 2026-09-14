import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { HealthDerivedTipo, HealthMetricDerived } from '@/types/database'

import { useAuth } from './use-auth'

/** Cálculo derivado mais recente de um tipo (HOMA-IR, ratios, recomposição, zonas Karvonen). */
export function useLatestDerived(tipo: HealthDerivedTipo) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['health-derived', tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_metrics_derived')
        .select('*')
        .eq('tipo', tipo)
        .order('calculado_em', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as HealthMetricDerived | null
    },
    enabled: !!user,
  })
}

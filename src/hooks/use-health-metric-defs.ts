import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { HealthMetricDef } from '@/types/database'

import { useAuth } from './use-auth'

export function useHealthMetricDefs() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['health-metric-defs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('health_metric_defs').select('*').order('label')
      if (error) throw error
      return data as HealthMetricDef[]
    },
    enabled: !!user,
  })
}

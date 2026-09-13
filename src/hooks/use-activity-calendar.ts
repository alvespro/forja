import { useQuery } from '@tanstack/react-query'

import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { ActivityDay } from '@/lib/activity-day'

import { useAuth } from './use-auth'

/** Lê os últimos `days` dias do calendário de atividades, indexados por data (yyyy-MM-dd). */
export function useActivityCalendar(days = 90) {
  const { user } = useAuth()
  const today = todayInSaoPaulo()
  const from = addDaysToDateString(today, -(days - 1))

  return useQuery({
    queryKey: ['activity-calendar', from, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_calendar')
        .select('data, treino, cardio, habitos_pct, refeicoes_pct, score')
        .gte('data', from)
        .lte('data', today)
      if (error) throw error

      const map = new Map<string, ActivityDay>()
      for (const row of (data as ActivityDay[]) ?? []) map.set(row.data, row)
      return map
    },
    enabled: !!user,
  })
}

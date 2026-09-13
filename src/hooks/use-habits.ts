import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { syncActivityDay } from '@/lib/activity-sync'
import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { Habit } from '@/types/database'

import { useAuth } from './use-auth'

const STREAK_WINDOW_DAYS = 60

export function useHabits() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('ativo', true)
        .order('ordem')
      if (error) throw error
      return data as Habit[]
    },
    enabled: !!user,
  })
}

export function useHabitLogs() {
  const { user } = useAuth()
  const today = todayInSaoPaulo()
  const windowStart = addDaysToDateString(today, -STREAK_WINDOW_DAYS)

  return useQuery({
    queryKey: ['habit-logs', windowStart, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, data')
        .eq('concluido', true)
        .gte('data', windowStart)
        .lte('data', today)
      if (error) throw error
      return data as Pick<HabitLogRow, 'habit_id' | 'data'>[]
    },
    enabled: !!user,
  })
}

type HabitLogRow = { habit_id: string; data: string }

/** Agrupa os logs por hábito em um Set de datas concluídas, para cálculo de streak/grade. */
export function groupLogsByHabit(logs: HabitLogRow[] | undefined): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  if (!logs) return map

  for (const log of logs) {
    const set = map.get(log.habit_id) ?? new Set<string>()
    set.add(log.data)
    map.set(log.habit_id, set)
  }

  return map
}

export function useToggleHabitLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      completed,
    }: {
      habitId: string
      date: string
      completed: boolean
    }) => {
      if (!user) throw new Error('Usuário não autenticado')

      if (completed) {
        const { error } = await supabase
          .from('habit_logs')
          .upsert(
            { habit_id: habitId, data: date, user_id: user.id, concluido: true },
            { onConflict: 'habit_id,data' },
          )
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('data', date)
        if (error) throw error
      }
    },
    onSuccess: (_data, { date }) => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] })
      // Reflete o dia no calendário de atividades (habitos_pct do dia marcado).
      if (user) {
        syncActivityDay(user.id, date)
          .then(() => queryClient.invalidateQueries({ queryKey: ['activity-calendar'] }))
          .catch(() => {})
      }
    },
  })
}

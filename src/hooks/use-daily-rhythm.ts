import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

import { useAuth } from './use-auth'

export type DailyRhythmPreferences = {
  user_id: string
  enabled: boolean
  interval_minutes: number
  start_time: string
  end_time: string
  active_days: number[]
  notify_workout: boolean
  notify_meals: boolean
  notify_calendar: boolean
  notify_priority: boolean
}

export const DEFAULT_DAILY_RHYTHM: Omit<DailyRhythmPreferences, 'user_id'> = {
  enabled: false,
  interval_minutes: 180,
  start_time: '08:00',
  end_time: '22:00',
  active_days: [1, 2, 3, 4, 5, 6, 7],
  notify_workout: true,
  notify_meals: true,
  notify_calendar: true,
  notify_priority: true,
}

export function useDailyRhythmPreferences() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['daily-rhythm-preferences', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_rhythm_preferences').select('*').maybeSingle()
      if (error) throw error
      return (data as DailyRhythmPreferences | null) ?? { user_id: user!.id, ...DEFAULT_DAILY_RHYTHM }
    },
  })
}

export function useSaveDailyRhythmPreferences() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<DailyRhythmPreferences, 'user_id'>) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('daily_rhythm_preferences').upsert({ user_id: user.id, ...values, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-rhythm-preferences'] }),
  })
}

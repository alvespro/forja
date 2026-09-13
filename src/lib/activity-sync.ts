import { addDaysToDateString } from '@/lib/date'
import { supabase } from '@/lib/supabase'

import { computeActivityDay } from './activity-day'

// São Paulo não usa mais horário de verão desde 2019: offset fixo -03:00.
const SP_OFFSET = '-03:00'

/**
 * Recalcula um dia do calendário de atividades a partir das fontes (hábitos, treino, cardio)
 * e faz upsert em activity_calendar. Idempotente. As policies RLS já limitam ao próprio usuário.
 */
export async function syncActivityDay(userId: string, date: string): Promise<void> {
  const next = addDaysToDateString(date, 1)
  const lo = `${date}T00:00:00${SP_OFFSET}`
  const hi = `${next}T00:00:00${SP_OFFSET}`

  const [habitsCount, habitLogs, sessions, cardio] = await Promise.all([
    supabase.from('habits').select('id', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('habit_logs').select('habit_id').eq('data', date).eq('concluido', true),
    supabase.from('workout_sessions').select('id').gte('performed_at', lo).lt('performed_at', hi).limit(1),
    supabase.from('cardio_sessions').select('id').gte('performed_at', lo).lt('performed_at', hi).limit(1),
  ])

  const row = computeActivityDay({
    habitsTotal: habitsCount.count ?? 0,
    habitsDone: habitLogs.data?.length ?? 0,
    treino: (sessions.data?.length ?? 0) > 0,
    cardio: (cardio.data?.length ?? 0) > 0,
  })

  const { error } = await supabase
    .from('activity_calendar')
    .upsert({ user_id: userId, data: date, ...row }, { onConflict: 'user_id,data' })
  if (error) throw error
}

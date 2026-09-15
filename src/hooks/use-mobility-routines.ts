import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { syncActivityDay } from '@/lib/activity-sync'
import { todayInSaoPaulo } from '@/lib/date'
import { XP_MOBILIDADE } from '@/lib/mobility'
import { supabase } from '@/lib/supabase'
import type { Exercise, MobilityRoutine } from '@/types/database'

export type RotinaComExercicios = MobilityRoutine & { exercicios: Exercise[] }

/**
 * Rotinas de mobilidade ativas com os exercícios já resolvidos na ordem salva
 * (ids que não existem mais são ignorados).
 */
export function useMobilityRoutines() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['mobility-routines'],
    queryFn: async () => {
      const { data: rotinas, error } = await supabase
        .from('mobility_routines')
        .select('*')
        .eq('ativo', true)
        .order('created_at')
      if (error) throw error

      const ids = [...new Set((rotinas as MobilityRoutine[]).flatMap((r) => r.ordem_exercicios ?? []))]
      const { data: exercicios, error: errEx } = ids.length
        ? await supabase.from('exercises').select('*').in('id', ids)
        : { data: [], error: null }
      if (errEx) throw errEx
      const porId = new Map((exercicios as Exercise[]).map((e) => [e.id, e]))

      return (rotinas as MobilityRoutine[]).map((r) => ({
        ...r,
        exercicios: (r.ordem_exercicios ?? []).map((id) => porId.get(id)).filter((e): e is Exercise => !!e),
      })) as RotinaComExercicios[]
    },
    enabled: !!user,
  })
}

/**
 * Rotina concluída: marca o dia no calendário (mobilidade), soma XP em
 * xp_logs e, se veio do hábito "Mover o corpo", marca o hábito de hoje.
 */
export function useCompleteMobilityRoutine() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ rotina, habitId }: { rotina: MobilityRoutine; habitId?: string | null }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const hoje = todayInSaoPaulo()

      const calendario = await supabase
        .from('activity_calendar')
        .upsert({ user_id: user.id, data: hoje, mobilidade: true }, { onConflict: 'user_id,data' })
      if (calendario.error) throw calendario.error

      const xp = await supabase.from('xp_logs').insert({
        user_id: user.id,
        acao: 'mobilidade',
        xp_ganho: XP_MOBILIDADE,
        descricao: rotina.nome,
        referencia_id: rotina.id,
      })
      if (xp.error) throw xp.error

      if (habitId) {
        const habito = await supabase
          .from('habit_logs')
          .upsert({ habit_id: habitId, data: hoje, user_id: user.id, concluido: true }, { onConflict: 'habit_id,data' })
        if (habito.error) throw habito.error
        // Recalcula o % de hábitos do dia (o upsert acima não passa pelo toggle).
        await syncActivityDay(user.id, hoje).catch(() => {})
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] })
    },
  })
}

/** Registra a escolha diante de recuperação baixa ('treino' = treinar mesmo). */
export function useRecoveryDecision() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (decisao: 'mobilidade' | 'treino') => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase
        .from('recovery_scores')
        .update({ decisao_treino: decisao })
        .eq('data', todayInSaoPaulo())
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recovery-scores'] }),
  })
}

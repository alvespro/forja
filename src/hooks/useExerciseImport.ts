import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/types/database'

/**
 * Biblioteca ExerciseDB via Edge Function `exercise-import` (cache-first: a API
 * só é consultada para buscar/importar; o app lê sempre de `exercises`).
 */

export type ResultadoBusca = {
  exercisedb_id: string
  nome_original: string
  grupo_muscular: string | null
  categoria: string | null
  equipamento: string | null
  imagem_url: string | null
  gif_url: string | null
  video_url: string | null
  /** Exercício do FORJA que já tem este exercisedb_id (já importado). */
  exercise_id: string | null
}

export type GrupoBusca = 'peito' | 'costas' | 'pernas' | 'ombros' | 'biceps' | 'triceps' | 'core'

export type SyncSeedResult = {
  importados: number
  mobilidade: number
  rotinas: { nome: string; exercicios: number }[]
  erros: string[]
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('exercise-import', { body })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const corpo = await error.context
        .clone()
        .json()
        .catch(() => null)
      if (corpo?.error) throw new Error(corpo.error)
    }
    throw new Error('Não foi possível falar com o ExerciseDB agora.')
  }
  if (!data) throw new Error('Resposta vazia do ExerciseDB.')
  return data
}

/** A chave EXERCISEDB_API_KEY está configurada no servidor? */
export function useExerciseDBStatus() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['exercisedb-status'],
    queryFn: () => invoke<{ configurado: boolean }>({ modo: 'status' }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

export function useExerciseImport() {
  const queryClient = useQueryClient()

  function buscar(params: { query?: string; grupo?: GrupoBusca }) {
    return invoke<{ resultados: ResultadoBusca[] }>({ modo: 'busca', ...params }).then((r) => r.resultados)
  }

  /** Importa para um exercício existente (`exerciseId`) ou cria um novo na biblioteca. */
  async function importar(exercisedbId: string, exerciseId?: string | null) {
    const { exercicio } = await invoke<{ exercicio: Exercise }>({
      modo: 'importar',
      exercisedb_id: exercisedbId,
      exercise_id: exerciseId ?? undefined,
    })
    await queryClient.invalidateQueries({ queryKey: ['exercises'] })
    return exercicio
  }

  async function syncSeed() {
    const result = await invoke<SyncSeedResult>({ modo: 'sync_seed' })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['exercises'] }),
      queryClient.invalidateQueries({ queryKey: ['mobility-routines'] }),
    ])
    return result
  }

  return { buscar, importar, syncSeed }
}

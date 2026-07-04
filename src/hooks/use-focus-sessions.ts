import { createCrudHooks } from '@/lib/crud-factory'
import type { FocusSession, FocusTechnique } from '@/types/database'

const RECENT_LIMIT = 200

export type CreateFocusSessionInput = {
  tarefa: string | null
  /** Tarefa real vinculada — habilita 'concluir tarefa' pós-pomodoro. */
  task_id?: string | null
  tecnica: FocusTechnique
  duracao_min: number
}

const focusSessionsCrud = createCrudHooks<FocusSession, CreateFocusSessionInput>({
  table: 'focus_sessions',
  queryKey: 'focus-sessions',
  orderBy: { column: 'data', ascending: false },
  limit: RECENT_LIMIT,
})

/** Sessões de foco recentes (últimas RECENT_LIMIT), mais recentes primeiro. */
export const useRecentFocusSessions = focusSessionsCrud.useList
export const useCreateFocusSession = focusSessionsCrud.useCreate

import { createCrudHooks } from '@/lib/crud-factory'
import type { FinanceGoal } from '@/types/database'

export type FinanceGoalInput = {
  ciclo_id: string | null
  meta_mensal: number | null
  numero_liberdade: number | null
}

const financeGoalsCrud = createCrudHooks<FinanceGoal, FinanceGoalInput>({
  table: 'finance_goals',
  queryKey: 'finance-goals',
})

export const useFinanceGoals = financeGoalsCrud.useList
export const useCreateFinanceGoal = financeGoalsCrud.useCreate
export const useUpdateFinanceGoal = financeGoalsCrud.useUpdate
export const useDeleteFinanceGoal = financeGoalsCrud.useDelete

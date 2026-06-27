import { createCrudHooks } from '@/lib/crud-factory'
import type { Finance, FinanceTipo } from '@/types/database'

export type FinanceInput = {
  tipo: FinanceTipo
  categoria: string | null
  valor: number
  descricao: string | null
  data: string
}

const financesCrud = createCrudHooks<Finance, FinanceInput>({
  table: 'finances',
  queryKey: 'finances',
  orderBy: { column: 'data', ascending: false },
})

export const useFinances = financesCrud.useList
export const useCreateFinance = financesCrud.useCreate
export const useDeleteFinance = financesCrud.useDelete

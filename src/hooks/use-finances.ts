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
  // Janela de segurança: os 1000 lançamentos mais recentes cobrem ~2 anos de uso
  limit: 1000,
})

export const useFinances = financesCrud.useList
export const useCreateFinance = financesCrud.useCreate
export const useDeleteFinance = financesCrud.useDelete

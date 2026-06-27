import { createCrudHooks } from '@/lib/crud-factory'
import type { Meal } from '@/types/database'

export type MealInput = {
  refeicao: number
  descricao: string | null
  proteina_g: number | null
  calorias: number | null
  tipo: string | null
  data: string
}

const mealsCrud = createCrudHooks<Meal, MealInput>({
  table: 'meals',
  queryKey: 'meals',
  orderBy: [
    { column: 'data', ascending: false },
    { column: 'refeicao', ascending: true },
  ],
})

export const useMeals = mealsCrud.useList
export const useCreateMeal = mealsCrud.useCreate
export const useDeleteMeal = mealsCrud.useDelete

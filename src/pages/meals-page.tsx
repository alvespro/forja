import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Icon } from '@/components/Icon'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MealForm } from '@/components/meals/meal-form'
import { useConfirm } from '@/hooks/use-confirm'
import { useCreateMeal, useDeleteMeal, useMeals } from '@/hooks/use-meals'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'

export function MealsPage() {
  const meals = useMeals()
  const createMeal = useCreateMeal()
  const deleteMeal = useDeleteMeal()
  const { confirm, dialog } = useConfirm()
  const [isAdding, setIsAdding] = useState(false)

  const today = todayInSaoPaulo()
  const proteinaHoje = useMemo(
    () => (meals.data ?? []).filter((m) => m.data === today).reduce((sum, m) => sum + (m.proteina_g ?? 0), 0),
    [meals.data, today],
  )
  const caloriasHoje = useMemo(
    () => (meals.data ?? []).filter((m) => m.data === today).reduce((sum, m) => sum + (m.calorias ?? 0), 0),
    [meals.data, today],
  )

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Excluir esta refeição?', description: 'Essa ação não pode ser desfeita.' })
    if (!ok) return
    deleteMeal.mutate(id)
  }

  return (
    <div className="flex flex-col gap-4">
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Refeições</h1>
          <p className="text-sm text-aco-texto">Registro de refeições, proteína e calorias.</p>
        </div>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Icon name="add" size={14} />
            Nova refeição
          </Button>
        )}
      </div>

      {!meals.isLoading && !meals.isError && (
        <div className="grid grid-cols-2 gap-3">
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Proteína hoje</span>
              <span className="font-mono text-lg text-foreground">{Math.round(proteinaHoje)}g</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Calorias hoje</span>
              <span className="font-mono text-lg text-foreground">{Math.round(caloriasHoje)}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdding && (
        <MealForm
          isSubmitting={createMeal.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) => createMeal.mutate(values, { onSuccess: () => setIsAdding(false) })}
        />
      )}

      {meals.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : meals.isError ? (
        <ErrorState message="Não foi possível carregar as refeições." onRetry={() => meals.refetch()} />
      ) : !meals.data || meals.data.length === 0 ? (
        !isAdding && <EmptyState message="Nenhuma refeição registrada ainda." />
      ) : (
        <div className="flex flex-col gap-2">
          {meals.data.map((meal) => (
            <Card key={meal.id} size="sm">
              <CardContent className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    Refeição {meal.refeicao}
                    {meal.tipo ? ` · ${meal.tipo}` : ''}
                  </span>
                  <span className="truncate font-mono text-xs text-aco-texto">
                    {format(parseDateOnly(meal.data), "d 'de' MMMM", { locale: ptBR })}
                    {meal.descricao ? ` · ${meal.descricao}` : ''}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs text-aco-texto">
                    {meal.proteina_g !== null ? `${meal.proteina_g}g prot` : ''}
                    {meal.calorias !== null ? ` · ${meal.calorias}cal` : ''}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Excluir refeição ${meal.refeicao}`}
                    onClick={() => handleDelete(meal.id)}
                  >
                    <Icon name="delete" size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

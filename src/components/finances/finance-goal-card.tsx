import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateFinanceGoal,
  useFinanceGoals,
  useUpdateFinanceGoal,
  type FinanceGoalInput,
} from '@/hooks/use-finance-goals'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function FinanceGoalCard() {
  const goals = useFinanceGoals()
  const createGoal = useCreateFinanceGoal()
  const updateGoal = useUpdateFinanceGoal()
  const [isEditing, setIsEditing] = useState(false)

  const goal = goals.data && goals.data.length > 0 ? goals.data[0] : null

  const [metaMensal, setMetaMensal] = useState(goal?.meta_mensal?.toString() ?? '')
  const [numeroLiberdade, setNumeroLiberdade] = useState(goal?.numero_liberdade?.toString() ?? '')

  function startEditing() {
    setMetaMensal(goal?.meta_mensal?.toString() ?? '')
    setNumeroLiberdade(goal?.numero_liberdade?.toString() ?? '')
    setIsEditing(true)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const values: FinanceGoalInput = {
      ciclo_id: goal?.ciclo_id ?? null,
      meta_mensal: metaMensal ? Number(metaMensal) : null,
      numero_liberdade: numeroLiberdade ? Number(numeroLiberdade) : null,
    }
    if (goal) {
      updateGoal.mutate({ id: goal.id, values }, { onSuccess: () => setIsEditing(false) })
    } else {
      createGoal.mutate(values, { onSuccess: () => setIsEditing(false) })
    }
  }

  const isSubmitting = createGoal.isPending || updateGoal.isPending

  if (goals.isLoading) return null

  if (isEditing) {
    return (
      <form
        className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta-mensal">Meta mensal (R$)</Label>
            <Input
              id="meta-mensal"
              type="number"
              step="0.01"
              value={metaMensal}
              onChange={(event) => setMetaMensal(event.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numero-liberdade">Número da liberdade (R$)</Label>
            <Input
              id="numero-liberdade"
              type="number"
              step="0.01"
              value={numeroLiberdade}
              onChange={(event) => setNumeroLiberdade(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-aco-texto">Meta mensal</span>
            <span className="font-mono text-lg text-foreground">
              {goal?.meta_mensal !== null && goal?.meta_mensal !== undefined ? currency.format(goal.meta_mensal) : '—'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-aco-texto">Número da liberdade</span>
            <span className="font-mono text-lg text-foreground">
              {goal?.numero_liberdade !== null && goal?.numero_liberdade !== undefined
                ? currency.format(goal.numero_liberdade)
                : '—'}
            </span>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={startEditing}>
          {goal ? 'Editar' : 'Definir metas'}
        </Button>
      </CardContent>
    </Card>
  )
}

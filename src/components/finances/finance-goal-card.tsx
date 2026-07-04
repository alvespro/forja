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

type FinanceGoalCardProps = {
  /** Receitas do mês selecionado — vira barra de progresso contra a meta. */
  receitasDoMes?: number
}

export function FinanceGoalCard({ receitasDoMes }: FinanceGoalCardProps) {
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

  const meta = goal?.meta_mensal ?? null
  const progressoPct =
    meta && meta > 0 && receitasDoMes !== undefined ? Math.min(100, Math.round((receitasDoMes / meta) * 100)) : null

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Meta mensal</span>
              <span className="font-mono text-lg text-foreground">
                {meta !== null ? currency.format(meta) : '—'}
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
        </div>

        {/* Progresso da meta: receitas do mês vs. meta — antes a meta era um número decorativo */}
        {progressoPct !== null && receitasDoMes !== undefined && meta !== null && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-aco-texto">
              <span>
                {currency.format(receitasDoMes)} de {currency.format(meta)}
              </span>
              <span className={progressoPct >= 100 ? 'font-semibold text-ok' : ''}>{progressoPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className={`h-full rounded-full transition-all ${progressoPct >= 100 ? 'bg-ok' : 'bg-brasa'}`}
                style={{ width: `${progressoPct}%` }}
              />
            </div>
            {progressoPct < 100 && (
              <p className="mt-1 text-[11px] text-aco-texto/70">
                Faltam {currency.format(meta - receitasDoMes)} para a meta do mês
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Icon } from '@/components/Icon'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FinanceForm } from '@/components/finances/finance-form'
import { FinanceGoalCard } from '@/components/finances/finance-goal-card'
import { useConfirm } from '@/hooks/use-confirm'
import { useCreateFinance, useDeleteFinance, useFinances } from '@/hooks/use-finances'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'
import { computeFinanceSummary, filterByMonth, monthsAvailable } from '@/lib/finance-summary'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function labelDoMes(ym: string): string {
  return format(parseDateOnly(ym + '-01'), 'MMMM yyyy', { locale: ptBR })
}

export function FinancesPage() {
  const finances = useFinances()
  const createFinance = useCreateFinance()
  const deleteFinance = useDeleteFinance()
  const { confirm, dialog } = useConfirm()
  const [isAdding, setIsAdding] = useState(false)

  const mesAtual = todayInSaoPaulo().slice(0, 7)
  const [mes, setMes] = useState(mesAtual)

  // Seletor sempre inclui o mês corrente, mesmo sem lançamentos ainda
  const meses = useMemo(() => {
    const list = monthsAvailable(finances.data ?? [])
    return list.includes(mesAtual) ? list : [mesAtual, ...list]
  }, [finances.data, mesAtual])

  const doMes = useMemo(() => filterByMonth(finances.data ?? [], mes), [finances.data, mes])
  const summary = useMemo(() => computeFinanceSummary(doMes), [doMes])

  async function handleDelete(id: string, descricao: string | null) {
    const ok = await confirm({
      title: `Excluir o lançamento "${descricao ?? 'sem descrição'}"?`,
      description: 'Essa ação não pode ser desfeita.',
    })
    if (!ok) return
    deleteFinance.mutate(id)
  }

  return (
    <div className="flex flex-col gap-4">
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Finanças</h1>
          <p className="text-sm text-aco-texto">Receitas, gastos e saldo do mês.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            aria-label="Mês"
            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm capitalize outline-none focus:ring-1 focus:ring-ring"
          >
            {meses.map((m) => (
              <option key={m} value={m} className="capitalize">
                {labelDoMes(m)}
              </option>
            ))}
          </select>
          {!isAdding && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Icon name="add" size={14} />
              Novo lançamento
            </Button>
          )}
        </div>
      </div>

      {!finances.isLoading && !finances.isError && (
        <div className="grid grid-cols-3 gap-3">
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Receitas</span>
              <span className="font-mono text-lg text-ok">{currency.format(summary.receitas)}</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Gastos</span>
              <span className="font-mono text-lg text-alerta-texto">{currency.format(summary.gastos)}</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Saldo</span>
              <span className={`font-mono text-lg ${summary.saldo >= 0 ? 'text-ok' : 'text-alerta-texto'}`}>
                {currency.format(summary.saldo)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      <FinanceGoalCard receitasDoMes={summary.receitas} />

      {isAdding && (
        <FinanceForm
          isSubmitting={createFinance.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) => createFinance.mutate(values, { onSuccess: () => setIsAdding(false) })}
        />
      )}

      {finances.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : finances.isError ? (
        <ErrorState message="Não foi possível carregar os lançamentos." onRetry={() => finances.refetch()} />
      ) : doMes.length === 0 ? (
        !isAdding && <EmptyState message={`Nenhum lançamento em ${labelDoMes(mes)}.`} />
      ) : (
        <div className="flex flex-col gap-2">
          {doMes.map((finance) => (
            <Card key={finance.id} size="sm">
              <CardContent className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {finance.descricao || finance.categoria || (finance.tipo === 'receita' ? 'Receita' : 'Gasto')}
                  </span>
                  <span className="font-mono text-xs text-aco-texto">
                    {format(parseDateOnly(finance.data), "d 'de' MMMM", { locale: ptBR })}
                    {finance.categoria ? ` · ${finance.categoria}` : ''}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`font-mono text-sm ${finance.tipo === 'receita' ? 'text-ok' : 'text-alerta-texto'}`}
                  >
                    {finance.tipo === 'receita' ? '+' : '−'}
                    {currency.format(finance.valor)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Excluir lançamento ${finance.descricao ?? finance.categoria ?? ''}`}
                    onClick={() => handleDelete(finance.id, finance.descricao)}
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

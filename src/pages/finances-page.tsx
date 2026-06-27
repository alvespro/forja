import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2 } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FinanceForm } from '@/components/finances/finance-form'
import { useConfirm } from '@/hooks/use-confirm'
import { useCreateFinance, useDeleteFinance, useFinances } from '@/hooks/use-finances'
import { parseDateOnly } from '@/lib/date'
import { computeFinanceSummary } from '@/lib/finance-summary'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function FinancesPage() {
  const finances = useFinances()
  const createFinance = useCreateFinance()
  const deleteFinance = useDeleteFinance()
  const { confirm, dialog } = useConfirm()
  const [isAdding, setIsAdding] = useState(false)

  const summary = useMemo(() => computeFinanceSummary(finances.data ?? []), [finances.data])

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
          <p className="text-sm text-aco-texto">Receitas, gastos e o saldo do período.</p>
        </div>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Novo lançamento
          </Button>
        )}
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
              <span className="font-mono text-lg text-alerta">{currency.format(summary.gastos)}</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-aco-texto">Saldo</span>
              <span className={`font-mono text-lg ${summary.saldo >= 0 ? 'text-ok' : 'text-alerta'}`}>
                {currency.format(summary.saldo)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

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
      ) : !finances.data || finances.data.length === 0 ? (
        !isAdding && <EmptyState message="Nenhum lançamento registrado ainda." />
      ) : (
        <div className="flex flex-col gap-2">
          {finances.data.map((finance) => (
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
                    className={`font-mono text-sm ${finance.tipo === 'receita' ? 'text-ok' : 'text-alerta'}`}
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
                    <Trash2 className="size-3.5" aria-hidden="true" />
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

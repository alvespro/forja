import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { useRecentFocusSessions } from '@/hooks/use-focus-sessions'
import { todayInSaoPaulo } from '@/lib/date'
import { filterFocusSessionsByDates, sumFocusMinutes } from '@/lib/focus-sessions'

export function FocusSessionHistory() {
  const { data, isLoading, isError, refetch } = useRecentFocusSessions()
  const today = todayInSaoPaulo()

  const sessoesHoje = data ? filterFocusSessionsByDates(data, [today]) : []
  const totalMinutos = sumFocusMinutes(sessoesHoje)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões de hoje</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Não foi possível carregar as sessões de foco." onRetry={() => refetch()} />
        ) : sessoesHoje.length === 0 ? (
          <EmptyState message="Nenhuma sessão de foco registrada hoje ainda." />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-aco-texto">Total focado hoje</span>
              <span className="font-mono text-lg text-foreground">{totalMinutos} min</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {sessoesHoje.map((sessao) => (
                <li
                  key={sessao.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm"
                >
                  <span className="truncate text-foreground">{sessao.tarefa || 'Sem tarefa definida'}</span>
                  <span className="shrink-0 font-mono text-xs text-aco-texto">{sessao.duracao_min} min</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

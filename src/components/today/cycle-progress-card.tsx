import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { useActiveCycle } from '@/hooks/use-active-cycle'
import { diffInDays, todayInSaoPaulo } from '@/lib/date'

export function CycleProgressCard() {
  const { data: cycle, isLoading, isError, refetch } = useActiveCycle()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ciclo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Não foi possível carregar o ciclo." onRetry={() => refetch()} />
        ) : !cycle ? (
          <EmptyState message="Nenhum ciclo ativo no momento." />
        ) : (
          <CycleProgressContent
            nome={cycle.nome}
            dataInicio={cycle.data_inicio}
            dataFim={cycle.data_fim}
          />
        )}
      </CardContent>
    </Card>
  )
}

function CycleProgressContent({
  nome,
  dataInicio,
  dataFim,
}: {
  nome: string
  dataInicio: string
  dataFim: string
}) {
  const today = todayInSaoPaulo()
  const totalDias = Math.max(diffInDays(dataFim, dataInicio), 1)
  const diasDecorridos = Math.min(Math.max(diffInDays(today, dataInicio), 0), totalDias)
  const progresso = Math.round((diasDecorridos / totalDias) * 100)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="font-medium text-foreground">{nome}</span>
        <span className="font-mono text-sm text-aco-texto">
          dia {diasDecorridos}/{totalDias}
        </span>
      </div>
      <Progress value={progresso} />
    </div>
  )
}

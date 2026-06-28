import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useSupplementLogs, useToggleSupplementLog } from '@/hooks/use-supplement-logs'
import { useSupplements } from '@/hooks/use-supplements'
import { computeStreak, weekdayAbbrevOf } from '@/lib/nutrition'
import { todayInSaoPaulo } from '@/lib/date'
import { cn } from '@/lib/utils'

export function SupplementsTodaySection() {
  const supplements = useSupplements()
  const logs = useSupplementLogs()
  const toggleLog = useToggleSupplementLog()

  const today = todayInSaoPaulo()
  const todayAbbrev = weekdayAbbrevOf(today)

  if (supplements.isLoading || logs.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (supplements.isError || logs.isError) {
    return (
      <ErrorState
        message="Não foi possível carregar a suplementação."
        onRetry={() => {
          supplements.refetch()
          logs.refetch()
        }}
      />
    )
  }

  const supplementosHoje = (supplements.data ?? []).filter(
    (s) => s.ativo && (s.dias_semana ?? []).includes(todayAbbrev),
  )

  if (supplementosHoje.length === 0) {
    return <EmptyState message="Nenhum suplemento programado para hoje." />
  }

  return (
    <div className="flex flex-col gap-2">
      {supplementosHoje.map((supplement) => {
        const logsDoSuplemento = (logs.data ?? []).filter((l) => l.supplement_id === supplement.id)
        const tomadoHoje = logsDoSuplemento.some((l) => l.data === today && l.tomado)
        const streak = computeStreak(logsDoSuplemento.filter((l) => l.tomado).map((l) => l.data))

        return (
          <Card key={supplement.id} size="sm">
            <CardContent className="flex items-center justify-between gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <Checkbox
                  checked={tomadoHoje}
                  onCheckedChange={(checked) =>
                    toggleLog.mutate({ supplementId: supplement.id, tomado: checked === true })
                  }
                />
                <div className="flex min-w-0 flex-col">
                  <span className={cn('truncate text-sm font-medium', tomadoHoje ? 'text-ok' : 'text-foreground')}>
                    {tomadoHoje ? '✅' : '⬜'} {supplement.nome}
                  </span>
                  <span className="truncate font-mono text-xs text-aco-texto">
                    {supplement.dose}
                    {supplement.unidade} · {supplement.momento}
                  </span>
                </div>
              </label>
              {streak > 0 && (
                <span className="shrink-0 font-mono text-xs text-brasa">
                  🔥 {streak}d
                </span>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

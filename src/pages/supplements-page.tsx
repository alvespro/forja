import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { SupplementCard } from '@/components/supplements/supplement-card'
import { SupplementForm } from '@/components/supplements/supplement-form'
import { useActiveCycle } from '@/hooks/use-active-cycle'
import { useSupplementLogs } from '@/hooks/use-supplement-logs'
import { useCreateSupplement, useSupplements } from '@/hooks/use-supplements'
import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { weekdayAbbrevOf } from '@/lib/nutrition'

export function SupplementsPage() {
  const supplements = useSupplements()
  const logs = useSupplementLogs()
  const activeCycle = useActiveCycle()
  const createSupplement = useCreateSupplement()
  const [isAdding, setIsAdding] = useState(false)

  const today = todayInSaoPaulo()

  const adesaoPorSuplemento = useMemo(() => {
    const result = new Map<string, number>()
    if (!activeCycle.data) return result

    const inicio = activeCycle.data.data_inicio > today ? today : activeCycle.data.data_inicio
    for (const supplement of supplements.data ?? []) {
      const dias = supplement.dias_semana ?? []
      if (dias.length === 0) continue

      let esperados = 0
      let tomados = 0
      let cursor = inicio
      while (cursor <= today) {
        if (dias.includes(weekdayAbbrevOf(cursor))) {
          esperados += 1
          if ((logs.data ?? []).some((l) => l.supplement_id === supplement.id && l.data === cursor && l.tomado)) {
            tomados += 1
          }
        }
        cursor = addDaysToDateString(cursor, 1)
      }
      result.set(supplement.id, esperados > 0 ? Math.round((tomados / esperados) * 100) : 0)
    }
    return result
  }, [activeCycle.data, supplements.data, logs.data, today])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Suplementos 💊</h1>
          <p className="text-sm text-aco-texto">Cadastro, dias da semana e histórico de adesão.</p>
        </div>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Novo suplemento
          </Button>
        )}
      </div>

      {isAdding && (
        <SupplementForm
          isSubmitting={createSupplement.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) => createSupplement.mutate(values, { onSuccess: () => setIsAdding(false) })}
        />
      )}

      {supplements.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : supplements.isError ? (
        <ErrorState message="Não foi possível carregar os suplementos." onRetry={() => supplements.refetch()} />
      ) : !supplements.data || supplements.data.length === 0 ? (
        !isAdding && <EmptyState message="Nenhum suplemento cadastrado ainda." />
      ) : (
        <div className="flex flex-col gap-2">
          {supplements.data.map((supplement) => (
            <SupplementCard
              key={supplement.id}
              supplement={supplement}
              adesaoPct={adesaoPorSuplemento.get(supplement.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

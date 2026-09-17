import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { SupplementCard } from '@/components/supplements/supplement-card'
import { SupplementForm } from '@/components/supplements/supplement-form'
import { useActiveCycle } from '@/hooks/use-active-cycle'
import { useActiveProtocol } from '@/hooks/use-protocols'
import { useProtocolSupport } from '@/hooks/use-protocol-support'
import { useSupplementLogs, useToggleSupportLog } from '@/hooks/use-supplement-logs'
import { useCreateSupplement, useSupplements } from '@/hooks/use-supplements'
import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { mensagemDeErro } from '@/lib/feedback'
import { weekdayAbbrevOf } from '@/lib/nutrition'
import { cn } from '@/lib/utils'

export function SupplementsPage() {
  const supplements = useSupplements()
  const logs = useSupplementLogs()
  const toggleSupport = useToggleSupportLog()
  const activeCycle = useActiveCycle()
  const activeProtocol = useActiveProtocol()
  const protocolSupport = useProtocolSupport(activeProtocol.data?.id)
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
          <Button type="button" className="min-h-11" onClick={() => setIsAdding(true)}>
            <Icon name="add" size={18} />
            Adicionar suplemento
          </Button>
        )}
      </div>

      {isAdding && (
        <SupplementForm
          isSubmitting={createSupplement.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) =>
            createSupplement.mutate(values, {
              onSuccess: () => {
                toast.success(`${values.nome} adicionado.`)
                setIsAdding(false)
              },
              onError: (e) => toast.error(mensagemDeErro(e, 'adicionar o suplemento')),
            })
          }
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

      {/* ── Suporte do ciclo (protocolo): check diário no mesmo log dos suplementos ── */}
      {activeProtocol.data && (protocolSupport.data?.filter((s) => s.ativo).length ?? 0) > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="suporte-ciclo">
          <div className="mt-2 flex items-center gap-2">
            <Icon name="science" size={20} className="text-brasa" />
            <h2 id="suporte-ciclo" className="text-sm font-semibold text-foreground">
              Suporte do ciclo
            </h2>
            <span className="rounded-full border border-brasa/40 bg-brasa/15 px-2 py-0.5 text-[11px] font-semibold text-brasa">{activeProtocol.data.nome}</span>
          </div>
          {protocolSupport.data!
            .filter((s) => s.ativo)
            .map((s) => {
              const tomado = (logs.data ?? []).some((l) => l.protocol_support_id === s.id && l.data === today && l.tomado)
              return (
                <div key={s.id} className={cn('flex items-center gap-3 rounded-xl border p-3 transition-colors', tomado ? 'border-ok/40 bg-ok/[0.06]' : 'border-brasa/25 bg-brasa/5')}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={tomado}
                    aria-label={`${s.nome}: ${tomado ? 'tomado hoje' : 'marcar como tomado hoje'}`}
                    disabled={toggleSupport.isPending}
                    onClick={() =>
                      toggleSupport.mutate(
                        { supportId: s.id, tomado: !tomado },
                        { onError: (e) => toast.error(mensagemDeErro(e, 'marcar o suporte')) },
                      )
                    }
                    className="-m-1.5 flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon name="check_circle" size={28} filled={tomado} className={tomado ? 'text-ok' : 'text-cinza2'} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn('text-sm font-medium', tomado ? 'text-cinza line-through' : 'text-foreground')}>{s.nome}</span>
                      <span className="rounded-full bg-brasa/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brasa">Ciclo</span>
                    </div>
                    <p className="mt-0.5 text-xs text-aco-texto">{[s.dose, s.momento, s.categoria].filter(Boolean).join(' · ')}</p>
                    {s.motivo && <p className="mt-0.5 text-xs italic text-cinza2-texto">{s.motivo}</p>}
                  </div>
                </div>
              )
            })}
        </section>
      )}
    </div>
  )
}

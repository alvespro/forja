import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  computeSessionAggregates,
  epley1RM,
  groupSetsBySession,
  type SessionSets,
  type SetLogWithSession,
} from '@/lib/workout-metrics'

type SeriesAnalysisTabProps = {
  logs: SetLogWithSession[]
}

/** Carga da mesma série (serie_num) na sessão imediatamente anterior — a "meta" a bater. */
function cargaAnteriorPorSerie(older: SessionSets | undefined): Map<number, number> {
  const map = new Map<number, number>()
  if (!older) return map
  for (const s of older.sets) if (s.carga_kg != null) map.set(s.serie_num, s.carga_kg)
  return map
}

function TrendArrow({ atual, anterior }: { atual: number; anterior: number | undefined }) {
  if (anterior === undefined || atual === anterior)
    return <Minus className="size-3 text-aco-texto" aria-label="igual" />
  return atual > anterior ? (
    <ArrowUp className="size-3 text-ok" aria-label="subiu" />
  ) : (
    <ArrowDown className="size-3 text-alerta-texto" aria-label="caiu" />
  )
}

export function SeriesAnalysisTab({ logs }: SeriesAnalysisTabProps) {
  const { sessions, recentAgg, bestSessionId } = useMemo(() => {
    const sessions = groupSetsBySession(logs) // desc por data
    const aggregatesAsc = computeSessionAggregates(logs) // asc, com isPR
    const bestSessionId =
      aggregatesAsc.reduce<{ id: string; v: number }>(
        (best, a) => (a.melhor1RM > best.v ? { id: a.sessionId, v: a.melhor1RM } : best),
        { id: '', v: 0 },
      ).id
    const recentAgg = [...aggregatesAsc].reverse().slice(0, 5) // recente primeiro
    return { sessions, recentAgg, bestSessionId }
  }, [logs])

  if (sessions.length === 0) {
    return <EmptyState message="Nenhuma série registrada para este exercício ainda." />
  }

  const recent = sessions.slice(0, 5)

  return (
    <div className="flex flex-col gap-4">
      {recent.map((session, i) => {
        const metaPorSerie = cargaAnteriorPorSerie(sessions[i + 1])
        return (
          <Card key={session.sessionId}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-heading text-sm font-bold text-foreground">
                  {format(new Date(session.performedAt), "d 'de' MMM", { locale: ptBR })}
                </span>
                {session.treinoNome && <span className="truncate text-xs text-aco-texto">{session.treinoNome}</span>}
              </div>

              {/* Mini gráfico de barras: carga por série */}
              <div className="flex h-14 items-end gap-1" aria-hidden="true">
                {session.sets.map((set) => {
                  const carga = set.carga_kg ?? 0
                  const meta = metaPorSerie.get(set.serie_num)
                  const isMax = carga === session.cargaMaxima && carga > 0
                  const abaixo = meta !== undefined && carga < meta
                  return (
                    <div
                      key={set.id}
                      className={cn(
                        'min-h-[2px] flex-1 rounded-t',
                        isMax ? 'bg-brasa' : abaixo ? 'bg-alerta/70' : 'bg-ok/70',
                      )}
                      style={{ height: `${session.cargaMaxima > 0 ? (carga / session.cargaMaxima) * 100 : 0}%` }}
                    />
                  )
                })}
              </div>

              {/* Tabela das séries */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-aco-texto">
                      <th className="pb-1 font-medium">Série</th>
                      <th className="pb-1 font-medium">Carga</th>
                      <th className="pb-1 font-medium">Reps</th>
                      <th className="pb-1 font-medium">RPE</th>
                      <th className="pb-1 font-medium">Cadência</th>
                      <th className="pb-1 text-right font-medium">1RM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.sets.map((set) => {
                      const carga = set.carga_kg ?? 0
                      const meta = metaPorSerie.get(set.serie_num)
                      const abaixo = meta !== undefined && carga < meta
                      const isMax = carga === session.cargaMaxima && carga > 0
                      return (
                        <tr key={set.id} className={cn('border-t border-border/60', isMax && 'bg-brasa/5')}>
                          <td className="py-1.5 text-aco-texto">{set.serie_num}ª</td>
                          <td className={cn('py-1.5 font-medium', abaixo ? 'text-alerta-texto' : 'text-ok')}>
                            {set.carga_kg != null ? `${set.carga_kg}kg` : '—'}
                          </td>
                          <td className="py-1.5 text-foreground">{set.reps ?? '—'}</td>
                          <td className="py-1.5 text-foreground">{set.rpe ?? '—'}</td>
                          <td className="py-1.5 font-mono text-xs text-aco-texto">{set.cadencia ?? '—'}</td>
                          <td className="py-1.5 text-right text-aco-texto">
                            {set.carga_kg != null && set.reps != null
                              ? `${Math.round(epley1RM(set.carga_kg, set.reps))}kg`
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Comparação entre sessões */}
      {recentAgg.length >= 2 && (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="font-heading text-sm font-bold text-foreground">Comparação entre sessões</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-aco-texto">
                    <th className="pb-1 font-medium">Sessão</th>
                    <th className="pb-1 font-medium">Carga máx</th>
                    <th className="pb-1 font-medium">Melhor 1RM</th>
                    <th className="pb-1 font-medium">Volume</th>
                    <th className="pb-1 text-right font-medium">RPE méd</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAgg.map((agg, i) => {
                    const prev = recentAgg[i + 1] // sessão anterior (mais antiga)
                    const isBest = agg.sessionId === bestSessionId
                    return (
                      <tr
                        key={agg.sessionId}
                        className={cn('border-t border-border/60', isBest && 'bg-brasa/10')}
                      >
                        <td className="py-1.5 text-aco-texto">
                          {format(new Date(agg.performedAt), 'd/MM', { locale: ptBR })}
                          {isBest && <span className="ml-1 text-xs text-brasa">★</span>}
                        </td>
                        <td className="py-1.5">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            {agg.cargaMaxima}kg
                            <TrendArrow atual={agg.cargaMaxima} anterior={prev?.cargaMaxima} />
                          </span>
                        </td>
                        <td className="py-1.5">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            {Math.round(agg.melhor1RM)}kg
                            <TrendArrow atual={agg.melhor1RM} anterior={prev?.melhor1RM} />
                          </span>
                        </td>
                        <td className="py-1.5">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            {Math.round(agg.volume)}
                            <TrendArrow atual={agg.volume} anterior={prev?.volume} />
                          </span>
                        </td>
                        <td className="py-1.5 text-right text-foreground">{agg.rpeMedio ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-aco-texto">★ melhor sessão histórica (maior 1RM estimado).</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DecimalValue } from '@/components/ds/metric-hero'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecoveryScores, useSleepLogs, useUpsertSleepLog } from '@/hooks/use-sleep-logs'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'
import {
  formatHoras,
  horasDormidas,
  META_SONO_MAX,
  META_SONO_MIN,
  noiteAnterior,
  pairSleepWithRecovery,
  sleepWeekStats,
} from '@/lib/sleep'

const TOOLTIP_STYLE = {
  background: 'var(--aco)',
  border: '1px solid var(--linha)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--nevoa)',
}

function corDaNoite(horas: number) {
  if (horas >= META_SONO_MIN) return 'var(--ok)'
  if (horas >= 6) return 'var(--atencao)'
  return 'var(--alerta)'
}

/** Sono (Saúde → Sono): histórico manual, média e dívida da semana, correlação com a recuperação. */
export function SonoPage() {
  const hoje = todayInSaoPaulo()
  const sono = useSleepLogs(30)
  const scores = useRecoveryScores(30)
  const upsert = useUpsertSleepLog()
  const [data, setData] = useState(noiteAnterior(hoje))
  const [horas, setHoras] = useState(7)

  const logs = useMemo(() => sono.data ?? [], [sono.data])
  const semana = useMemo(() => sleepWeekStats(logs, hoje), [logs, hoje])
  const barras = useMemo(
    () =>
      logs
        .map((l) => ({ data: l.data, horas: horasDormidas(l) }))
        .filter((b): b is { data: string; horas: number } => b.horas !== null)
        .slice(-14),
    [logs],
  )
  const pares = useMemo(() => pairSleepWithRecovery(logs, scores.data ?? []), [logs, scores.data])

  function salvar() {
    upsert.mutate(
      { data, horas },
      {
        onSuccess: () => toast.success(`Noite de ${format(parseDateOnly(data), 'dd/MM')} registrada: ${formatHoras(horas)}`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Falha ao salvar.'),
      },
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          to="/health"
          className="-ml-2 flex min-h-11 items-center gap-1 self-start rounded-full px-2 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Saúde
        </Link>
        <h1 className="ds-h1 text-foreground">Sono</h1>
        <p className="ds-body-sm text-aco-texto">
          Meta: {META_SONO_MIN}–{META_SONO_MAX}h por noite. O sono de ontem alimenta a recuperação de hoje.
        </p>
      </header>

      {sono.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : sono.isError ? (
        <ErrorState message="Não foi possível carregar o sono." onRetry={() => sono.refetch()} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-[var(--radius-lg)] bg-card p-4">
              <span className="ds-label">Média 7 dias</span>
              <span className="ds-display-sm text-[32px] text-foreground">
                {semana.media != null ? <DecimalValue value={formatHoras(semana.media)} /> : '—'}
              </span>
              <span className="ds-body-sm text-aco-texto">
                {semana.noitesRegistradas} {semana.noitesRegistradas === 1 ? 'noite registrada' : 'noites registradas'}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[var(--radius-lg)] bg-card p-4">
              <span className="ds-label">Dívida da semana</span>
              <span
                className={`ds-display-sm text-[32px] ${semana.divida === 0 ? 'text-ok' : semana.divida < 5 ? 'text-atencao' : 'text-alerta'}`}
              >
                <DecimalValue value={formatHoras(semana.divida)} />
              </span>
              <span className="ds-body-sm text-aco-texto">horas abaixo de {META_SONO_MAX}h</span>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
            <span className="ds-label">Registrar noite</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="ds-body-sm text-aco-texto">Noite de</span>
                <Input type="date" className="h-11" value={data} max={hoje} onChange={(e) => setData(e.target.value)} />
              </label>
              <div className="flex flex-col gap-1">
                <span className="ds-body-sm text-aco-texto">Horas dormidas</span>
                <span className="flex h-11 items-center ds-data-lg text-foreground tabular-nums">{formatHoras(horas)}</span>
              </div>
            </div>
            <input
              type="range"
              min={4}
              max={10}
              step={0.5}
              value={horas}
              onChange={(e) => setHoras(Number(e.target.value))}
              aria-label="Horas dormidas"
              aria-valuetext={formatHoras(horas)}
              className="h-11 w-full accent-brasa"
            />
            <Button type="button" className="min-h-11" disabled={upsert.isPending || !data} onClick={salvar}>
              {upsert.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </section>

          {barras.length === 0 ? (
            <EmptyState message="Nenhuma noite registrada" description="Registre o sono no card de recuperação do Hoje ou aqui acima." />
          ) : (
            <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
              <span className="ds-label">Últimas noites</span>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barras} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" vertical={false} />
                    <ReferenceArea y1={META_SONO_MIN} y2={META_SONO_MAX} fill="var(--ok)" fillOpacity={0.1} />
                    <XAxis
                      dataKey="data"
                      stroke="var(--aco-texto)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(d: string) => format(parseDateOnly(d), 'dd/MM')}
                    />
                    <YAxis stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} ticks={[0, 4, 7, 8, 10]} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: 'var(--aco-claro)' }}
                      labelFormatter={(d) => format(parseDateOnly(String(d)), "EEEEEE, d 'de' MMM", { locale: ptBR })}
                      formatter={(v) => [formatHoras(Number(v)), 'Sono']}
                    />
                    <Bar dataKey="horas" radius={[4, 4, 0, 0]}>
                      {barras.map((b) => (
                        <Cell key={b.data} fill={corDaNoite(b.horas)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="ds-body-sm text-aco-texto">Faixa verde: meta de {META_SONO_MIN}–{META_SONO_MAX}h.</p>
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
            <span className="ds-label">Sono × recuperação</span>
            {pares.length < 3 ? (
              <p className="ds-body-sm text-aco-texto">
                A correlação aparece com 3 dias de sono + score de recuperação ({pares.length} até agora).
              </p>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" />
                    <XAxis
                      type="number"
                      dataKey="horas"
                      name="Sono"
                      domain={[4, 10]}
                      stroke="var(--aco-texto)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(h: number) => `${h}h`}
                    />
                    <YAxis type="number" dataKey="score" name="Recuperação" domain={[0, 100]} stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v, nome) => (nome === 'Sono' ? [formatHoras(Number(v)), 'Sono'] : [`${v}%`, 'Recuperação'])}
                    />
                    <Scatter data={pares} fill="var(--brasa)" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

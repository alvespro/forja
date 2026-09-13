import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useActiveBodyGoal } from '@/hooks/use-body-goals'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'
import { projectWeight } from '@/lib/weight-projection'
import type { BodyMetric } from '@/types/database'

type WeightProjectionCardProps = {
  pesoAtual: number | null
  metrics: BodyMetric[]
}

const TAXAS: { value: string; label: string }[] = [
  { value: '-1', label: '−1 kg/semana' },
  { value: '-0.5', label: '−0,5 kg/semana' },
  { value: '-0.25', label: '−0,25 kg/semana' },
  { value: '0', label: 'Recomposição (manter)' },
  { value: '0.25', label: '+0,25 kg/semana' },
  { value: '0.5', label: '+0,5 kg/semana' },
]

export function WeightProjectionCard({ pesoAtual, metrics }: WeightProjectionCardProps) {
  const goal = useActiveBodyGoal()
  const [pesoMeta, setPesoMeta] = useState('')
  const [touched, setTouched] = useState(false)
  const [taxa, setTaxa] = useState('-0.5')

  // Pré-preenche a meta a partir do ciclo ativo, sem sobrescrever o que o usuário digitar.
  useEffect(() => {
    if (!touched && pesoMeta === '' && goal.data?.peso_meta_kg != null) {
      setPesoMeta(String(goal.data.peso_meta_kg))
    }
  }, [goal.data, touched, pesoMeta])

  const metaNum = useMemo(() => {
    const raw = pesoMeta.trim().replace(',', '.')
    if (raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }, [pesoMeta])

  const projection = useMemo(
    () => projectWeight(pesoAtual, metaNum, Number(taxa), todayInSaoPaulo()),
    [pesoAtual, metaNum, taxa],
  )

  const chartData = useMemo(() => {
    const byTs = new Map<number, { ts: number; real?: number | null; projected?: number | null }>()
    for (const m of metrics) {
      if (m.peso_kg == null) continue
      const ts = parseDateOnly(m.medido_em).getTime()
      byTs.set(ts, { ...(byTs.get(ts) ?? { ts }), ts, real: m.peso_kg })
    }
    for (const p of projection.points) {
      const ts = parseDateOnly(p.date).getTime()
      byTs.set(ts, { ...(byTs.get(ts) ?? { ts }), ts, projected: p.peso })
    }
    return [...byTs.values()].sort((a, b) => a.ts - b.ts)
  }, [metrics, projection.points])

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="font-heading text-sm font-bold text-foreground">Projeção</p>
          <p className="text-xs text-aco-texto">Estime quando você chega na meta no ritmo escolhido.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-aco-texto">Peso atual</span>
            <div className="flex h-8 items-center rounded-lg border border-input bg-input/30 px-2.5 font-mono text-sm text-foreground">
              {pesoAtual != null ? `${pesoAtual} kg` : '—'}
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-aco-texto">Peso meta (kg)</span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={pesoMeta}
              onChange={(e) => {
                setTouched(true)
                setPesoMeta(e.target.value)
              }}
              placeholder="80"
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <span className="text-xs text-aco-texto">Taxa de mudança</span>
            <Select value={taxa} onChange={(e) => setTaxa(e.target.value)}>
              {TAXAS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <ProjectionSummary projection={projection} pesoAtual={pesoAtual} />

        {chartData.length > 0 && (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" vertical={false} />
                <XAxis
                  dataKey="ts"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  stroke="var(--aco-texto)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(ts) => format(new Date(ts), 'd/MM', { locale: ptBR })}
                />
                <YAxis
                  stroke="var(--aco-texto)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--aco)',
                    border: '1px solid var(--linha)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--nevoa)',
                  }}
                  labelFormatter={(ts) => format(new Date(Number(ts)), "d 'de' MMM yyyy", { locale: ptBR })}
                  formatter={(value, name) => [`${value} kg`, name === 'real' ? 'Real' : 'Projetado']}
                />
                {metaNum != null && (
                  <ReferenceLine
                    y={metaNum}
                    stroke="var(--aco-texto)"
                    strokeDasharray="4 4"
                    label={{ value: `Meta ${metaNum}kg`, position: 'insideTopRight', fill: 'var(--aco-texto)', fontSize: 11 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="var(--brasa)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 2, fill: 'var(--brasa)' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="real"
                  stroke="var(--ok)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--ok)' }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectionSummary({
  projection,
  pesoAtual,
}: {
  projection: ReturnType<typeof projectWeight>
  pesoAtual: number | null
}) {
  if (pesoAtual == null || projection.status === 'sem_dados') {
    return <p className="text-xs text-aco-texto">Registre uma medição de peso e defina a meta para ver a projeção.</p>
  }
  if (projection.status === 'ja_atingida') {
    return <p className="text-sm font-medium text-ok">Você já está na meta. 🎯</p>
  }
  if (projection.status === 'recomposicao') {
    return <p className="text-sm font-medium text-foreground">Recomposição — manter o peso enquanto muda a composição.</p>
  }
  if (projection.status === 'taxa_invalida') {
    return (
      <p className="text-sm font-medium text-alerta">
        A taxa escolhida afasta você da meta. Ajuste a direção (perda × ganho).
      </p>
    )
  }
  return (
    <p className="text-sm text-foreground">
      Meta atingida em:{' '}
      <span className="font-medium text-brasa">
        {projection.targetDate ? format(parseDateOnly(projection.targetDate), 'dd/MM/yyyy') : '—'}
      </span>{' '}
      <span className="text-aco-texto">({projection.weeks} semanas)</span>
    </p>
  )
}

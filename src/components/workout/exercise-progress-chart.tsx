import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { SessionAggregate } from '@/lib/workout-metrics'

type ExerciseProgressChartProps = {
  aggregates: SessionAggregate[]
}

function PrDot(props: { cx?: number; cy?: number; payload?: SessionAggregate }) {
  const { cx, cy, payload } = props
  if (!payload?.isPR || cx === undefined || cy === undefined) return null
  return <circle cx={cx} cy={cy} r={5} fill="var(--brasa)" stroke="var(--meia-noite)" strokeWidth={1.5} />
}

export function ExerciseProgressChart({ aggregates }: ExerciseProgressChartProps) {
  const data = aggregates.map((aggregate) => ({
    ...aggregate,
    label: format(new Date(aggregate.performedAt), 'd/MM', { locale: ptBR }),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-aco-texto">Carga máxima e 1RM estimado (Epley) por sessão</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: 'var(--aco)',
                  border: '1px solid var(--linha)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--nevoa)',
                }}
                formatter={(value, name) => [
                  `${Number(value).toFixed(1)} kg`,
                  name === 'cargaMaxima' ? 'Carga máxima' : '1RM estimado',
                ]}
              />
              <Line
                type="monotone"
                dataKey="cargaMaxima"
                stroke="var(--aco-texto)"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="melhor1RM"
                stroke="var(--brasa)"
                strokeWidth={2}
                dot={<PrDot />}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-aco-texto">● dourado = novo recorde (PR) de 1RM estimado.</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-aco-texto">Volume total por sessão (séries × reps × carga)</p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: 'var(--aco)',
                  border: '1px solid var(--linha)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--nevoa)',
                }}
                formatter={(value) => [`${Number(value).toFixed(0)} kg`, 'Volume']}
              />
              <Bar dataKey="volume" fill="var(--brasa-quente)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

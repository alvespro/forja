import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { EmptyState } from '@/components/feedback/empty-state'
import { parseDateOnly } from '@/lib/date'
import type { BodyMetric } from '@/types/database'

type BodyMetricsChartProps = {
  metrics: BodyMetric[]
}

export function BodyMetricsChart({ metrics }: BodyMetricsChartProps) {
  if (metrics.length === 0) {
    return <EmptyState message="Nenhuma medição registrada ainda." />
  }

  const data = metrics.map((metric) => ({
    label: format(parseDateOnly(metric.medido_em), 'd/MM', { locale: ptBR }),
    peso_kg: metric.peso_kg,
    gordura_pct: metric.gordura_pct,
  }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="peso"
            stroke="var(--aco-texto)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={36}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="gordura"
            orientation="right"
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
            formatter={(value, name) => [
              name === 'peso_kg' ? `${value} kg` : `${value}%`,
              name === 'peso_kg' ? 'Peso' : 'Gordura',
            ]}
          />
          <Line
            yAxisId="peso"
            type="monotone"
            dataKey="peso_kg"
            stroke="var(--brasa)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--brasa)' }}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            yAxisId="gordura"
            type="monotone"
            dataKey="gordura_pct"
            stroke="var(--ok)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--ok)' }}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

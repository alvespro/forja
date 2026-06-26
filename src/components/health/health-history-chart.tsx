import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { EmptyState } from '@/components/feedback/empty-state'
import { parseDateOnly } from '@/lib/date'
import type { HealthMetric } from '@/types/database'

type HealthHistoryChartProps = {
  metrics: HealthMetric[]
  unidade: string | null
}

export function HealthHistoryChart({ metrics, unidade }: HealthHistoryChartProps) {
  if (metrics.length === 0) {
    return <EmptyState message="Nenhuma medição registrada ainda." />
  }

  const data = metrics.map((metric) => ({
    measured_at: metric.measured_at,
    label: format(parseDateOnly(metric.measured_at), 'd/MM', { locale: ptBR }),
    valor: metric.valor,
  }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--aco-texto)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
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
            labelFormatter={(label) => label}
            formatter={(value) => [`${value}${unidade ? ` ${unidade}` : ''}`, 'Valor']}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="var(--brasa)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--brasa)' }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

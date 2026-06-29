import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { EmptyState } from '@/components/feedback/empty-state'
import { META_CORRIDA_KM } from '@/components/workout/cardio-goal-card'
import type { CardioSession } from '@/types/database'

type CardioDistanceChartProps = {
  sessions: CardioSession[]
}

export function CardioDistanceChart({ sessions }: CardioDistanceChartProps) {
  const data = sessions
    .filter((session) => session.distancia_km !== null)
    .slice()
    .reverse()
    .map((session) => ({
      label: format(new Date(session.performed_at), 'd/MM', { locale: ptBR }),
      distancia: session.distancia_km,
      atingiuMeta: (session.distancia_km ?? 0) >= META_CORRIDA_KM,
    }))

  if (data.length === 0) {
    return <EmptyState message="Nenhuma distância registrada ainda." />
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--aco-texto)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            stroke="var(--aco-texto)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={36}
            domain={[0, (dataMax: number) => Math.ceil(Math.max(dataMax, META_CORRIDA_KM) * 1.1)]}
          />
          <ReferenceLine
            y={META_CORRIDA_KM}
            stroke="var(--ok)"
            strokeDasharray="4 4"
            label={{ value: `meta ${META_CORRIDA_KM}km`, position: 'insideTopRight', fill: 'var(--ok)', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--aco)',
              border: '1px solid var(--linha)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--nevoa)',
            }}
            formatter={(value) => [`${value}km`, 'Distância']}
          />
          <Line
            type="monotone"
            dataKey="distancia"
            stroke="var(--brasa)"
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; payload?: { atingiuMeta: boolean } }) => {
              const { cx, cy, payload } = props
              if (cx === undefined || cy === undefined) return <g />
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={payload?.atingiuMeta ? 'var(--ok)' : 'var(--brasa)'}
                  stroke="none"
                />
              )
            }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

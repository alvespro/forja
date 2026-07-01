import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

import type { DevArea } from '@/types/database'

type SkillsRadarChartProps = {
  areas: DevArea[]
  onClickArea?: (area: DevArea) => void
}

export function SkillsRadarChart({ areas, onClickArea }: SkillsRadarChartProps) {
  if (areas.length === 0) return null

  const data = areas.map((a) => ({
    area: a.nome,
    atual: a.nivel_atual ?? 0,
    meta: a.nivel_meta ?? 10,
    raw: a,
  }))

  function handleClick(payload: unknown) {
    if (!onClickArea) return
    const p = payload as { activePayload?: Array<{ payload: typeof data[0] }> } | null
    if (p?.activePayload?.[0]) {
      onClickArea(p.activePayload[0].payload.raw)
    }
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} onClick={handleClick}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fill: 'var(--foreground)', fontSize: 11 }}
          />
          <Radar
            name="Meta"
            dataKey="meta"
            stroke="var(--border)"
            fill="transparent"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <Radar
            name="Atual"
            dataKey="atual"
            stroke="#F0A93B"
            fill="#F0A93B"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { diffInDays } from '@/lib/date'
import type { BodyMetric, Protocol } from '@/types/database'

const n1 = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }))
const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`

/** Músculo em kg: peso muscular medido, ou peso × % de músculo. */
const musculoKg = (m: BodyMetric) => m.peso_muscular_kg ?? (m.peso_kg != null && m.musculo_pct != null ? (m.peso_kg * m.musculo_pct) / 100 : null)

/** Semana 6 = exames mid-ciclo; semana 12 = fim do ciclo (semanas completas desde o início). */
const MARCOS = [
  { semana: 6, rotulo: 'Exames mid-ciclo' },
  { semana: 12, rotulo: 'Fim do ciclo' },
]

type Props = { protocolo: Protocol; medicoes: BodyMetric[] }

export function MonitoramentoCiclo({ protocolo, medicoes }: Props) {
  const inicio = protocolo.data_inicio
  const total = protocolo.duracao_semanas ?? 12

  const { partida, pontos } = useMemo(() => {
    if (!inicio) return { partida: null, pontos: [] }
    const ordenadas = [...medicoes].sort((a, b) => a.medido_em.localeCompare(b.medido_em))
    return {
      // Ponto de partida: a medição mais recente até o dia de início.
      partida: [...ordenadas].reverse().find((m) => m.medido_em <= inicio) ?? null,
      pontos: ordenadas
        .filter((m) => m.medido_em >= inicio)
        .map((m) => ({
          semana: Math.round((diffInDays(m.medido_em, inicio) / 7) * 10) / 10,
          data: m.medido_em,
          peso: m.peso_kg,
          gordura: m.gordura_pct ?? m.tgc_pct,
          musculo: m.musculo_pct,
        })),
    }
  }, [medicoes, inicio])

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GlassCard className="flex flex-col gap-3" aria-label="Ponto de partida">
          <span className="ds-label">Ponto de partida{inicio ? ` (${dataBr(inicio)})` : ''}</span>
          {partida ? (
            <>
              <dl className="grid grid-cols-3 gap-2">
                {[
                  ['Peso', `${n1(partida.peso_kg)}kg`],
                  ['Gordura', `${n1(partida.gordura_pct ?? partida.tgc_pct)}%`],
                  ['Músculo', `${n1(musculoKg(partida))}kg`],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo} className="flex flex-col">
                    <dt className="text-[12px] text-cinza">{rotulo}</dt>
                    <dd className="text-[17px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">{valor}</dd>
                  </div>
                ))}
              </dl>
              <span className="text-[12px] text-cinza2-texto">Medição de {dataBr(partida.medido_em)} — a mais recente antes do início.</span>
            </>
          ) : (
            <span className="text-[14px] text-cinza">Nenhuma medição antes do início. Registre uma pesagem em Corpo.</span>
          )}
        </GlassCard>

        <GlassCard className="flex flex-col gap-3" aria-label="Expectativa para o ciclo">
          <span className="ds-label">Expectativa ({total} semanas)</span>
          <dl className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <dt className="text-[12px] text-cinza">Gordura</dt>
              <dd className="text-[17px] font-bold tabular-nums text-ok [font-family:var(--font-display)]">−3 a −5kg</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[12px] text-cinza">Músculo</dt>
              <dd className="text-[17px] font-bold tabular-nums text-ok [font-family:var(--font-display)]">+1 a +2kg</dd>
            </div>
          </dl>
          <span className="text-[12px] text-cinza2-texto">Meta de referência para acompanhar — confira a evolução com o seu médico.</span>
        </GlassCard>
      </div>

      <GlassCard className="flex flex-col gap-3" aria-label="Evolução semanal">
        <span className="flex items-center gap-2 ds-label">
          <Icon name="monitor_heart" size={18} className="text-brasa" />
          Evolução semanal
        </span>
        {pontos.length === 0 ? (
          <p className="text-[14px] text-cinza">Sem medições desde o início do ciclo. Cada pesagem registrada em Corpo entra aqui.</p>
        ) : (
          <div className="h-56" role="img" aria-label={`Peso, gordura e músculo em ${pontos.length} medições desde o início do ciclo`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pontos} margin={{ left: -12, right: 0, top: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--linha)" />
                <XAxis type="number" dataKey="semana" domain={[0, total]} ticks={[0, 3, 6, 9, 12].filter((t) => t <= total)} tick={{ fontSize: 11, fill: 'var(--cinza)' }} label={{ value: 'semanas', position: 'insideBottomRight', offset: -2, fontSize: 10, fill: 'var(--cinza)' }} />
                <YAxis yAxisId="kg" tick={{ fontSize: 11, fill: 'var(--cinza)' }} domain={['dataMin - 2', 'dataMax + 2']} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 11, fill: 'var(--cinza)' }} domain={[0, 70]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--aco)', border: '1px solid var(--linha)', borderRadius: 12, fontSize: 12 }}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.data ? dataBr(payload[0].payload.data) : '')}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {MARCOS.filter((m) => m.semana <= total).map((m) => (
                  <ReferenceLine key={m.semana} yAxisId="kg" x={m.semana} stroke="var(--brasa)" strokeDasharray="4 4" label={{ value: m.rotulo, position: 'top', fontSize: 10, fill: 'var(--brasa)' }} />
                ))}
                <Line yAxisId="kg" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#F9F9F9" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line yAxisId="pct" type="monotone" dataKey="gordura" name="Gordura %" stroke="#FC4C13" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line yAxisId="pct" type="monotone" dataKey="musculo" name="Músculo %" stroke="#4CAF7D" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

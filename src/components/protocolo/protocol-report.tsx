import { Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { groupHealthMetricsByKey } from '@/hooks/use-health-metrics'
import { computeWeekNumber } from '@/lib/protocol'
import type {
  HealthMetric,
  Protocol,
  ProtocolCompound,
  ProtocolExam,
  ProtocolLog,
} from '@/types/database'

type ProtocolReportProps = {
  protocol: Protocol
  compounds: ProtocolCompound[]
  logs: ProtocolLog[]
  exams: ProtocolExam[]
  healthMetrics: HealthMetric[]
  today: string
}

const MARCADORES_RELATORIO = [
  'hematocrito', 'hemoglobina', 'ldl', 'hdl', 'colesterol_total',
  'tgo', 'tgp', 'estradiol', 'testosterona_total', 'psa', 'creatinina', 'lh', 'fsh',
]

function fmt(data: string): string {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

function media(valores: (number | null)[]): string {
  const v = valores.filter((x): x is number => x != null)
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '—'
}

/**
 * Relatório pré-consulta imprimível (window.print + CSS @media print):
 * o médico recebe dados estruturados — compostos, adesão de aplicações,
 * série de marcadores e bem-estar — em vez de memória.
 */
export function ProtocolReport({ protocol, compounds, logs, exams, healthMetrics, today }: ProtocolReportProps) {
  const semana = computeWeekNumber(protocol.data_inicio, today)
  const porMarcador = groupHealthMetricsByKey(healthMetrics)

  const logs28d = logs.filter((l) => {
    const diff = (new Date(today).getTime() - new Date(l.data_aplicacao).getTime()) / 86_400_000
    return diff <= 28
  })

  const realizados = exams.filter((e) => e.status === 'realizado').length

  return (
    <div className="flex flex-col gap-4">
      <div id="protocol-report" className="flex flex-col gap-4 text-sm">
        <div>
          <h2 className="font-heading text-lg font-bold">Relatório de acompanhamento — {protocol.nome}</h2>
          <p className="text-xs text-aco-texto">
            Gerado em {fmt(today)} · Semana {semana}
            {protocol.duracao_semanas ? ` de ${protocol.duracao_semanas}` : ''} · Status:{' '}
            {protocol.status ?? '—'}
            {protocol.medico_responsavel ? ` · Dr. ${protocol.medico_responsavel}` : ''}
          </p>
          <p className="mt-1 text-[10px] text-aco-texto/70">
            Registro do paciente via FORJA. Este documento não contém recomendações — decisões são do médico responsável.
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-semibold">Compostos prescritos</h3>
          {compounds.length === 0 ? (
            <p className="text-xs text-aco-texto">Nenhum registrado.</p>
          ) : (
            <ul className="flex flex-col gap-0.5 text-xs">
              {compounds.map((c) => (
                <li key={c.id}>
                  • {c.nome}
                  {c.dose_mg ? ` — ${c.dose_mg}mg` : ''}
                  {c.frequencia ? ` ${c.frequencia}` : ''}
                  {c.via ? ` (${c.via})` : ''}
                  {c.semana_inicio != null ? ` · sem. ${c.semana_inicio}–${c.semana_fim}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-1 font-semibold">Adesão e bem-estar (últimos 28 dias)</h3>
          <p className="text-xs">
            Aplicações registradas: <strong>{logs28d.length}</strong> · Humor médio:{' '}
            <strong>{media(logs28d.map((l) => l.humor))}/5</strong> · Energia:{' '}
            <strong>{media(logs28d.map((l) => l.energia))}/5</strong> · Libido:{' '}
            <strong>{media(logs28d.map((l) => l.libido))}/5</strong>
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-semibold">Marcadores (série completa)</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-1 pr-2">Marcador</th>
                <th className="py-1 pr-2">Leituras (antiga → recente)</th>
              </tr>
            </thead>
            <tbody>
              {MARCADORES_RELATORIO.filter((m) => porMarcador.has(m)).map((m) => {
                const serie = porMarcador.get(m)!
                return (
                  <tr key={m} className="border-b border-border/40 align-top">
                    <td className="py-1 pr-2 font-medium">{m}</td>
                    <td className="py-1">
                      {serie.map((r) => `${r.valor} (${fmt(r.measured_at)})`).join(' → ')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {MARCADORES_RELATORIO.every((m) => !porMarcador.has(m)) && (
            <p className="text-xs text-aco-texto">Nenhum marcador registrado ainda.</p>
          )}
        </div>

        <div>
          <h3 className="mb-1 font-semibold">Checklist de exames ({realizados}/{exams.length} realizados)</h3>
          <ul className="flex flex-col gap-0.5 text-xs">
            {exams.map((e) => (
              <li key={e.id}>
                {e.status === 'realizado' ? '☑' : '☐'} {e.nome} — sem. {e.semana_alvo ?? '—'}
                {e.data_realizada ? ` (feito ${fmt(e.data_realizada)})` : e.data_prevista ? ` (previsto ${fmt(e.data_prevista)})` : ''}
                {e.status === 'atrasado' ? ' ⚠ ATRASADO' : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Button type="button" onClick={() => window.print()} className="w-full gap-1.5">
        <Printer className="size-4" />
        Imprimir / salvar PDF
      </Button>
    </div>
  )
}

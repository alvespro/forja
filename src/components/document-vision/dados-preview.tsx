import { cn } from '@/lib/utils'
import type { DadosExtraidos } from '@/hooks/useDocumentVision'

const STATUS_PILL_CLASS: Record<string, string> = {
  normal: 'bg-ok/15 text-ok',
  atencao: 'bg-atencao/15 text-atencao',
  alerta: 'bg-alerta/15 text-alerta',
}

/** Renderiza dados_extraidos/dados_confirmados por tipo — nunca exibir o JSON cru ao usuário. */
export function DadosPreview({ dados }: { dados: DadosExtraidos }) {
  if (dados.tipo === 'exame') {
    return (
      <div className="flex flex-col gap-2">
        {dados.marcadores.map((marcador, index) => (
          <div key={index} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">{marcador.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-aco-texto">
                {marcador.valor} {marcador.unidade}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs', STATUS_PILL_CLASS[marcador.status])}>
                {marcador.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (dados.tipo === 'treino') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          {dados.nome_treino} — {dados.foco}
        </p>
        {dados.exercicios.map((exercicio, index) => (
          <div key={index} className="flex flex-col rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">{exercicio.nome}</span>
            <span className="font-mono text-xs text-aco-texto">
              {exercicio.series_alvo}x{exercicio.reps_alvo}
              {exercicio.pausa_seg ? ` · pausa ${exercicio.pausa_seg}s` : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (dados.tipo === 'dieta') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          {dados.nome_plano} — {dados.calorias_alvo ?? '—'} kcal
        </p>
        {dados.refeicoes.map((refeicao, index) => (
          <div key={index} className="flex flex-col rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">
              {refeicao.nome} {refeicao.horario ? `· ${refeicao.horario}` : ''}
            </span>
            <span className="font-mono text-xs text-aco-texto">
              {refeicao.calorias_alvo ?? '—'} kcal · P{refeicao.proteina_g_alvo ?? '—'} C{refeicao.carbo_g_alvo ?? '—'} G
              {refeicao.gordura_g_alvo ?? '—'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {dados.suplementos.map((suplemento, index) => (
        <div key={index} className="flex flex-col rounded-md border border-border px-3 py-2">
          <span className="text-sm text-foreground">{suplemento.nome}</span>
          <span className="font-mono text-xs text-aco-texto">
            {suplemento.dose}
            {suplemento.unidade} · {suplemento.momento} · {(suplemento.dias_semana ?? []).join(', ') || 'todo dia'}
          </span>
        </div>
      ))}
    </div>
  )
}

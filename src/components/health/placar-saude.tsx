import { Fragment, useMemo, useState } from 'react'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { HealthMetricDetail } from '@/components/health/health-metric-card'
import {
  alertasDoPlacar,
  evolucaoDesdeBase,
  GRUPOS,
  montarPlacar,
  type GrupoMarcador,
  type ItemPlacar,
  type StatusMarcador,
  type Variacao,
} from '@/lib/health-markers'
import type { IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { HealthMetric, HealthMetricDef } from '@/types/database'

const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

/** "2026-07-15" → "15/07/26" */
const dataCurta = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}`

/** "2026-06-25" → "junho/2026" */
function mesAno(d: string) {
  const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`))
  return `${mes}/${d.slice(0, 4)}`
}

const STATUS: Record<StatusMarcador, { label: string; icon: IconName | null; cls: string }> = {
  normal: { label: 'Normal', icon: 'check_circle', cls: 'text-ok' },
  atencao: { label: 'Atenção', icon: 'warning', cls: 'text-brasa' },
  critico: { label: 'Crítico', icon: 'error', cls: 'text-alerta-texto' },
  sem_referencia: { label: 'Sem referência', icon: null, cls: 'text-cinza2-texto' },
}

function StatusPill({ status }: { status: StatusMarcador }) {
  const s = STATUS[status]
  return (
    <span className={cn('flex items-center gap-1 text-[12px] font-semibold', s.cls)}>
      {s.icon && <Icon name={s.icon} size={14} filled />}
      {s.label}
    </span>
  )
}

/** "↓ 12 pts": verde se melhorou, vermelho se piorou. */
function VariacaoPill({ variacao }: { variacao: Variacao }) {
  const { delta, sentido } = variacao
  if (sentido === 'estavel' || delta === 0) {
    return <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">= estável</span>
  }
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-[12px] font-bold tabular-nums [font-family:var(--font-display)]',
        sentido === 'melhorou' ? 'text-ok' : 'text-alerta-texto',
      )}
      title={`Anterior: ${num(variacao.anterior)} em ${dataCurta(variacao.dataAnterior)}`}
    >
      <Icon name={delta < 0 ? 'arrow_downward' : 'arrow_upward'} size={14} />
      {num(Math.abs(delta) >= 10 ? Math.round(Math.abs(delta)) : Math.abs(delta))} pts
    </span>
  )
}

function MarcadorTile({ item, selecionado, onSelect }: { item: ItemPlacar; selecionado: boolean; onSelect: () => void }) {
  const { def, valor, data, status, variacao } = item
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded={selecionado}
      aria-label={`${def.label}: ${num(valor)} ${def.unidade}, ${STATUS[status].label}${variacao ? `, ${variacao.sentido} vs anterior` : ''}`}
      className={cn(
        'glass-card interactive flex h-full flex-col gap-1.5 !rounded-[var(--r-md)] p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selecionado && '!border-brasa',
        status === 'critico' && '!border-alerta/60',
      )}
    >
      <span className="line-clamp-1 text-[12px] font-semibold text-cinza">{def.label}</span>
      <span className="flex items-baseline gap-1">
        <span className="text-[22px] font-bold leading-none tabular-nums text-nevoa [font-family:var(--font-display)]">{num(valor)}</span>
        <span className="truncate text-[11px] text-cinza2-texto">{def.unidade}</span>
      </span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] tabular-nums text-cinza2-texto">
        {dataCurta(data)}
        {def.referencia && <span>· ref {def.referencia}</span>}
      </span>
      <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1">
        <StatusPill status={status} />
        {variacao && <VariacaoPill variacao={variacao} />}
      </span>
    </button>
  )
}

/** Def para o painel de histórico (reaproveita o de sempre); meta cadastrada pelo usuário, se houver. */
function defDoItem(item: ItemPlacar, defsDoBanco: HealthMetricDef[]): HealthMetricDef {
  const doBanco = defsDoBanco.find((d) => d.chave === item.chave)
  return {
    id: item.chave,
    user_id: doBanco?.user_id ?? '',
    chave: item.chave,
    label: item.def.label,
    unidade: item.def.unidade,
    direcao: doBanco?.direcao ?? (item.def.direcao === 'faixa' ? null : item.def.direcao),
    valor_meta: doBanco?.valor_meta ?? null,
  }
}

type PlacarSaudeProps = {
  metrics: HealthMetric[]
  defs: HealthMetricDef[]
  metricsByKey: Map<string, HealthMetric[]>
}

/** Placar de Saúde: evolução, alertas e marcadores por grupo, com status e variação vs anterior. */
export function PlacarSaude({ metrics, defs, metricsByKey }: PlacarSaudeProps) {
  const placar = useMemo(() => montarPlacar(metrics), [metrics])
  const alertas = useMemo(() => alertasDoPlacar(placar), [placar])
  const evolucao = useMemo(() => evolucaoDesdeBase(placar), [placar])
  const [filtro, setFiltro] = useState<GrupoMarcador | 'todos'>('todos')
  const [selecionado, setSelecionado] = useState<string | null>(null)

  if (placar.length === 0) return null
  const grupos = filtro === 'todos' ? placar : placar.filter((g) => g.grupo === filtro)
  const presentes = new Set(placar.map((g) => g.grupo))

  return (
    <div className="flex flex-col gap-5">
      {evolucao && (
        <GlassCard gradient glow className="flex flex-col gap-3" padding="var(--s5)" aria-label={`Evolução desde ${mesAno(evolucao.dataBase)}`}>
          <span className="flex items-center gap-2 ds-label">
            <Icon name="trending_down" size={18} className="text-ok" />
            Evolução desde {mesAno(evolucao.dataBase)}
          </span>
          <ul className="flex flex-col divide-y divide-linha">
            {evolucao.itens.map((e) => (
              <li key={e.chave} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="text-[15px] font-semibold text-nevoa">{e.label}</span>
                <span className="flex items-center gap-2 tabular-nums [font-family:var(--font-display)]">
                  <span className="text-[14px] text-cinza">{num(Math.round(e.antes))}</span>
                  <Icon name="arrow_forward" size={14} className="text-cinza2" />
                  <span className="text-[17px] font-bold text-nevoa">{num(e.depois)}</span>
                  <span className={cn('flex items-center text-[13px] font-bold', e.sentido === 'melhorou' ? 'text-ok' : e.sentido === 'piorou' ? 'text-alerta-texto' : 'text-cinza')}>
                    <Icon name={e.delta < 0 ? 'arrow_downward' : 'arrow_upward'} size={14} />
                    {num(Math.abs(Math.round(e.delta)))}
                  </span>
                  <Icon
                    name={e.sentido === 'melhorou' ? 'check_circle' : 'warning'}
                    size={18}
                    filled
                    className={e.sentido === 'melhorou' ? 'text-ok' : 'text-brasa'}
                    label={e.sentido === 'melhorou' ? 'melhorou' : 'piorou'}
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] font-semibold text-nevoa">
            {evolucao.todosMelhoraram ? 'Dieta + exercício funcionando — continue.' : 'Nem tudo melhorou — acompanhe os marcadores em atenção no próximo exame.'}
          </p>
        </GlassCard>
      )}

      {alertas.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Alertas dos exames">
          {alertas.map((a) => (
            <div key={a.chave} role="note" className="flex items-start gap-3 rounded-[var(--r-md)] border border-brasa/40 bg-brasa/[0.08] px-4 py-3">
              <Icon name="warning" size={22} filled className="mt-0.5 shrink-0 text-brasa" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[14px] font-bold text-nevoa">{a.titulo}</span>
                <span className="text-[14px] leading-snug text-cinza">{a.texto}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <div role="radiogroup" aria-label="Grupo de marcadores" className="ds-scroll -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {[{ id: 'todos' as const, label: 'Todos' }, ...GRUPOS.filter((g) => presentes.has(g.id))].map((g) => {
          const ativo = filtro === g.id
          return (
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => {
                setFiltro(g.id)
                setSelecionado(null)
              }}
              className={cn(
                'flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                ativo ? 'border-brasa bg-brasa/15 text-nevoa' : 'border-linha text-cinza hover:text-nevoa',
              )}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      {grupos.map((g) => {
        const atencao = g.itens.filter((i) => i.status === 'atencao' || i.status === 'critico').length
        return (
          <section key={g.grupo} className="flex flex-col gap-2" aria-labelledby={`grupo-${g.grupo}`}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 id={`grupo-${g.grupo}`} className="ds-label !text-nevoa">
                {g.label}
              </h2>
              <span className="text-[12px] tabular-nums text-cinza2-texto">
                {g.itens.length} {g.itens.length === 1 ? 'marcador' : 'marcadores'}
                {atencao > 0 && <span className="text-brasa"> · {atencao} em atenção</span>}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {g.itens.map((item, i) => {
                // O histórico abre no fim da linha do card escolhido (grade de 2 colunas).
                const idxSel = g.itens.findIndex((x) => x.chave === selecionado)
                const abreAqui = idxSel >= 0 && i === Math.min(idxSel | 1, g.itens.length - 1)
                const escolhido = g.itens[idxSel]
                return (
                  <Fragment key={item.chave}>
                    <MarcadorTile
                      item={item}
                      selecionado={item.chave === selecionado}
                      onSelect={() => setSelecionado((atual) => (atual === item.chave ? null : item.chave))}
                    />
                    {abreAqui && escolhido && (
                      <HealthMetricDetail
                        key={escolhido.chave}
                        def={defDoItem(escolhido, defs)}
                        metrics={metricsByKey.get(escolhido.chave) ?? []}
                        onClose={() => setSelecionado(null)}
                      />
                    )}
                  </Fragment>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

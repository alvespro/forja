import { useMemo, useState } from 'react'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { addDaysToDateString, diffInDays } from '@/lib/date'
import { compostosDaSemana, dataDoLog, datasDeAplicacao } from '@/lib/protocol-cycle'
import { cn } from '@/lib/utils'
import type { Protocol, ProtocolCompound, ProtocolLog } from '@/types/database'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const mg = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}mg`)
const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`

function nomeDoMes(ano: number, mes: number) {
  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(ano, mes, 15)))
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

type Props = {
  protocolo: Protocol
  compostos: ProtocolCompound[]
  logs: ProtocolLog[]
  hoje: string
  onRegistrarHoje: () => void
}

type Status = 'registrada' | 'perdida' | 'hoje' | 'futura'

/** Calendário mensal das aplicações: verde registrada, vermelho perdida, brasa hoje. */
export function AgendaAplicacoes({ protocolo, compostos, logs, hoje, onRegistrarHoje }: Props) {
  const aplicacoes = useMemo(() => datasDeAplicacao(protocolo), [protocolo])
  const logsPorData = useMemo(() => {
    const mapa = new Map<string, ProtocolLog[]>()
    for (const l of logs) {
      const d = dataDoLog(l.data_aplicacao)
      mapa.set(d, [...(mapa.get(d) ?? []), l])
    }
    return mapa
  }, [logs])

  const referencia = hoje < (aplicacoes[0] ?? hoje) ? aplicacoes[0] : hoje
  const [mes, setMes] = useState({ ano: Number(referencia.slice(0, 4)), mes: Number(referencia.slice(5, 7)) - 1 })
  const [escolhida, setEscolhida] = useState<string | null>(null)

  const statusDe = (d: string): Status => (d === hoje ? 'hoje' : d > hoje ? 'futura' : logsPorData.has(d) ? 'registrada' : 'perdida')
  const semanaDe = (d: string) => Math.floor(diffInDays(d, protocolo.data_inicio!) / 7) + 1

  // Grade do mês: começa no domingo da semana do dia 1.
  const primeiro = `${mes.ano}-${String(mes.mes + 1).padStart(2, '0')}-01`
  const deslocamento = new Date(Date.UTC(mes.ano, mes.mes, 1)).getUTCDay()
  const diasNoMes = new Date(Date.UTC(mes.ano, mes.mes + 1, 0)).getUTCDate()
  const celulas = Array.from({ length: Math.ceil((deslocamento + diasNoMes) / 7) * 7 }, (_, i) => addDaysToDateString(primeiro, i - deslocamento))

  function mudarMes(delta: number) {
    setEscolhida(null)
    setMes(({ ano, mes: m }) => {
      const total = ano * 12 + m + delta
      return { ano: Math.floor(total / 12), mes: total % 12 }
    })
  }

  function tocar(d: string) {
    if (statusDe(d) === 'hoje') {
      setEscolhida(d)
      onRegistrarHoje()
      return
    }
    setEscolhida((atual) => (atual === d ? null : d))
  }

  return (
    <GlassCard className="flex flex-col gap-4" aria-label="Agenda de aplicações">
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => mudarMes(-1)}>
          <Icon name="chevron_left" size={22} />
        </Button>
        <span className="text-[16px] font-bold text-nevoa" aria-live="polite">
          {nomeDoMes(mes.ano, mes.mes)}
        </span>
        <Button type="button" variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => mudarMes(1)}>
          <Icon name="chevron_right" size={22} />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="grid">
        {DIAS.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-semibold uppercase text-cinza2-texto">
            {d}
          </span>
        ))}
        {celulas.map((d) => {
          const doMes = d.slice(5, 7) === primeiro.slice(5, 7)
          const ehAplicacao = aplicacoes.includes(d)
          const status = ehAplicacao ? statusDe(d) : null
          if (!ehAplicacao) {
            return (
              <span key={d} className={cn('flex h-11 items-center justify-center text-[13px] tabular-nums', doMes ? 'text-cinza' : 'text-cinza2/40', d === hoje && 'font-bold text-nevoa')}>
                {Number(d.slice(8, 10))}
              </span>
            )
          }
          return (
            <button
              key={d}
              type="button"
              onClick={() => tocar(d)}
              aria-pressed={escolhida === d}
              aria-label={`${dataBr(d)}: aplicação ${status === 'registrada' ? 'registrada' : status === 'perdida' ? 'não registrada' : status === 'hoje' ? 'de hoje — registrar' : 'futura'}`}
              className={cn(
                'relative flex h-11 flex-col items-center justify-center rounded-[var(--r-sm)] border text-[13px] font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring',
                status === 'registrada' && 'border-ok/50 bg-ok/15 text-ok',
                status === 'perdida' && 'border-alerta/60 bg-alerta/15 text-alerta-texto',
                status === 'hoje' && 'border-brasa bg-brasa/20 text-nevoa ds-pulse',
                status === 'futura' && 'border-linha bg-white/[0.03] text-nevoa',
                escolhida === d && 'ring-2 ring-nevoa/60',
              )}
            >
              {Number(d.slice(8, 10))}
              <Icon name="vaccines" size={12} filled className="leading-none" />
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-cinza">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ok" /> Registrada</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-alerta" /> Não registrada</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brasa" /> Hoje</span>
      </div>

      {escolhida && statusDe(escolhida) !== 'hoje' && (
        <DetalheDoDia data={escolhida} status={statusDe(escolhida)} semana={semanaDe(escolhida)} total={protocolo.duracao_semanas ?? aplicacoes.length} compostos={compostos} logs={logsPorData.get(escolhida) ?? []} />
      )}
    </GlassCard>
  )
}

function DetalheDoDia({ data, status, semana, total, compostos, logs }: { data: string; status: Status; semana: number; total: number; compostos: ProtocolCompound[]; logs: ProtocolLog[] }) {
  const nomeDe = (id: string | null) => compostos.find((c) => c.id === id)?.nome ?? 'Composto'
  return (
    <section className="flex flex-col gap-2 rounded-[var(--r-md)] border border-linha bg-aco p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-bold text-nevoa">{dataBr(data)}</span>
        <span className="text-[12px] tabular-nums text-cinza">Semana {semana} de {total}</span>
      </div>
      {status === 'registrada' ? (
        <>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ok">
            <Icon name="check_circle" size={16} filled />
            Aplicação registrada{logs[0]?.local_aplicacao ? ` · ${logs[0].local_aplicacao}` : ''}
          </span>
          <ul className="flex flex-col gap-1">
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between text-[13px] text-nevoa">
                {nomeDe(l.compound_id)}
                <span className="tabular-nums">{mg(l.dose_aplicada_mg)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : status === 'perdida' ? (
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-alerta-texto">
          <Icon name="error" size={16} filled />
          Nenhuma aplicação registrada neste dia
        </span>
      ) : (
        <>
          <span className="text-[13px] text-cinza">Compostos previstos</span>
          <ul className="flex flex-col gap-1">
            {compostosDaSemana(compostos, semana).map((c) => (
              <li key={c.id} className="flex justify-between text-[13px] text-nevoa">
                {c.nome}
                <span className="tabular-nums">{mg(c.dose_mg)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

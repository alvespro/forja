import { useState } from 'react'
import { Link } from 'react-router-dom'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { RegistrarAplicacaoModal } from '@/components/protocolo/registrar-aplicacao-modal'
import { useCicloProtocolo } from '@/hooks/use-ciclo-protocolo'
import { cn } from '@/lib/utils'

const mg = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}mg`)

/** "quinta-feira, 24/09" */
function diaEData(data: string) {
  const d = new Date(`${data}T12:00:00Z`)
  const semana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(d)
  return `${semana}, ${data.slice(8, 10)}/${data.slice(5, 7)}`
}

/**
 * Card do ciclo no Hoje: no dia de aplicação, destaque pulsante com os compostos e o
 * registro; nos outros dias, semana e próxima aplicação. Banner se a última passou sem registro.
 */
export function ProtocolCycleCard() {
  const ciclo = useCicloProtocolo()
  const [registrando, setRegistrando] = useState(false)
  const { estado, protocolo } = ciclo

  if (ciclo.carregando || ciclo.erro || !protocolo || !estado || estado.fase === 'sem_data') return null

  const modal =
    estado.fase === 'ativo' ? (
      <RegistrarAplicacaoModal
        open={registrando}
        onClose={() => setRegistrando(false)}
        protocolId={protocolo.id}
        compostos={ciclo.compostosDaSemana}
        semana={estado.semana}
        totalSemanas={estado.totalSemanas}
        jaRegistradoHoje={ciclo.registradoHoje}
      />
    ) : null

  const banner = ciclo.naoRegistrada && (
    <div role="alert" className="flex flex-col gap-2 rounded-[var(--r-md)] border border-amber-400/50 bg-amber-400/10 px-4 py-3">
      <span className="flex items-start gap-2 text-[14px] font-semibold text-amber-200">
        <Icon name="warning" size={20} filled className="mt-0.5 shrink-0 text-amber-300" />
        Aplicação de {diaEData(ciclo.naoRegistrada)} não registrada — você aplicou? Registre agora.
      </span>
      <Link to="/protocolo" state={{ tab: 'agenda' }} className="ds-btn-ghost min-h-11 self-start px-4">
        Abrir agenda
      </Link>
    </div>
  )

  const alertas = ciclo.alertas.map((a) =>
    a.tipo === 'exames_mid_ciclo' ? (
      <div key="exames" role="note" className="flex flex-col gap-1 rounded-[var(--r-md)] border border-brasa/40 bg-brasa/[0.08] px-4 py-3">
        <span className="flex items-center gap-2 text-[14px] font-bold text-nevoa">
          <Icon name="science" size={18} className="text-brasa" />
          {a.dias === 0 ? 'Exames mid-ciclo hoje' : `Exames mid-ciclo em ${a.dias} ${a.dias === 1 ? 'dia' : 'dias'} — agendar agora`}
        </span>
        <ul className="ml-7 list-disc text-[13px] text-cinza">
          {a.exames.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    ) : (
      <p key="ultima" role="note" className="flex items-start gap-2 rounded-[var(--r-md)] border border-brasa/40 bg-brasa/[0.08] px-4 py-3 text-[14px] font-semibold text-nevoa">
        <Icon name="warning" size={18} filled className="mt-0.5 shrink-0 text-brasa" />
        Última aplicação do ciclo esta semana.
      </p>
    ),
  )

  if (estado.fase === 'antes') {
    return (
      <GlassCard className="flex items-center gap-3" padding="var(--s4)" aria-label="Ciclo do protocolo">
        <Icon name="science" size={24} className="shrink-0 text-brasa" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-bold text-nevoa">{estado.diasParaInicio === 1 ? 'Ciclo inicia amanhã' : `Ciclo inicia em ${estado.diasParaInicio} dias`}</span>
          <span className="text-[13px] text-cinza">Primeira aplicação: {diaEData(estado.inicio)}</span>
        </div>
      </GlassCard>
    )
  }

  if (estado.fase === 'concluido') {
    return (
      <GlassCard className="flex items-center gap-3" padding="var(--s4)" aria-label="Ciclo do protocolo">
        <Icon name="check_circle" size={24} filled className="shrink-0 text-ok" />
        <span className="text-[15px] font-bold text-nevoa">Ciclo concluído</span>
      </GlassCard>
    )
  }

  // Dia de aplicação: destaque com os compostos e o registro.
  if (estado.ehDiaDeAplicacao) {
    return (
      <>
        {modal}
        <GlassCard glow className={cn('flex flex-col gap-4 !border-brasa', !ciclo.registradoHoje && 'ds-pulse')} padding="var(--s5)" aria-label="Dia de aplicação">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 ds-label !text-brasa">
              <Icon name="vaccines" size={20} filled className="text-brasa" />
              Dia de aplicação
            </span>
            <span className="text-[13px] font-semibold tabular-nums text-nevoa [font-family:var(--font-display)]">
              Semana {estado.semana} de {estado.totalSemanas}
            </span>
          </div>
          <ul className="flex flex-col divide-y divide-linha">
            {ciclo.compostosDaSemana.map((c) => (
              <li key={c.id} className="flex min-h-11 items-center justify-between gap-3">
                <span className="text-[15px] text-nevoa">{c.nome}</span>
                <span className="text-[15px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">{mg(c.dose_mg)}</span>
              </li>
            ))}
          </ul>
          {ciclo.registradoHoje ? (
            <p className="flex items-center gap-2 text-[14px] font-semibold text-ok">
              <Icon name="check_circle" size={20} filled />
              Aplicação de hoje registrada
            </p>
          ) : (
            <button type="button" onClick={() => setRegistrando(true)} className="ds-btn-primary min-h-12 w-full text-[15px]">
              <Icon name="check" size={20} />
              Registrar aplicação
            </button>
          )}
        </GlassCard>
        {banner}
        {alertas}
      </>
    )
  }

  return (
    <>
      <GlassCard className="flex items-center gap-3" padding="var(--s4)" aria-label="Ciclo do protocolo">
        <Icon name="science" size={24} className="shrink-0 text-brasa" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-bold text-nevoa">
            Ciclo ativo — Semana {estado.semana} de {estado.totalSemanas}
          </span>
          {estado.proximaAplicacao && <span className="text-[13px] text-cinza">Próxima aplicação: {diaEData(estado.proximaAplicacao)}</span>}
        </div>
      </GlassCard>
      {banner}
      {alertas}
    </>
  )
}

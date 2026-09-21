// Views puras das fases do treino v2 (mobilidade, aquecimento, cardio) e do destaque de
// observação. Como session-views: recebem valores e callbacks, sem tocar no banco.

import { Icon } from '@/components/Icon'
import { formatClock } from '@/components/workout/session/session-views'
import { destaqueObservacao, FASE_LABEL } from '@/lib/workout-phases'
import { cn } from '@/lib/utils'
import type { WorkoutFase } from '@/types/database'

/* ────────────────────────── observação em destaque ────────────────────────── */

/** "TRIO ATIVADOR — 80 reps…": rótulo em caixa alta com o detalhe abaixo. */
export function ObservacaoDestaque({ texto, tom = 'brasa' }: { texto: string | null | undefined; tom?: 'brasa' | 'neutro' }) {
  const obs = destaqueObservacao(texto)
  if (!obs) return null
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-[var(--r-md)] border px-4 py-3',
        tom === 'brasa' ? 'border-brasa/50 bg-brasa/10' : 'border-[var(--glass-border)] bg-[var(--glass-bg)]',
      )}
    >
      <Icon name="bolt" size={22} filled className={cn('mt-0.5 shrink-0', tom === 'brasa' ? 'text-brasa' : 'text-cinza')} />
      <div className="flex min-w-0 flex-col gap-0.5">
        {obs.rotulo && <span className="text-[14px] font-extrabold uppercase tracking-[0.06em] text-brasa">{obs.rotulo}</span>}
        {obs.detalhe && <span className="text-[14px] leading-snug text-nevoa">{obs.detalhe}</span>}
      </div>
    </div>
  )
}

/* ─────────────────────── mobilidade / aquecimento ─────────────────────── */

export type PhaseTimerViewProps = {
  fase: WorkoutFase
  nome: string
  cues?: string | null
  observacao?: string | null
  media?: React.ReactNode
  restanteSeg: number
  totalSeg: number
  rodando: boolean
  /** Posição dentro da fase: "2 de 4 exercícios". */
  posicao: number
  totalFase: number
  proximoNome?: string | null
  onToggle: () => void
  onNext: () => void
}

/**
 * Exercício guiado por tempo, sem carga. Mobilidade tem fundo âmbar e o selo PRÉ-TREINO;
 * o cronômetro começa sozinho e o container avança ao zerar.
 */
export function PhaseTimerView({
  fase,
  nome,
  cues,
  observacao,
  media,
  restanteSeg,
  totalSeg,
  rodando,
  posicao,
  totalFase,
  proximoNome,
  onToggle,
  onNext,
}: PhaseTimerViewProps) {
  const mobilidade = fase === 'mobilidade'
  const zerou = restanteSeg <= 0
  const pct = totalSeg > 0 ? Math.max(0, Math.min(100, ((totalSeg - restanteSeg) / totalSeg) * 100)) : 0

  return (
    <section
      aria-label={`${FASE_LABEL[fase]}: ${nome}`}
      className={cn(
        'flex flex-col gap-5 rounded-[var(--r-lg)] border p-5',
        mobilidade ? 'border-amber-400/30 bg-amber-400/[0.07]' : 'border-[var(--glass-border)] bg-[var(--glass-bg)]',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]',
            mobilidade ? 'bg-amber-400/15 text-amber-300' : 'bg-white/[0.06] text-cinza',
          )}
        >
          <Icon name={mobilidade ? 'self_improvement' : 'directions_walk'} size={16} filled />
          {mobilidade ? 'Pré-treino' : FASE_LABEL[fase]}
        </span>
        <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">
          <span className={mobilidade ? 'text-amber-300' : 'text-nevoa'}>{posicao}</span> de {totalFase} nesta fase
        </span>
      </div>

      {/* Progresso dentro da fase: um segmento por exercício */}
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: totalFase }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full',
              i < posicao - 1 ? (mobilidade ? 'bg-amber-400' : 'bg-nevoa') : i === posicao - 1 ? (mobilidade ? 'bg-amber-400/50' : 'bg-nevoa/50') : 'bg-white/[0.08]',
            )}
          />
        ))}
      </div>

      <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.015em] text-nevoa">{nome}</h2>

      {media && <div className="overflow-hidden rounded-[var(--r-md)] bg-aco2">{media}</div>}

      {cues && (
        <p className="flex items-start gap-2 text-[15px] leading-relaxed text-nevoa">
          <Icon name="info" size={20} className={cn('mt-0.5 shrink-0', mobilidade ? 'text-amber-300' : 'text-cinza')} />
          {cues}
        </p>
      )}
      <ObservacaoDestaque texto={observacao} tom="neutro" />

      <div className="flex flex-col items-center gap-3 py-2" role="timer" aria-live={zerou ? 'assertive' : 'off'}>
        <span className="text-[12px] font-semibold text-cinza">Tempo restante</span>
        <span
          className={cn(
            'text-[64px] font-bold leading-none tracking-[-0.02em] tabular-nums [font-family:var(--font-display)]',
            zerou ? 'text-ok' : mobilidade ? 'text-amber-300' : 'text-nevoa',
          )}
        >
          {formatClock(restanteSeg)}
        </span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn('h-full rounded-full', zerou ? 'bg-ok' : mobilidade ? 'bg-amber-400' : 'bg-nevoa')}
            style={{ width: `${pct}%`, transition: 'width 0.25s linear' }}
          />
        </div>
        {zerou && proximoNome && <span className="text-[13px] text-cinza">A seguir: {proximoNome}</span>}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={zerou}
          aria-label={rodando ? 'Pausar cronômetro' : 'Retomar cronômetro'}
          className="ds-btn-ghost flex min-h-12 shrink-0 items-center gap-1.5 rounded-full px-3 disabled:opacity-40"
        >
          <Icon name={rodando ? 'pause' : 'play_arrow'} size={24} filled />
          {rodando ? 'Pausar' : 'Retomar'}
        </button>
        <button type="button" onClick={onNext} className="ds-btn-primary min-h-12 flex-1 text-[15px]">
          Próximo
          <Icon name="arrow_forward" size={20} />
        </button>
      </div>
    </section>
  )
}

/* ────────────────────────────────── cardio ────────────────────────────────── */

export type CardioTimerViewProps = {
  nome: string
  observacao?: string | null
  cues?: string | null
  restanteSeg: number
  totalSeg: number
  rodando: boolean
  iniciado: boolean
  onToggle: () => void
  onReset: () => void
  onFinish?: () => void
}

/** Cardio: cronômetro grande (ex.: 18:00), a escolha do aparelho e o botão de fechar o treino. */
export function CardioTimerView({ nome, observacao, cues, restanteSeg, totalSeg, rodando, iniciado, onToggle, onReset, onFinish }: CardioTimerViewProps) {
  const zerou = restanteSeg <= 0
  const pct = totalSeg > 0 ? Math.max(0, Math.min(100, ((totalSeg - restanteSeg) / totalSeg) * 100)) : 0

  return (
    <section aria-label={`Cardio: ${nome}`} className="glass-card gradient flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-brasa/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-brasa">
          <Icon name="directions_run" size={16} filled />
          Cardio
        </span>
        <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">{Math.round(totalSeg / 60)} min</span>
      </div>

      <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.015em] text-nevoa">{nome}</h2>

      {observacao && (
        <p className="flex items-start gap-2 rounded-[var(--r-md)] border border-brasa/40 bg-brasa/10 px-4 py-3 text-[15px] font-semibold leading-snug text-nevoa">
          <Icon name="info" size={20} className="mt-0.5 shrink-0 text-brasa" />
          {observacao}
        </p>
      )}
      {cues && <p className="text-[14px] leading-relaxed text-cinza">{cues}</p>}

      <div className="flex flex-col items-center gap-4 py-4" role="timer" aria-live={zerou ? 'assertive' : 'off'}>
        <span
          className={cn(
            'text-[88px] font-bold leading-none tracking-[-0.03em] tabular-nums [font-family:var(--font-display)]',
            zerou ? 'text-ok' : 'text-brasa [text-shadow:var(--shadow-glow)]',
          )}
        >
          {formatClock(restanteSeg)}
        </span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className={cn('h-full rounded-full', zerou ? 'bg-ok' : 'bg-brasa')} style={{ width: `${pct}%`, transition: 'width 0.25s linear' }} />
        </div>
        {zerou && <span className="text-[15px] font-semibold text-ok">Cardio concluído</span>}
      </div>

      <div className="flex gap-2">
        {iniciado && !zerou && (
          <button type="button" onClick={onReset} aria-label="Zerar cronômetro" className="ds-btn-ghost size-12 shrink-0 !rounded-full !p-0">
            <Icon name="restart_alt" size={22} />
          </button>
        )}
        {zerou ? (
          onFinish && (
            <button type="button" onClick={onFinish} className="ds-btn-primary min-h-12 flex-1 text-[15px]">
              <Icon name="flag" size={20} />
              Finalizar treino
            </button>
          )
        ) : (
          <button type="button" onClick={onToggle} className="ds-btn-primary min-h-12 flex-1 text-[15px]">
            <Icon name={rodando ? 'pause' : 'play_arrow'} size={22} filled />
            {rodando ? 'Pausar' : iniciado ? 'Retomar' : 'Iniciar cardio'}
          </button>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────── badge de mobilidade ─────────────────────────── */

/** Selo âmbar dos cards de treino: "5min mobilidade" quando o treino tem a fase pré-treino. */
export function MobilidadeBadge({ minutos }: { minutos: number | null }) {
  if (minutos == null) return null
  return (
    <span className="flex w-fit items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[12px] font-semibold text-amber-300">
      <Icon name="self_improvement" size={14} filled />
      {minutos}min mobilidade
    </span>
  )
}

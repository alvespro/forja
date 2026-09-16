// Views puras da execução de treino (modo imersivo). Recebem valores e callbacks,
// sem acessar dados — os containers (SessionRunner, SetRow, RestTimer) ligam ao
// banco, e a galeria /design renderiza exatamente o mesmo visual com dados de exemplo.

import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { BodyMap } from '@/components/BodyMap'
import { YoutubeEmbed } from '@/components/workout/youtube-embed'
import { cn } from '@/lib/utils'

/* ─────────────────────────────── utilidades ─────────────────────────────── */

export function formatClock(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : ''
  const abs = Math.abs(Math.round(totalSeconds))
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${sign}${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

const kg = (n: number | null | undefined) => (n == null ? '—' : String(n).replace('.', ','))

/* ────────────────────────────── cabeçalho ──────────────────────────────── */

export type ImmersiveHeaderProps = {
  atual: number
  total: number
  elapsedSeconds: number
  treinoNome?: string | null
  onPrev?: () => void
  onNext?: () => void
  onMinimize?: () => void
  onAskCoach?: () => void
  onFinish?: () => void
}

/** Topo do modo imersivo: barra de progresso com o gradiente da marca, "← Voltar", "Exercício X / Y" e o tempo decorrido. */
export function ImmersiveHeader({
  atual,
  total,
  elapsedSeconds,
  treinoNome,
  onPrev,
  onNext,
  onMinimize,
  onAskCoach,
  onFinish,
}: ImmersiveHeaderProps) {
  const pct = total > 0 ? (atual / total) * 100 : 0
  return (
    <header className="flex flex-col gap-3">
      <div className="-mx-4 h-[2px] overflow-hidden bg-white/[0.06] md:mx-0 md:rounded-full" aria-hidden="true">
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: 'var(--gradient-brand)', transition: 'width var(--dur-normal) var(--spring-smooth)' }}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          onClick={onMinimize}
          className="flex min-h-11 items-center gap-1 justify-self-start rounded-full pr-3 text-[14px] text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="arrow_back" size={22} />
          Voltar
        </button>

        <div className="flex min-w-0 flex-col items-center">
          <span className="text-[12px] tabular-nums text-cinza2-texto [font-family:var(--font-display)]">
            Exercício <span className="text-nevoa">{atual}</span> / {total}
          </span>
          <span className="text-[15px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">{formatClock(elapsedSeconds)}</span>
        </div>

        <button
          type="button"
          onClick={onAskCoach}
          aria-label="Perguntar ao coach"
          className="flex size-11 items-center justify-center justify-self-end rounded-full text-cinza outline-none hover:text-brasa focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="psychology" size={24} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={atual <= 1}
          aria-label="Exercício anterior"
          className="glass-card flex size-11 shrink-0 items-center justify-center !rounded-full text-nevoa outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="chevron_left" size={22} />
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-[13px] text-cinza">{treinoNome}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={atual >= total}
          aria-label="Próximo exercício"
          className="glass-card flex size-11 shrink-0 items-center justify-center !rounded-full text-nevoa outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="chevron_right" size={22} />
        </button>
      </div>

      {onFinish && (
        <button
          type="button"
          onClick={onFinish}
          className="flex min-h-11 items-center gap-1 self-end px-2 text-[13px] font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="flag" size={18} />
          Finalizar treino
        </button>
      )}
    </header>
  )
}

/* ─────────────────────────── exercício em foco ─────────────────────────── */

export type ExerciseFocusProps = {
  /** Mídia do ExerciseDB (MP4/GIF) já renderizada; sem ela, YouTube ou BodyMap. */
  media?: React.ReactNode
  nome: string
  grupo: string | null
  youtubeId?: string | null
  prescricao?: { series: number | null; reps: string | null; pausaSeg: number | null }
  ultima?: { cargaKg: number | null; reps: number | null } | null
  sugestao?: { tipo: 'sobe' | 'mantem'; cargaKg: number | null; texto: string } | null
}

/** Exercício atual: nome em destaque, vídeo (ou BodyMap), última carga e sugestão de progressão. */
export function ExerciseFocus({ media, nome, grupo, youtubeId, prescricao, ultima, sugestao }: ExerciseFocusProps) {
  const midia = media ?? (youtubeId ? <YoutubeEmbed videoId={youtubeId} title={nome} /> : null)
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {!midia && (
          <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.015em] text-nevoa [font-family:var(--font-heading)]">
            {nome}
          </h2>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {grupo && (
            <span className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1 ds-body-sm font-medium text-nevoa first-letter:uppercase">
              {grupo}
            </span>
          )}
          {prescricao && (
            <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">
              {prescricao.series ?? '—'}×{prescricao.reps ?? '—'} · pausa {prescricao.pausaSeg ?? '—'}s
            </span>
          )}
        </div>
      </div>

      {midia ? (
        <div className="glass-card !rounded-[var(--r-md)] p-0">
          <div className="overflow-hidden rounded-[var(--r-md)] bg-aco2">{midia}</div>
          {/* Nome sobre o gradiente da base (o vídeo do YouTube tem controles embaixo: nome fica acima dele). */}
          {media ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[var(--r-md)] bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-10">
              <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.015em] text-nevoa [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">{nome}</h2>
            </div>
          ) : (
            <h2 className="px-4 py-3 text-[22px] font-extrabold leading-tight text-nevoa">{nome}</h2>
          )}
        </div>
      ) : (
        <div className="glass-card flex justify-center !rounded-[var(--r-md)] py-4">
          <BodyMap size="md" musculosAtivos={grupo ? [grupo] : []} />
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="ds-label">Última carga</span>
          <span className="text-[24px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">
            {ultima ? `${kg(ultima.cargaKg)} kg × ${ultima.reps ?? '—'}` : 'primeira vez'}
          </span>
        </div>
        {sugestao && sugestao.cargaKg != null && (
          <span
            title={sugestao.texto}
            className={cn(
              'flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-bold',
              sugestao.tipo === 'sobe' ? 'border-brasa/60 bg-brasa/10 text-brasa' : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-cinza',
            )}
          >
            <Icon name={sugestao.tipo === 'sobe' ? 'trending_up' : 'repeat'} size={16} />
            {sugestao.tipo === 'sobe' ? `Tente ${kg(sugestao.cargaKg)} kg` : `Repita ${kg(sugestao.cargaKg)} kg`}
          </span>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────────────── série ───────────────────────────────── */

export type SetRowViewProps = {
  serieNum: number
  carga: string
  reps: string
  rpe: string
  cadencia: string
  concluida: boolean
  saving?: boolean
  onChange: (campo: 'carga' | 'reps' | 'rpe' | 'cadencia', valor: string) => void
  onComplete: () => void
  onEdit?: () => void
}

/**
 * Uma série: carga × reps em inputs grandes (≥44px) e botão de concluir.
 * RPE e cadência ficam recolhidos em "mais" — continuam sendo gravados, porque
 * o detector de estagnação/deload depende do RPE.
 */
export function SetRowView({
  serieNum,
  carga,
  reps,
  rpe,
  cadencia,
  concluida,
  saving = false,
  onChange,
  onComplete,
  onEdit,
}: SetRowViewProps) {
  const [maisAberto, setMaisAberto] = useState(false)

  if (concluida) {
    return (
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Série ${serieNum} concluída: ${carga || '—'} kg × ${reps || '—'}. Tocar para editar`}
        className="glass-card interactive flex min-h-14 w-full items-center gap-3 !rounded-[var(--r-md)] !border-ok/30 px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="ds-data-md w-6 text-aco-texto">{serieNum}</span>
        <span className="flex-1 text-[18px] font-bold text-foreground [font-family:var(--font-data)]">
          {carga || '—'} <span className="ds-data-md text-aco-texto">kg</span> × {reps || '—'}
          {rpe && <span className="ds-data-md text-aco-texto"> · RPE {rpe}</span>}
        </span>
        <Icon name="check_circle" size={32} filled className="ds-celebrate text-ok" />
      </button>
    )
  }

  const inputCls =
    'h-12 w-full min-w-0 rounded-[var(--r-sm)] border border-linha bg-aco2 px-2 text-center text-[20px] font-bold text-nevoa tabular-nums [font-family:var(--font-data)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-brasa focus:shadow-[0_0_0_3px_rgba(252,76,19,0.2)]'

  return (
    <div className="glass-card flex flex-col gap-2 !rounded-[var(--r-md)] p-3">
      <div className="flex items-end gap-2">
        <span className="ds-terminal-md flex h-12 w-6 shrink-0 items-center text-cinza">{String(serieNum).padStart(2, '0')}</span>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="ds-terminal-xs text-cinza">Carga (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={carga}
            onChange={(e) => onChange('carga', e.target.value)}
            aria-label={`Carga da série ${serieNum} em kg`}
            className={inputCls}
          />
        </label>
        <span className="flex h-12 items-center text-[16px] text-cinza2-texto [font-family:var(--font-display)]" aria-hidden="true">
          ×
        </span>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="ds-terminal-xs text-cinza">Reps</span>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => onChange('reps', e.target.value)}
            aria-label={`Repetições da série ${serieNum}`}
            className={inputCls}
          />
        </label>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving}
          aria-label={`Concluir série ${serieNum}`}
          className="ds-pressable flex size-12 shrink-0 items-center justify-center rounded-full text-brasa outline-none hover:bg-brasa/10 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="check_circle" size={36} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMaisAberto((v) => !v)}
        aria-expanded={maisAberto}
        className="flex min-h-11 items-center gap-1.5 self-start pr-2 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="tune" size={14} />
        {maisAberto ? 'Menos' : 'RPE e cadência'}
      </button>

      {maisAberto && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={10}
            placeholder="RPE"
            value={rpe}
            onChange={(e) => onChange('rpe', e.target.value)}
            aria-label={`RPE da série ${serieNum}`}
            className={cn(inputCls, 'h-11 text-[16px]')}
          />
          <input
            placeholder="cadência"
            value={cadencia}
            onChange={(e) => onChange('cadencia', e.target.value)}
            aria-label={`Cadência da série ${serieNum}`}
            className={cn(inputCls, 'h-11 text-[16px]')}
          />
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────── cronômetro de pausa ─────────────────────────── */

export type RestTimerViewProps = {
  remainingSeconds: number
  targetSeconds: number
  onFinish: () => void
  /** `fixed` no app; a galeria usa `absolute` dentro da moldura do celular. */
  position?: 'fixed' | 'absolute'
}

/** Cronômetro de pausa fixo no rodapé: vermilion contando, verde ao zerar; a barra fina encolhe com o tempo. */
export function RestTimerView({ remainingSeconds, targetSeconds, onFinish, position = 'fixed' }: RestTimerViewProps) {
  const zerou = remainingSeconds <= 0
  const pct = targetSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / targetSeconds) * 100)) : 0

  return (
    <div
      role="timer"
      aria-live={zerou ? 'assertive' : 'off'}
      className={cn(
        position,
        'inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-[var(--r-lg)] border-t border-[var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-[30px] backdrop-saturate-[180%] ds-safe-bottom',
      )}
      style={{ backgroundColor: 'rgba(16,16,16,0.72)' }}
    >
      <div className="h-[3px] w-full bg-white/[0.06]">
        <div
          className={cn('h-full', zerou ? 'bg-ok' : 'bg-brasa')}
          style={{ width: `${pct}%`, transition: 'width 1s linear' }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <div className="flex flex-col gap-1">
          <span className={cn('flex items-center gap-1.5 ds-label', zerou ? '!text-ok' : '')}>
            <Icon name="timer" size={20} className={zerou ? 'text-ok' : 'text-brasa'} filled={zerou} />
            {zerou ? 'Pode começar' : 'Pausa'}
          </span>
          <span
            className={cn(
              'text-[48px] font-bold leading-none tracking-[-0.02em] tabular-nums [font-family:var(--font-display)]',
              zerou ? 'text-ok' : 'text-brasa',
            )}
          >
            {formatClock(remainingSeconds)}
          </span>
        </div>
        <button
          type="button"
          onClick={onFinish}
          className={cn(
            'ds-pressable flex min-h-12 shrink-0 items-center rounded-full px-5 ds-body-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
            zerou ? 'bg-ok text-fundo' : 'border border-[var(--glass-border)] bg-[var(--glass-bg)] text-nevoa',
          )}
        >
          <Icon name={zerou ? 'play_arrow' : 'skip_next'} size={20} filled={zerou} className="mr-1" />
          {zerou ? 'Próxima série' : 'Pular'}
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────── resumo pós-treino ─────────────────────────── */

export type PostWorkoutSummaryProps = {
  duracaoSeg: number
  series: number
  volumeKg: number
  exercicios: number
  /** Grupos musculares trabalhados (texto livre, ex.: "Costas e Bíceps"). */
  musculos: string[]
  onClose: () => void
}

/** Fechamento do treino: músculos trabalhados em destaque no BodyMap + números da sessão. */
export function PostWorkoutSummary({ duracaoSeg, series, volumeKg, exercicios, musculos, onClose }: PostWorkoutSummaryProps) {
  const stats = [
    { label: 'Duração', valor: formatClock(duracaoSeg) },
    { label: 'Séries', valor: String(series) },
    { label: 'Volume', valor: `${Math.round(volumeKg).toLocaleString('pt-BR')} kg` },
    { label: 'Exercícios', valor: String(exercicios) },
  ]
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="ds-label text-ok">Treino concluído</span>
      {/* Frente e costas juntas: todo músculo trabalhado aparece sem precisar girar */}
      <div className="flex items-end justify-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <BodyMap size="md" vista="frente" musculosAtivos={musculos} />
          <span className="ds-data-sm text-aco-texto">frente</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <BodyMap size="md" vista="costas" musculosAtivos={musculos} />
          <span className="ds-data-sm text-aco-texto">costas</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-[var(--r-md)] border border-linha bg-aco px-3 py-3">
            <span className="ds-label">{s.label}</span>
            <span className="text-[22px] font-bold text-nevoa [font-family:var(--font-display)] tabular-nums">{s.valor}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ds-btn-primary w-full"
      >
        Fechar
      </button>
    </div>
  )
}

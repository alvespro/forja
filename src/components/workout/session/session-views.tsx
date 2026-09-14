// Views puras da execução de treino (modo imersivo). Recebem valores e callbacks,
// sem acessar dados — os containers (SessionRunner, SetRow, RestTimer) ligam ao
// banco, e a galeria /design renderiza exatamente o mesmo visual com dados de exemplo.

import { useState } from 'react'
import { Brain, Check, ChevronLeft, ChevronRight, Minimize2, SlidersHorizontal } from 'lucide-react'

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

/** Topo do modo imersivo: progresso "Exercício 2 / 5" com barra fina e tempo decorrido. */
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
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimizar treino"
          className="flex size-11 items-center justify-center rounded-full text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Minimize2 className="size-5" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-col items-center">
          {treinoNome && <span className="ds-label truncate">{treinoNome}</span>}
          <span className="ds-data-lg text-foreground tabular-nums">{formatClock(elapsedSeconds)}</span>
        </div>

        <button
          type="button"
          onClick={onAskCoach}
          aria-label="Perguntar ao coach"
          className="flex size-11 items-center justify-center rounded-full text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Brain className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={atual <= 1}
          aria-label="Exercício anterior"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-linha text-foreground outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="ds-data-md text-center text-aco-texto">
            Exercício <span className="text-foreground">{atual}</span> / {total}
          </span>
          <div className="h-1 w-full overflow-hidden rounded-full bg-aco-claro">
            <div
              className="h-full rounded-full bg-brasa"
              style={{ width: `${pct}%`, transition: 'width var(--dur-normal) var(--spring-smooth)' }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={atual >= total}
          aria-label="Próximo exercício"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-linha text-foreground outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      {onFinish && (
        <button
          type="button"
          onClick={onFinish}
          className="flex min-h-11 items-center self-end px-2 ds-body-sm font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Finalizar treino
        </button>
      )}
    </header>
  )
}

/* ─────────────────────────── exercício em foco ─────────────────────────── */

export type ExerciseFocusProps = {
  nome: string
  grupo: string | null
  youtubeId?: string | null
  prescricao?: { series: number | null; reps: string | null; pausaSeg: number | null }
  ultima?: { cargaKg: number | null; reps: number | null } | null
  sugestao?: { tipo: 'sobe' | 'mantem'; cargaKg: number | null; texto: string } | null
}

/** Exercício atual: nome em destaque, vídeo (ou BodyMap), última carga e sugestão de progressão. */
export function ExerciseFocus({ nome, grupo, youtubeId, prescricao, ultima, sugestao }: ExerciseFocusProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.015em] text-brasa [font-family:var(--font-heading)]">
          {nome}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {grupo && (
            <span className="rounded-full bg-aco-claro px-2.5 py-1 ds-body-sm font-medium text-foreground first-letter:uppercase">
              {grupo}
            </span>
          )}
          {prescricao && (
            <span className="ds-data-md text-aco-texto">
              {prescricao.series ?? '—'}×{prescricao.reps ?? '—'} · pausa {prescricao.pausaSeg ?? '—'}s
            </span>
          )}
        </div>
      </div>

      {youtubeId ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)]">
          <YoutubeEmbed videoId={youtubeId} title={nome} />
        </div>
      ) : (
        <div className="flex justify-center rounded-[var(--radius-lg)] bg-aco py-4">
          <BodyMap size="md" musculosAtivos={grupo ? [grupo] : []} />
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="ds-body-sm text-aco-texto">Última sessão</span>
          <span className="text-[20px] font-bold text-foreground [font-family:var(--font-data)]">
            {ultima ? `${kg(ultima.cargaKg)} kg × ${ultima.reps ?? '—'}` : 'primeira vez'}
          </span>
        </div>
        {sugestao && sugestao.cargaKg != null && (
          <span
            title={sugestao.texto}
            className={cn(
              'rounded-full px-3 py-1.5 ds-body-sm font-semibold',
              sugestao.tipo === 'sobe' ? 'bg-brasa text-meia-noite' : 'bg-aco-claro text-foreground',
            )}
          >
            {sugestao.tipo === 'sobe' ? `💪 Tente ${kg(sugestao.cargaKg)} kg` : `↺ Repita ${kg(sugestao.cargaKg)} kg`}
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
        className="ds-pressable-card flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] border border-ok/30 bg-ok/10 px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="ds-data-md w-6 text-aco-texto">{serieNum}</span>
        <span className="flex-1 text-[18px] font-bold text-foreground [font-family:var(--font-data)]">
          {carga || '—'} <span className="ds-data-md text-aco-texto">kg</span> × {reps || '—'}
          {rpe && <span className="ds-data-md text-aco-texto"> · RPE {rpe}</span>}
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-ok text-meia-noite ds-celebrate">
          <Check className="size-5" strokeWidth={3} aria-hidden="true" />
        </span>
      </button>
    )
  }

  const inputCls =
    'h-12 w-full min-w-0 rounded-[var(--radius-sm)] border border-linha bg-meia-noite px-2 text-center text-[20px] font-bold text-foreground [font-family:var(--font-data)] outline-none focus:border-brasa focus:shadow-[0_0_0_3px_rgba(240,169,59,0.2)]'

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-linha bg-aco p-3">
      <div className="flex items-center gap-2">
        <span className="ds-data-md w-6 shrink-0 text-aco-texto">{serieNum}</span>
        <label className="flex min-w-0 flex-1 flex-col gap-0.5">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={carga}
            onChange={(e) => onChange('carga', e.target.value)}
            aria-label={`Carga da série ${serieNum} em kg`}
            className={inputCls}
          />
          <span className="ds-data-sm text-center text-aco-texto">kg</span>
        </label>
        <span className="pb-4 ds-data-lg text-aco-texto" aria-hidden="true">
          ×
        </span>
        <label className="flex min-w-0 flex-1 flex-col gap-0.5">
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => onChange('reps', e.target.value)}
            aria-label={`Repetições da série ${serieNum}`}
            className={inputCls}
          />
          <span className="ds-data-sm text-center text-aco-texto">reps</span>
        </label>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving}
          aria-label={`Concluir série ${serieNum}`}
          className="ds-pressable mb-4 flex size-12 shrink-0 items-center justify-center rounded-full bg-brasa text-meia-noite outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Check className="size-6" strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMaisAberto((v) => !v)}
        aria-expanded={maisAberto}
        className="flex min-h-11 items-center gap-1.5 self-start pr-2 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
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

/** Cronômetro de pausa fixo no rodapé: âmbar contando, verde ao zerar. */
export function RestTimerView({ remainingSeconds, targetSeconds, onFinish, position = 'fixed' }: RestTimerViewProps) {
  const zerou = remainingSeconds <= 0
  const pct = targetSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / targetSeconds) * 100)) : 0

  return (
    <div
      role="timer"
      aria-live={zerou ? 'assertive' : 'off'}
      className={cn(
        position,
        'inset-x-0 bottom-0 z-40 flex flex-col border-t border-linha backdrop-blur-md ds-safe-bottom',
      )}
      style={{ backgroundColor: 'rgba(27,42,66,0.92)' }}
    >
      <div className="h-1 w-full bg-aco">
        <div
          className={cn('h-full', zerou ? 'bg-ok' : 'bg-atencao')}
          style={{ width: `${pct}%`, transition: 'width 1s linear' }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <div className="flex flex-col">
          <span className={cn('ds-label', zerou ? 'text-ok' : 'text-atencao')}>{zerou ? 'Pode começar!' : 'Pausa'}</span>
          <span
            className={cn(
              'text-[56px] font-bold leading-none tracking-[-0.02em] tabular-nums [font-family:var(--font-display)]',
              zerou ? 'text-ok' : 'text-atencao',
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
            zerou ? 'bg-ok text-meia-noite' : 'border border-nevoa/25 bg-meia-noite/60 text-foreground',
          )}
        >
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
          <div key={s.label} className="flex flex-col rounded-[var(--radius-md)] bg-aco-claro px-3 py-3">
            <span className="ds-label">{s.label}</span>
            <span className="text-[22px] font-bold text-foreground [font-family:var(--font-display)] tabular-nums">{s.valor}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ds-pressable flex min-h-12 w-full items-center justify-center rounded-full bg-brasa ds-body-md font-semibold text-meia-noite outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Fechar
      </button>
    </div>
  )
}

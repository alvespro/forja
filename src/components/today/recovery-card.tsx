import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Moon } from 'lucide-react'

import { useHeartZones } from '@/hooks/use-heart-zones'
import { useRecoveryGate } from '@/hooks/use-recovery-gate'
import { useRecoveryScores, useSleepLogs, useTrainingVolumeOn, useUpsertSleepLog } from '@/hooks/use-sleep-logs'
import { useHealthCalc } from '@/hooks/useHealthCalc'
import { todayInSaoPaulo } from '@/lib/date'
import { FC_REPOUSO_BASE } from '@/lib/health-calc'
import { formatHoras, horasDormidas, noiteAnterior } from '@/lib/sleep'
import { cn } from '@/lib/utils'

const DISPOSICAO = [
  { valor: 1, emoji: '😩', label: 'Péssimo' },
  { valor: 2, emoji: '😔', label: 'Ruim' },
  { valor: 3, emoji: '😐', label: 'Ok' },
  { valor: 4, emoji: '😊', label: 'Bom' },
  { valor: 5, emoji: '💪', label: 'Ótimo' },
]

const SONO_PADRAO = 7
const DEBOUNCE_MS = 500

function tomDoScore(score: number) {
  if (score >= 80) return { cor: 'text-ok', borda: 'border-ok/40' }
  if (score >= 60) return { cor: 'text-atencao', borda: 'border-atencao/40' }
  if (score >= 40) return { cor: 'text-brasa-quente', borda: 'border-brasa-quente/40' }
  return { cor: 'text-alerta-texto', borda: 'border-alerta/40' }
}

/**
 * Disposição do dia (1–5) + sono da noite anterior → score de recuperação
 * (health-calc). Mover qualquer slider recalcula após 500 ms.
 *
 * Com o score de hoje já calculado, o número vive no tile "Recovery" da grade
 * (SECTION 5) e este card some — volta ao tocar no tile (?recuperacao=editar)
 * ou fica só com o ajuste sugerido quando a recuperação está abaixo de 60.
 */
export function RecoveryCard() {
  const [params, setParams] = useSearchParams()
  const editando = params.get('recuperacao') === 'editar'
  const cardRef = useRef<HTMLElement>(null)
  const hoje = todayInSaoPaulo()
  const noite = noiteAnterior(hoje)
  const sono = useSleepLogs(14)
  const scores = useRecoveryScores(14)
  const volumeOntem = useTrainingVolumeOn(noite)
  const { zones } = useHeartZones()
  const upsertSleep = useUpsertSleepLog()
  const { calcRecoveryScore } = useHealthCalc()
  const { gate } = useRecoveryGate()

  const registroSono = sono.data?.find((l) => l.data === noite) ?? null
  const scoreHoje = scores.data?.find((s) => s.data === hoje) ?? null

  const [disposicao, setDisposicao] = useState<number | null>(null)
  const [horas, setHoras] = useState<number | null>(null)
  const [editandoSono, setEditandoSono] = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const pendente = useRef<{ disposicao: boolean; sono: boolean }>({ disposicao: false, sono: false })

  const horasSalvas = registroSono ? horasDormidas(registroSono) : null
  const disposicaoAtual = disposicao ?? (scoreHoje?.dor_muscular != null ? 6 - scoreHoje.dor_muscular : null)
  const horasAtuais = horas ?? horasSalvas
  const pedirSono = horasSalvas == null || editandoSono

  useEffect(() => {
    const { disposicao: mudouDisposicao, sono: mudouSono } = pendente.current
    if (!mudouDisposicao && !mudouSono) return

    const timer = window.setTimeout(async () => {
      pendente.current = { disposicao: false, sono: false }
      setErro(null)
      try {
        if (mudouSono && horas != null) {
          await upsertSleep.mutateAsync({ data: noite, horas })
          setEditandoSono(false)
        }
        // Só calcula com as duas respostas: sem sono não há score honesto.
        if (disposicaoAtual == null || horasAtuais == null) return
        if (!mudouDisposicao && !scoreHoje) return
        setCalculando(true)
        await calcRecoveryScore({
          data: hoje,
          sleepHours: horasAtuais,
          restingHr: zones.fcRepouso ?? FC_REPOUSO_BASE,
          muscleSoreness: disposicaoAtual,
          trainingLoad: volumeOntem.data ?? null,
        })
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Falha ao calcular a recuperação.')
      } finally {
        setCalculando(false)
      }
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // Dispara só quando o usuário mexe; o resto é lido no momento do cálculo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disposicao, horas])

  function escolherDisposicao(valor: number) {
    pendente.current.disposicao = true
    setDisposicao(valor)
  }

  function escolherHoras(valor: number) {
    pendente.current.sono = true
    setHoras(valor)
  }

  const score = scoreHoje?.score ?? null
  const [emoji, ...resto] = (scoreHoje?.classificacao ?? '').split(' ')
  const tom = score != null ? tomDoScore(score) : null
  const opcao = DISPOSICAO.find((d) => d.valor === disposicaoAtual)

  // Aberto pelo tile da grade: traz o card para a vista.
  useEffect(() => {
    if (editando) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [editando])

  function fecharEdicao() {
    setParams(
      (p) => {
        p.delete('recuperacao')
        return p
      },
      { replace: true },
    )
  }

  if (sono.isLoading || scores.isLoading) return null

  const sugestao = score != null && score < 60 && !gate && scoreHoje?.recomendacao ? scoreHoje.recomendacao : null

  if (scoreHoje && !editando && !calculando) {
    if (!sugestao) return null
    return (
      <section className="flex flex-col gap-1.5 rounded-[var(--r-md)] border-l-[3px] border-brasa bg-aco p-4" aria-label="Ajuste sugerido para o treino">
        <span className="ds-label text-brasa">Ajuste sugerido · recuperação {score}%</span>
        <p className="ds-body-md text-nevoa">{sugestao}</p>
        <Link
          to="/workout"
          className="flex min-h-11 items-center gap-1 self-start ds-body-sm font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver treino
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </section>
    )
  }

  return (
    <section
      ref={cardRef}
      className="flex scroll-mt-20 flex-col gap-4 rounded-[var(--r-md)] border border-linha bg-aco p-4"
      aria-labelledby="recovery-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="ds-label">Recovery</span>
          <h2 id="recovery-title" className="ds-h4 text-nevoa">
            Como está seu corpo hoje?
          </h2>
          <p className="ds-body-sm text-cinza">Dor muscular / disposição</p>
        </div>
        {editando && (
          <button
            type="button"
            onClick={fecharEdicao}
            className="min-h-11 shrink-0 rounded-full px-3 ds-body-sm font-semibold text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
          >
            Concluir
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={disposicaoAtual ?? 3}
          onChange={(e) => escolherDisposicao(Number(e.target.value))}
          aria-label="Dor muscular / disposição"
          aria-valuetext={opcao ? `${opcao.valor} — ${opcao.label}` : 'Não informado'}
          className={cn('h-11 w-full accent-brasa', disposicaoAtual == null && 'opacity-60')}
        />
        <div className="grid grid-cols-5">
          {DISPOSICAO.map((d) => (
            <button
              key={d.valor}
              type="button"
              onClick={() => escolherDisposicao(d.valor)}
              aria-pressed={disposicaoAtual === d.valor}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-md)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring',
                disposicaoAtual === d.valor ? 'scale-110 text-foreground' : 'text-aco-texto',
              )}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {d.emoji}
              </span>
              <span className="mt-0.5 text-[11px] leading-none">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {pedirSono ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-linha p-3">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="sono-horas" className="flex items-center gap-1.5 ds-body-md font-semibold text-foreground">
              <Moon className="size-4 text-brasa" aria-hidden="true" />
              Quanto dormiu ontem?
            </label>
            <span className="ds-data-md text-foreground tabular-nums">{formatHoras(horasAtuais ?? SONO_PADRAO)}</span>
          </div>
          <input
            id="sono-horas"
            type="range"
            min={4}
            max={10}
            step={0.5}
            value={horasAtuais ?? SONO_PADRAO}
            onChange={(e) => escolherHoras(Number(e.target.value))}
            aria-valuetext={formatHoras(horasAtuais ?? SONO_PADRAO)}
            className={cn('h-11 w-full accent-brasa', horasAtuais == null && 'opacity-60')}
          />
          <div className="flex items-center justify-between ds-body-sm text-aco-texto">
            <span>4h</span>
            {horasAtuais == null && (
              <button
                type="button"
                onClick={() => escolherHoras(SONO_PADRAO)}
                className="min-h-11 rounded-full px-3 font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Confirmar {formatHoras(SONO_PADRAO)}
              </button>
            )}
            <span>10h</span>
          </div>
        </div>
      ) : null}

      {calculando ? (
        <div className="ds-pulse rounded-[var(--radius-md)] border border-linha p-4 ds-body-sm text-aco-texto">
          Calculando recuperação…
        </div>
      ) : erro ? (
        <p className="ds-body-sm text-alerta-texto">{erro}</p>
      ) : score != null && tom ? (
        <div className={cn('flex flex-col gap-1 rounded-[var(--radius-md)] border p-4', tom.borda)}>
          <p className="ds-h4 text-foreground">
            <span aria-hidden="true">{emoji} </span>
            Recuperação: <span className={cn('[font-family:var(--font-data)]', tom.cor)}>{score}%</span>
          </p>
          <p className="ds-body-md text-foreground">{resto.join(' ')} hoje</p>
          <p className="ds-body-sm text-aco-texto">
            {scoreHoje?.sono_horas != null && (
              <button
                type="button"
                onClick={() => setEditandoSono(true)}
                className="underline-offset-2 hover:underline focus-visible:underline outline-none"
              >
                Sono: {formatHoras(scoreHoje.sono_horas)}
              </button>
            )}
            {scoreHoje?.dor_muscular != null && ` · Dor: ${scoreHoje.dor_muscular}/5`}
          </p>

          {/* Com treino de força em jogo, o card de ação logo abaixo assume a decisão. */}
          {score < 60 && !gate && scoreHoje?.recomendacao && (
            <div className="mt-2 flex flex-col gap-1 border-t border-linha pt-3">
              <span className="ds-label text-atencao">Ajuste sugerido para o treino de hoje</span>
              <p className="ds-body-sm text-foreground">{scoreHoje.recomendacao}</p>
              <Link
                to="/workout"
                className="flex min-h-11 items-center gap-1 self-start ds-body-sm font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ver treino
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <p className="ds-body-sm text-aco-texto">
          {horasAtuais == null ? 'Informe o sono e a disposição para ver sua recuperação.' : 'Escolha sua disposição para ver a recuperação.'}
        </p>
      )}
    </section>
  )
}

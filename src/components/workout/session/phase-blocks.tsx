import { useEffect, useRef } from 'react'

import { CardioTimerView, PhaseTimerView } from '@/components/workout/session/phase-views'
import { ExerciseMedia } from '@/components/workout/exercise-media'
import { useCountdownTimer } from '@/hooks/use-countdown-timer'
import { haptic } from '@/lib/haptics'
import { faseDe } from '@/lib/workout-phases'
import type { Exercise, WorkoutExercise } from '@/types/database'

const TEMPO_PADRAO_SEG = 60
/** Respiro entre zerar e trocar de exercício, para dar tempo de ler "A seguir". */
const ATRASO_AVANCO_MS = 1500

type TimedPhaseBlockProps = {
  exercise: Exercise | undefined
  prescription: WorkoutExercise
  posicao: number
  totalFase: number
  proximoNome: string | null
  onNext: () => void
}

/** Mobilidade/aquecimento: cronômetro que começa sozinho e avança para o próximo exercício ao zerar. */
export function TimedPhaseBlock({ exercise, prescription, posicao, totalFase, proximoNome, onNext }: TimedPhaseBlockProps) {
  const total = prescription.tempo_seg ?? TEMPO_PADRAO_SEG
  const timer = useCountdownTimer(total)
  const avancou = useRef(false)
  const onNextRef = useRef(onNext)
  onNextRef.current = onNext

  // Começa sozinho ao abrir o exercício (o bloco é remontado por key a cada troca).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => timer.start(), [])

  useEffect(() => {
    if (!timer.isComplete || avancou.current) return
    avancou.current = true
    haptic('soft')
    const id = window.setTimeout(() => onNextRef.current(), ATRASO_AVANCO_MS)
    return () => window.clearTimeout(id)
  }, [timer.isComplete])

  return (
    <PhaseTimerView
      fase={faseDe(prescription.fase)}
      nome={exercise?.nome ?? 'Exercício'}
      cues={exercise?.cues}
      observacao={prescription.observacao}
      media={exercise && (exercise.video_url || exercise.gif_url) ? <ExerciseMedia exercise={exercise} className="rounded-none" /> : undefined}
      restanteSeg={Math.ceil(timer.remainingMs / 1000)}
      totalSeg={total}
      rodando={timer.isRunning}
      posicao={posicao}
      totalFase={totalFase}
      proximoNome={proximoNome}
      onToggle={() => (timer.isRunning ? timer.pause() : timer.start())}
      onNext={() => {
        avancou.current = true
        onNext()
      }}
    />
  )
}

type CardioBlockProps = {
  exercise: Exercise | undefined
  prescription: WorkoutExercise
  onFinish: () => void
}

/** Cardio: cronômetro grande, iniciado pelo usuário (escolhe o aparelho antes). */
export function CardioBlock({ exercise, prescription, onFinish }: CardioBlockProps) {
  const total = prescription.tempo_seg ?? 18 * 60
  const timer = useCountdownTimer(total)
  const vibrou = useRef(false)

  useEffect(() => {
    if (timer.isComplete && !vibrou.current) {
      vibrou.current = true
      haptic('double')
    }
  }, [timer.isComplete])

  return (
    <CardioTimerView
      nome={exercise?.nome ?? 'Cardio'}
      observacao={prescription.observacao}
      cues={exercise?.cues}
      restanteSeg={Math.ceil(timer.remainingMs / 1000)}
      totalSeg={total}
      rodando={timer.isRunning}
      iniciado={timer.elapsedMs > 0}
      onToggle={() => (timer.isRunning ? timer.pause() : timer.start())}
      onReset={() => {
        vibrou.current = false
        timer.reset()
      }}
      onFinish={onFinish}
    />
  )
}

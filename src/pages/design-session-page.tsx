import { useEffect, useState } from 'react'

import {
  ExerciseFocus,
  ImmersiveHeader,
  RestTimerView,
  SetRowView,
} from '@/components/workout/session/session-views'
import { useImmersiveMode } from '@/hooks/use-immersive-mode'

type SerieMock = { carga: string; reps: string; rpe: string; cadencia: string; concluida: boolean }

const EXERCICIOS = [
  { nome: 'Supino inclinado com halteres', grupo: 'peito', youtubeId: null, ultima: { cargaKg: 30, reps: 12 }, sugestao: { tipo: 'sobe' as const, cargaKg: 32.5, texto: '' } },
  { nome: 'Crucifixo', grupo: 'peito', youtubeId: null, ultima: { cargaKg: 14, reps: 9 }, sugestao: { tipo: 'mantem' as const, cargaKg: 14, texto: '' } },
  { nome: 'Tríceps corda', grupo: 'tríceps', youtubeId: null, ultima: null, sugestao: null },
]

/**
 * Tela de execução com dados de exemplo — só em dev. Compõe as mesmas Views
 * puras que o SessionRunner usa, sem tocar no banco.
 */
export function DesignSessionPage() {
  useImmersiveMode(true)
  const [idx, setIdx] = useState(0)
  const [elapsed, setElapsed] = useState(1437)
  const [series, setSeries] = useState<SerieMock[]>([
    { carga: '30', reps: '12', rpe: '8', cadencia: '', concluida: true },
    { carga: '30', reps: '11', rpe: '', cadencia: '', concluida: false },
    { carga: '30', reps: '', rpe: '', cadencia: '', concluida: false },
  ])
  const [pausa, setPausa] = useState<{ restante: number; alvo: number } | null>({ restante: 47, alvo: 90 })

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1)
      setPausa((p) => (p ? { ...p, restante: p.restante - 1 } : p))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const ex = EXERCICIOS[idx]

  return (
    <div className="min-h-screen bg-meia-noite">
      <div className={`mx-auto flex max-w-lg flex-col gap-6 px-5 pt-4 ${pausa ? 'pb-40' : 'pb-10'}`}>
        <ImmersiveHeader
          atual={idx + 1}
          total={EXERCICIOS.length}
          elapsedSeconds={elapsed}
          treinoNome="Treino C — Peito e Tríceps"
          onPrev={() => setIdx((i) => Math.max(0, i - 1))}
          onNext={() => setIdx((i) => Math.min(EXERCICIOS.length - 1, i + 1))}
          onFinish={() => {}}
        />

        <ExerciseFocus
          nome={ex.nome}
          grupo={ex.grupo}
          youtubeId={ex.youtubeId}
          prescricao={{ series: 3, reps: '10-12', pausaSeg: 90 }}
          ultima={ex.ultima}
          sugestao={ex.sugestao}
        />

        <section className="flex flex-col gap-2">
          <span className="ds-label">Séries</span>
          {series.map((s, i) => (
            <SetRowView
              key={i}
              serieNum={i + 1}
              {...s}
              onChange={(campo, valor) => setSeries((all) => all.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)))}
              onComplete={() => {
                setSeries((all) => all.map((x, j) => (j === i ? { ...x, concluida: true } : x)))
                setPausa({ restante: 90, alvo: 90 })
              }}
              onEdit={() => setSeries((all) => all.map((x, j) => (j === i ? { ...x, concluida: false } : x)))}
            />
          ))}
        </section>
      </div>

      {pausa && <RestTimerView remainingSeconds={pausa.restante} targetSeconds={pausa.alvo} onFinish={() => setPausa(null)} />}
    </div>
  )
}

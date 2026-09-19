import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useAvaliarFlashcard } from '@/hooks/use-flashcards'
import { useImmersiveMode } from '@/hooks/use-immersive-mode'
import { mensagemDeErro } from '@/lib/feedback'
import { XP_REVISAO, type Avaliacao } from '@/lib/flashcards'
import { cn } from '@/lib/utils'
import type { Flashcard } from '@/types/database'

const BOTOES: { valor: Avaliacao; emoji: string; label: string; cor: string; tecla: string }[] = [
  { valor: 'errei', emoji: '😅', label: 'Errei', cor: '#C10801', tecla: '1' },
  { valor: 'dificil', emoji: '🤔', label: 'Difícil', cor: '#E8A23D', tecla: '2' },
  { valor: 'acertei', emoji: '✅', label: 'Acertei', cor: '#4CAF7D', tecla: '3' },
]

/**
 * Modo revisão em tela cheia (sem navbar): fila fixa dos cards devidos,
 * flip 3D frente → verso e avaliação SM-2 simplificada.
 */
export function RevisaoSessao({ cards, onSair }: { cards: Flashcard[]; onSair: () => void }) {
  useImmersiveMode(true)
  const avaliar = useAvaliarFlashcard()
  const [fila] = useState(cards)
  const [indice, setIndice] = useState(0)
  const [virado, setVirado] = useState(false)
  const [acertos, setAcertos] = useState(0)
  const [feitos, setFeitos] = useState(0)
  const concluida = indice >= fila.length
  const card = fila[indice]

  function responder(valor: Avaliacao) {
    if (!card || !virado || avaliar.isPending) return
    avaliar.mutate(
      { card, avaliacao: valor },
      {
        onSuccess: () => {
          if (valor !== 'errei') setAcertos((n) => n + 1)
          setFeitos((n) => n + 1)
          setVirado(false)
          setIndice((i) => i + 1)
        },
        onError: (e) => toast.error(mensagemDeErro(e, 'salvar a revisão')),
      },
    )
  }

  // Atalhos: espaço/enter vira, 1/2/3 avaliam, Esc sai.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') return onSair()
      if (concluida) return
      if ((e.key === ' ' || e.key === 'Enter') && !virado) {
        e.preventDefault()
        setVirado(true)
        return
      }
      const botao = BOTOES.find((b) => b.tecla === e.key)
      if (botao) responder(botao.valor)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div role="dialog" aria-modal="true" aria-label="Revisão de flashcards" className="fixed inset-0 z-[60] flex flex-col bg-[#0B0B0B] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onSair} aria-label="Sair da revisão" className="size-11">
          <Icon name="close" size={22} />
        </Button>
        {!concluida && (
          <span className="text-sm font-medium text-cinza tabular-nums" aria-live="polite">
            Card {indice + 1} de {fila.length}
          </span>
        )}
        <span className="size-11" aria-hidden="true" />
      </header>
      {!concluida && (
        <div className="mx-auto mt-2 h-1 w-full max-w-xl overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full bg-brasa transition-[width] duration-300" style={{ width: `${(indice / fila.length) * 100}%` }} />
        </div>
      )}

      {concluida ? (
        <Resultado acertos={acertos} total={feitos} onSair={onSair} />
      ) : (
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 py-6">
          <button
            type="button"
            onClick={() => setVirado((v) => !v)}
            aria-label={virado ? 'Ver a pergunta' : 'Virar e ver a resposta'}
            className="flashcard-cena h-[min(56vh,420px)] w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-brasa rounded-[var(--r-xl)]"
          >
            <div className={cn('flashcard-interno', virado && 'flashcard-virado')}>
              <div className="flashcard-face border-brasa/35" aria-hidden={virado}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brasa">Pergunta</span>
                <p className="font-heading text-[22px] font-semibold leading-snug text-nevoa text-center whitespace-pre-wrap">{card.frente}</p>
                <span className="text-xs text-cinza">Toque para virar</span>
              </div>
              <div className="flashcard-face flashcard-verso border-[#4CAF7D]/40" aria-hidden={!virado}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4CAF7D]">Resposta</span>
                <p className="text-[18px] leading-relaxed text-nevoa text-center whitespace-pre-wrap">{card.verso}</p>
                <span className="flex items-center gap-1 text-xs text-cinza">
                  {card.fonte ? (
                    <>
                      <Icon name={card.fonte_tipo === 'curso' ? 'school' : card.fonte_tipo === 'livro' ? 'menu_book' : 'description'} size={14} />
                      {card.fonte}
                    </>
                  ) : (
                    ' '
                  )}
                </span>
              </div>
            </div>
          </button>

          <div className={cn('grid grid-cols-3 gap-2 transition-opacity', virado ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={!virado}>
            {BOTOES.map((b) => (
              <button
                key={b.valor}
                type="button"
                tabIndex={virado ? 0 : -1}
                disabled={avaliar.isPending}
                onClick={() => responder(b.valor)}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[var(--r-md)] text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: b.cor }}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {b.emoji}
                </span>
                {b.label}
              </button>
            ))}
          </div>
        </main>
      )}
    </div>
  )
}

function Resultado({ acertos, total, onSair }: { acertos: number; total: number; onSair: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl" aria-hidden="true">
        🎉
      </span>
      <h2 className="font-heading text-2xl font-bold text-nevoa">Sessão concluída!</h2>
      <p className="text-base text-cinza">
        {acertos} {acertos === 1 ? 'acerto' : 'acertos'} de {total} {total === 1 ? 'card' : 'cards'}
      </p>
      <p className="text-[40px] font-bold leading-none text-brasa tabular-nums [font-family:var(--font-display)]">+{XP_REVISAO} XP</p>
      <Button type="button" className="mt-4 min-h-11 min-w-40" onClick={onSair}>
        Concluir
      </Button>
    </main>
  )
}

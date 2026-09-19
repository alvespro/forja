import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/use-confirm'
import { useExcluirFlashcard, useFlashcardsDaFonte } from '@/hooks/use-flashcards'
import { mensagemDeErro } from '@/lib/feedback'
import type { Flashcard, FlashcardFonteTipo } from '@/types/database'

import { FlashcardModal } from './flashcard-modal'
import { GerarFlashcardsModal } from './gerar-flashcards-modal'

type Props = {
  tipo: FlashcardFonteTipo
  fonteId: string
  titulo: string
  /** Conteúdo enviado à IA; vazio desabilita o botão de gerar. */
  textoParaIA: string
}

/**
 * Seção "Flashcards" de uma origem (livro, curso, anotação): lista os cards
 * dela, cria manualmente já associado e gera com IA (com preview).
 */
export function FlashcardsDaFonte({ tipo, fonteId, titulo, textoParaIA }: Props) {
  const cards = useFlashcardsDaFonte(tipo, fonteId)
  const excluir = useExcluirFlashcard()
  const { confirm, dialog } = useConfirm()
  const [modal, setModal] = useState<{ card?: Flashcard } | null>(null)
  const [gerando, setGerando] = useState(false)

  async function handleExcluir(c: Flashcard) {
    const ok = await confirm({ title: 'Excluir este flashcard?', description: `"${c.frente.slice(0, 80)}"` })
    if (!ok) return
    excluir.mutate(c.id, {
      onSuccess: () => toast.success('Flashcard excluído.'),
      onError: (e) => toast.error(mensagemDeErro(e, 'excluir o flashcard')),
    })
  }

  const lista = cards.data ?? []

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon name="style" size={18} className="text-brasa" />
          <h2 className="text-sm font-semibold text-foreground">Flashcards</h2>
          <span className="text-xs text-cinza">{lista.length}</span>
        </div>

        {cards.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : lista.length === 0 ? (
          <p className="text-sm text-cinza">Nenhum flashcard desta fonte ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lista.map((c) => (
              <li key={c.id} className="flex items-start gap-1 rounded-[var(--r-md)] border border-linha bg-[#1D1D1D] py-2 pl-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-nevoa">{c.frente}</p>
                  <p className="text-xs text-cinza">{c.verso}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="size-11" aria-label="Editar flashcard" onClick={() => setModal({ card: c })}>
                  <Icon name="edit" size={16} />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-11 text-cinza hover:text-alerta-texto" aria-label="Excluir flashcard" onClick={() => void handleExcluir(c)}>
                  <Icon name="delete" size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setModal({})}>
            <Icon name="add" size={18} />
            Criar flashcard
          </Button>
          <Button type="button" variant="outline" className="min-h-11" disabled={!textoParaIA.trim()} onClick={() => setGerando(true)}>
            🤖 Gerar flashcards com IA
          </Button>
        </div>
        {!textoParaIA.trim() && <p className="text-xs text-cinza">Preencha o conteúdo (ou o review 3-2-1) para gerar com IA.</p>}
      </CardContent>

      <FlashcardModal
        open={modal !== null}
        card={modal?.card}
        inicial={{ fonte: { tipo, id: fonteId, nome: titulo } }}
        onClose={() => setModal(null)}
      />
      <GerarFlashcardsModal open={gerando} onClose={() => setGerando(false)} titulo={titulo} texto={textoParaIA} fonte={{ tipo, id: fonteId }} />
      {dialog}
    </Card>
  )
}

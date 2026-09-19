import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useCriarFlashcards, useFlashcardDecks } from '@/hooks/use-flashcards'
import { useForjaAI } from '@/hooks/useForjaAI'
import { mensagemDeErro } from '@/lib/feedback'
import { flashcardsDaResposta, promptGerarFlashcards, type FlashcardGerado } from '@/lib/flashcards'
import type { FlashcardFonteTipo } from '@/types/database'

type Props = {
  open: boolean
  onClose: () => void
  /** Título da origem (livro, curso, anotação) — vira a `fonte` dos cards. */
  titulo: string
  /** Texto que a IA analisa (anotação ou review 3-2-1). */
  texto: string
  fonte: { tipo: FlashcardFonteTipo; id: string | null }
}

/**
 * "🤖 Gerar flashcards": a IA (agente estudos) propõe 3-5 cards, o usuário
 * revisa/desmarca no preview e só então salva.
 */
export function GerarFlashcardsModal({ open, onClose, titulo, texto, fonte }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Gerar flashcards com IA" description={titulo} maxWidth="lg">
      {open && <Conteudo titulo={titulo} texto={texto} fonte={fonte} onClose={onClose} />}
    </Modal>
  )
}

type Item = FlashcardGerado & { incluir: boolean }

function Conteudo({ titulo, texto, fonte, onClose }: Omit<Props, 'open'>) {
  const ia = useForjaAI()
  const decks = useFlashcardDecks()
  const criar = useCriarFlashcards()
  const [itens, setItens] = useState<Item[] | null>(null)
  const [deckId, setDeckId] = useState('')

  function gerar() {
    setItens(null)
    ia.mutate(
      { agente: 'estudos', pergunta: promptGerarFlashcards(titulo, texto, titulo) },
      { onSuccess: (resposta) => setItens(flashcardsDaResposta(resposta).map((f) => ({ ...f, incluir: true }))) },
    )
  }

  // Gera ao abrir.
  useEffect(gerar, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selecionados = (itens ?? []).filter((i) => i.incluir)

  function salvar() {
    criar.mutate(
      selecionados.map((i) => ({
        frente: i.frente,
        verso: i.verso,
        fonte: titulo,
        fonte_id: fonte.id,
        fonte_tipo: fonte.tipo,
        deck_id: deckId || null,
      })),
      {
        onSuccess: () => {
          toast.success(`${selecionados.length} ${selecionados.length === 1 ? 'flashcard criado' : 'flashcards criados'}.`)
          onClose()
        },
        onError: (e) => toast.error(mensagemDeErro(e, 'salvar os flashcards')),
      },
    )
  }

  function editar(i: number, campo: 'frente' | 'verso', valor: string) {
    setItens((lista) => lista && lista.map((it, j) => (j === i ? { ...it, [campo]: valor } : it)))
  }

  if (ia.isPending) {
    return (
      <p role="status" className="flex items-center gap-2 py-8 text-sm text-cinza">
        <Icon name="progress_activity" size={18} className="animate-spin text-brasa" />
        A IA está lendo o conteúdo e montando os cards…
      </p>
    )
  }

  if (ia.isError || (itens && itens.length === 0)) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <p className="text-sm text-alerta-texto">
          {ia.isError ? (ia.error instanceof Error ? ia.error.message : 'A IA não respondeu.') : 'A IA não devolveu cards válidos.'}
        </p>
        <Button type="button" variant="outline" className="min-h-11 self-start" onClick={gerar}>
          <Icon name="refresh" size={18} />
          Tentar de novo
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-cinza">Revise antes de salvar: edite o texto ou desmarque o que não quiser.</p>
      <ul className="flex flex-col gap-3">
        {(itens ?? []).map((it, i) => (
          <li key={i} className="flex gap-3 rounded-[var(--r-md)] border border-linha bg-[#1D1D1D] p-3">
            <input
              type="checkbox"
              checked={it.incluir}
              onChange={(e) => setItens((l) => l && l.map((x, j) => (j === i ? { ...x, incluir: e.target.checked } : x)))}
              aria-label={`Incluir card ${i + 1}`}
              className="mt-1 size-5 shrink-0 accent-[var(--brasa)]"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <textarea
                value={it.frente}
                rows={2}
                aria-label={`Frente do card ${i + 1}`}
                onChange={(e) => editar(i, 'frente', e.target.value)}
                className="w-full resize-y rounded-[var(--r-sm)] border border-brasa/30 bg-transparent px-2 py-1.5 text-sm font-semibold text-nevoa outline-none focus-visible:border-brasa"
              />
              <textarea
                value={it.verso}
                rows={2}
                aria-label={`Verso do card ${i + 1}`}
                onChange={(e) => editar(i, 'verso', e.target.value)}
                className="w-full resize-y rounded-[var(--r-sm)] border border-[#4CAF7D]/30 bg-transparent px-2 py-1.5 text-sm text-cinza outline-none focus-visible:border-[#4CAF7D]"
              />
            </div>
          </li>
        ))}
      </ul>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-nevoa">
        Deck
        <Select value={deckId} onChange={(e) => setDeckId(e.target.value)}>
          <option value="">Sem deck</option>
          {(decks.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </Select>
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={gerar} disabled={criar.isPending}>
          <Icon name="refresh" size={18} />
          Gerar de novo
        </Button>
        <Button type="button" className="min-h-11" onClick={salvar} disabled={criar.isPending || selecionados.length === 0}>
          {criar.isPending ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="check" size={18} />}
          Salvar {selecionados.length} {selecionados.length === 1 ? 'card' : 'cards'}
        </Button>
      </div>
    </div>
  )
}

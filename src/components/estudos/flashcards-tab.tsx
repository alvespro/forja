import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/use-confirm'
import { useArquivarDeck, useExcluirFlashcard, useFlashcardDecks, useFlashcards } from '@/hooks/use-flashcards'
import { todayInSaoPaulo } from '@/lib/date'
import { mensagemDeErro } from '@/lib/feedback'
import { estaDevido } from '@/lib/flashcards'
import type { Flashcard, FlashcardDeck } from '@/types/database'

import { DeckModal } from './deck-modal'
import { FlashcardModal } from './flashcard-modal'
import { RevisaoSessao } from './revisao-sessao'

const SEM_DECK = '__sem_deck__'

export function FlashcardsTab({ revisaoInicial, onRevisaoFechada }: { revisaoInicial: boolean; onRevisaoFechada: () => void }) {
  const decks = useFlashcardDecks()
  const cards = useFlashcards()
  const excluirCard = useExcluirFlashcard()
  const arquivarDeck = useArquivarDeck()
  const { confirm, dialog } = useConfirm()
  const hoje = todayInSaoPaulo()

  const [revisao, setRevisao] = useState<Flashcard[] | null>(null)
  const [deckModal, setDeckModal] = useState<FlashcardDeck | 'novo' | null>(null)
  const [cardModal, setCardModal] = useState<{ card?: Flashcard; deckId?: string | null } | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [pedidoInicial, setPedidoInicial] = useState(revisaoInicial)

  const devidos = useMemo(() => (cards.data ?? []).filter((c) => estaDevido(c.proxima_revisao, hoje)), [cards.data, hoje])

  const porDeck = useMemo(() => {
    const m = new Map<string, Flashcard[]>()
    for (const c of cards.data ?? []) {
      const k = c.deck_id && (decks.data ?? []).some((d) => d.id === c.deck_id) ? c.deck_id : SEM_DECK
      m.set(k, [...(m.get(k) ?? []), c])
    }
    return m
  }, [cards.data, decks.data])

  // ?modo=revisao abre a sessão assim que os cards carregam.
  if (pedidoInicial && cards.data) {
    setPedidoInicial(false)
    if (devidos.length > 0) setRevisao(devidos)
    else onRevisaoFechada()
  }

  function iniciar(lista: Flashcard[]) {
    if (lista.length === 0) return
    setRevisao(lista)
  }

  function sairRevisao() {
    setRevisao(null)
    onRevisaoFechada()
    void cards.refetch()
  }

  async function excluir(card: Flashcard) {
    const ok = await confirm({ title: 'Excluir este flashcard?', description: `"${card.frente.slice(0, 80)}" e o histórico de revisão dele somem.` })
    if (!ok) return
    excluirCard.mutate(card.id, {
      onSuccess: () => toast.success('Flashcard excluído.'),
      onError: (e) => toast.error(mensagemDeErro(e, 'excluir o flashcard')),
    })
  }

  async function arquivar(deck: FlashcardDeck) {
    const ok = await confirm({
      title: `Arquivar o deck ${deck.nome}?`,
      description: 'O deck sai da lista. Os cards dele continuam existindo, em "Sem deck".',
      confirmLabel: 'Arquivar',
    })
    if (!ok) return
    arquivarDeck.mutate(deck.id, {
      onSuccess: () => toast.success(`Deck ${deck.nome} arquivado.`),
      onError: (e) => toast.error(mensagemDeErro(e, 'arquivar o deck')),
    })
  }

  if (cards.isLoading || decks.isLoading) return <Skeleton className="h-48 w-full" />
  if (cards.isError || decks.isError)
    return <ErrorState message="Não foi possível carregar os flashcards." onRetry={() => (cards.refetch(), decks.refetch())} />

  const listaDecks: { id: string; nome: string; cor: string; deck?: FlashcardDeck }[] = [
    ...(decks.data ?? []).map((d) => ({ id: d.id, nome: d.nome, cor: d.cor ?? '#FC4C13', deck: d })),
    ...(porDeck.has(SEM_DECK) ? [{ id: SEM_DECK, nome: 'Sem deck', cor: '#6B7280' }] : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Revisão do dia */}
      <section aria-labelledby="revisao-titulo" className="flex flex-col gap-3 rounded-[var(--r-xl)] border border-brasa/30 bg-brasa/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="revisao-titulo" className="font-heading text-lg font-semibold text-nevoa">
            Revisão do dia
          </h2>
          {devidos.length > 0 ? (
            <span className="rounded-full bg-[#C10801] px-2.5 py-0.5 text-xs font-bold text-white">{devidos.length} para revisar hoje</span>
          ) : (
            <span className="text-xs text-ok">Tudo revisado ✓</span>
          )}
        </div>
        <Button type="button" className="min-h-12 text-base" disabled={devidos.length === 0} onClick={() => iniciar(devidos)}>
          <Icon name="play_arrow" size={20} />
          Iniciar revisão
        </Button>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold text-nevoa">Decks</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setCardModal({})}>
            <Icon name="add" size={18} />
            Card
          </Button>
          <Button type="button" size="sm" className="min-h-11" onClick={() => setDeckModal('novo')}>
            <Icon name="add" size={18} />
            Novo deck
          </Button>
        </div>
      </div>

      {listaDecks.length === 0 ? (
        <EmptyState message="Nenhum deck ainda. Crie um deck e adicione seus primeiros cards." />
      ) : (
        <ul className="flex flex-col gap-3">
          {listaDecks.map((d) => {
            const lista = porDeck.get(d.id) ?? []
            const devidosDeck = lista.filter((c) => estaDevido(c.proxima_revisao, hoje))
            const expandido = aberto === d.id
            return (
              <li key={d.id} className="overflow-hidden rounded-[var(--r-lg)] border border-linha bg-[#1D1D1D]" style={{ borderLeft: `4px solid ${d.cor}` }}>
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    className="flex min-h-11 min-w-0 flex-1 flex-col items-start text-left"
                    aria-expanded={expandido}
                    onClick={() => setAberto(expandido ? null : d.id)}
                  >
                    <span className="truncate font-semibold text-nevoa">{d.nome}</span>
                    <span className="text-xs text-cinza">
                      {lista.length} {lista.length === 1 ? 'card' : 'cards'} · {devidosDeck.length} para revisar hoje
                    </span>
                  </button>
                  {devidosDeck.length > 0 && (
                    <Button type="button" variant="ghost" size="icon" className="size-11 text-brasa" aria-label={`Revisar ${d.nome}`} onClick={() => iniciar(devidosDeck)}>
                      <Icon name="play_arrow" size={20} />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    aria-label={`Adicionar card em ${d.nome}`}
                    onClick={() => setCardModal({ deckId: d.deck ? d.id : null })}
                  >
                    <Icon name="add" size={16} />
                    Card
                  </Button>
                  {d.deck && (
                    <>
                      <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={`Editar deck ${d.nome}`} onClick={() => setDeckModal(d.deck!)}>
                        <Icon name="edit" size={18} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-11 text-cinza" aria-label={`Arquivar deck ${d.nome}`} onClick={() => void arquivar(d.deck!)}>
                        <Icon name="archive" size={18} />
                      </Button>
                    </>
                  )}
                </div>
                {expandido && (
                  <ul className="flex flex-col divide-y divide-linha border-t border-linha">
                    {lista.length === 0 && <li className="p-3 text-sm text-cinza">Nenhum card neste deck.</li>}
                    {lista.map((c) => (
                      <li key={c.id} className="flex items-start gap-2 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-nevoa">{c.frente}</p>
                          <p className="line-clamp-1 text-xs text-cinza">{c.verso}</p>
                          <p className="mt-0.5 text-[11px] text-cinza/80 tabular-nums">
                            {estaDevido(c.proxima_revisao, hoje) ? 'Revisar hoje' : `Próxima: ${c.proxima_revisao?.split('-').reverse().join('/')}`} · ✅ {c.acertos} · 😅 {c.erros}
                          </p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="size-11" aria-label="Editar card" onClick={() => setCardModal({ card: c })}>
                          <Icon name="edit" size={16} />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-11 text-cinza hover:text-alerta-texto" aria-label="Excluir card" onClick={() => void excluir(c)}>
                          <Icon name="delete" size={16} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <DeckModal open={deckModal !== null} deck={deckModal && deckModal !== 'novo' ? deckModal : undefined} onClose={() => setDeckModal(null)} />
      <FlashcardModal
        open={cardModal !== null}
        card={cardModal?.card}
        inicial={cardModal?.deckId !== undefined ? { deckId: cardModal.deckId } : undefined}
        onClose={() => setCardModal(null)}
      />
      {revisao && <RevisaoSessao cards={revisao} onSair={sairRevisao} />}
      {dialog}
    </div>
  )
}

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCourses } from '@/hooks/use-courses'
import { useAtualizarFlashcard, useCriarFlashcards, useFlashcardDecks } from '@/hooks/use-flashcards'
import { useReadings } from '@/hooks/use-readings'
import { mensagemDeErro } from '@/lib/feedback'
import type { Flashcard, FlashcardFonteTipo } from '@/types/database'

export type FonteFlashcard = { tipo: FlashcardFonteTipo; id: string | null; nome: string }

type Props = {
  open: boolean
  onClose: () => void
  /** Editar um card existente (sem "criar outro"). */
  card?: Flashcard
  /** Valores iniciais de um card novo (ex.: texto selecionado no EPUB, deck do botão "+ Card"). */
  inicial?: { frente?: string; deckId?: string | null; fonte?: FonteFlashcard }
}

/** Criação rápida de flashcard: frente, verso, deck e fonte. */
export function FlashcardModal({ open, onClose, card, inicial }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={card ? 'Editar flashcard' : 'Novo flashcard'}>
      {open && <Formulario card={card} inicial={inicial} onClose={onClose} />}
    </Modal>
  )
}

const chaveFonte = (f: Pick<FonteFlashcard, 'tipo' | 'id'>) => `${f.tipo}:${f.id ?? ''}`

function Formulario({ card, inicial, onClose }: Omit<Props, 'open'>) {
  const decks = useFlashcardDecks()
  const livros = useReadings()
  const cursos = useCourses()
  const criar = useCriarFlashcards()
  const atualizar = useAtualizarFlashcard()
  const frenteRef = useRef<HTMLTextAreaElement>(null)

  // Fixa na abertura do modal (a lista de fontes depende dela).
  const [fonteInicial] = useState<FonteFlashcard | null>(() =>
    card?.fonte_tipo ? { tipo: card.fonte_tipo, id: card.fonte_id, nome: card.fonte ?? '' } : (inicial?.fonte ?? null),
  )

  const [frente, setFrente] = useState(card?.frente ?? inicial?.frente ?? '')
  const [verso, setVerso] = useState(card?.verso ?? '')
  const [deckId, setDeckId] = useState(card?.deck_id ?? inicial?.deckId ?? '')
  const [fonteKey, setFonteKey] = useState(fonteInicial ? chaveFonte(fonteInicial) : '')
  const [erros, setErros] = useState<{ frente?: string; verso?: string }>({})
  const [criados, setCriados] = useState(0)

  // Opções de fonte: livros e cursos + a fonte pré-definida (ex.: anotação) se não for um deles.
  const fontes = useMemo(() => {
    const lista: FonteFlashcard[] = [
      ...(livros.data ?? []).map((r) => ({ tipo: 'livro' as const, id: r.id, nome: r.titulo })),
      ...(cursos.data ?? []).map((c) => ({ tipo: 'curso' as const, id: c.id, nome: c.titulo })),
    ]
    if (fonteInicial && !lista.some((f) => chaveFonte(f) === chaveFonte(fonteInicial))) lista.unshift(fonteInicial)
    return lista
  }, [livros.data, cursos.data, fonteInicial])

  const salvando = criar.isPending || atualizar.isPending

  function salvar(criarOutro: boolean) {
    const novos = {
      frente: frente.trim() ? undefined : 'Escreva a pergunta.',
      verso: verso.trim() ? undefined : 'Escreva a resposta.',
    }
    setErros(novos)
    if (novos.frente || novos.verso) return

    const fonte = fontes.find((f) => chaveFonte(f) === fonteKey)
    const values = {
      frente: frente.trim(),
      verso: verso.trim(),
      deck_id: deckId || null,
      fonte: fonte?.nome ?? null,
      fonte_id: fonte?.id ?? null,
      fonte_tipo: fonte?.tipo ?? 'manual',
    }
    const onError = (e: unknown) => toast.error(mensagemDeErro(e, 'salvar o flashcard'))

    if (card) {
      atualizar.mutate(
        { id: card.id, values },
        { onSuccess: () => (toast.success('Flashcard atualizado.'), onClose()), onError },
      )
      return
    }
    criar.mutate([values], {
      onSuccess: () => {
        if (!criarOutro) {
          toast.success('Flashcard criado.')
          onClose()
          return
        }
        setCriados((n) => n + 1)
        setFrente('')
        setVerso('')
        frenteRef.current?.focus()
      },
      onError,
    })
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        salvar(false)
      }}
    >
      {criados > 0 && (
        <p role="status" className="flex items-center gap-1.5 text-[13px] text-ok">
          <Icon name="check_circle" size={16} />
          {criados === 1 ? '1 card criado' : `${criados} cards criados`} — continue no próximo.
        </p>
      )}
      <FormField label="Frente (pergunta)" htmlFor="fc-frente" erro={erros.frente}>
        <Textarea
          ref={frenteRef}
          rows={3}
          autoFocus
          value={frente}
          onChange={(e) => (setFrente(e.target.value), setErros((x) => ({ ...x, frente: undefined })))}
          {...propsDeErro('fc-frente', erros.frente)}
        />
      </FormField>
      <FormField label="Verso (resposta)" htmlFor="fc-verso" erro={erros.verso}>
        <Textarea
          rows={3}
          value={verso}
          onChange={(e) => (setVerso(e.target.value), setErros((x) => ({ ...x, verso: undefined })))}
          {...propsDeErro('fc-verso', erros.verso)}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Deck" htmlFor="fc-deck">
          <Select id="fc-deck" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
            <option value="">Sem deck</option>
            {(decks.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Fonte" htmlFor="fc-fonte">
          <Select id="fc-fonte" value={fonteKey} onChange={(e) => setFonteKey(e.target.value)}>
            <option value="">Nenhuma (manual)</option>
            {fontes.map((f) => (
              <option key={chaveFonte(f)} value={chaveFonte(f)}>
                {f.tipo === 'livro' ? '📖' : f.tipo === 'curso' ? '🎓' : '📝'} {f.nome}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        {!card && (
          <Button type="button" variant="outline" className="min-h-11" onClick={() => salvar(true)} disabled={salvando}>
            <Icon name="add" size={18} />
            Salvar e criar outro
          </Button>
        )}
        <Button type="submit" className="min-h-11" disabled={salvando}>
          {salvando ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="check" size={18} />}
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

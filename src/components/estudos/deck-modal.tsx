import { useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useAtualizarDeck, useCriarDeck } from '@/hooks/use-flashcards'
import { mensagemDeErro } from '@/lib/feedback'
import { cn } from '@/lib/utils'
import type { FlashcardDeck } from '@/types/database'

const CORES = ['#FC4C13', '#E8A23D', '#4CAF7D', '#3B82F6', '#A855F7', '#EC4899', '#94A3B8']
const CATEGORIAS = [
  { value: 'livro', label: 'Livro' },
  { value: 'curso', label: 'Curso' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'pessoal', label: 'Pessoal' },
] as const

export function DeckModal({ open, deck, onClose }: { open: boolean; deck?: FlashcardDeck; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={deck ? `Editar ${deck.nome}` : 'Novo deck'} maxWidth="sm">
      {open && <Formulario deck={deck} onClose={onClose} />}
    </Modal>
  )
}

function Formulario({ deck, onClose }: { deck?: FlashcardDeck; onClose: () => void }) {
  const criar = useCriarDeck()
  const atualizar = useAtualizarDeck()
  const [nome, setNome] = useState(deck?.nome ?? '')
  const [categoria, setCategoria] = useState<FlashcardDeck['categoria']>(deck?.categoria ?? 'pessoal')
  const [cor, setCor] = useState(deck?.cor ?? CORES[0])
  const [erro, setErro] = useState<string | null>(null)
  const salvando = criar.isPending || atualizar.isPending

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setErro('Dê um nome ao deck.')
    const values = { nome: nome.trim(), categoria, cor }
    const opcoes = {
      onSuccess: () => (toast.success(deck ? 'Deck atualizado.' : `Deck ${values.nome} criado.`), onClose()),
      onError: (err: unknown) => toast.error(mensagemDeErro(err, 'salvar o deck')),
    }
    if (deck) atualizar.mutate({ id: deck.id, values }, opcoes)
    else criar.mutate(values, opcoes)
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" htmlFor="deck-nome" erro={erro}>
        <Input autoFocus value={nome} onChange={(e) => (setNome(e.target.value), setErro(null))} {...propsDeErro('deck-nome', erro)} />
      </FormField>
      <FormField label="Categoria" htmlFor="deck-cat">
        <Select id="deck-cat" value={categoria ?? 'pessoal'} onChange={(e) => setCategoria(e.target.value as FlashcardDeck['categoria'])}>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormField>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-nevoa">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              aria-pressed={cor === c}
              onClick={() => setCor(c)}
              className={cn('size-11 rounded-full border-2 transition-transform', cor === c ? 'scale-110 border-white' : 'border-transparent')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={salvando}>
          {salvando && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {salvando ? 'Salvando…' : deck ? 'Salvar' : 'Criar deck'}
        </Button>
      </div>
    </form>
  )
}

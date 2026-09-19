import { lazy, Suspense, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourses } from '@/hooks/use-courses'
import { useReadings } from '@/hooks/use-readings'
import { tagsExistentes, useSalvarNota, useStudyNotes } from '@/hooks/use-study-notes'
import { mensagemDeErro } from '@/lib/feedback'
import type { StudyNote, StudyNoteFonteTipo } from '@/types/database'

import { GerarFlashcardsModal } from './gerar-flashcards-modal'

const MarkdownEditor = lazy(() => import('./markdown'))

export const FONTES_NOTA: { value: StudyNoteFonteTipo; label: string }[] = [
  { value: 'livro', label: 'Livro' },
  { value: 'curso', label: 'Curso' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'aula', label: 'Aula' },
  { value: 'outro', label: 'Outro' },
]

type Props = { open: boolean; nota?: StudyNote; onClose: () => void; onSalva?: (nota: StudyNote) => void }

export function NotaModal({ open, nota, onClose, onSalva }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={nota ? 'Editar anotação' : 'Nova anotação'} maxWidth="lg">
      {open && <Formulario nota={nota} onClose={onClose} onSalva={onSalva} />}
    </Modal>
  )
}

function Formulario({ nota, onClose, onSalva }: Omit<Props, 'open'>) {
  const salvarNota = useSalvarNota()
  const todas = useStudyNotes()
  const livros = useReadings()
  const cursos = useCourses()
  const sugestoesTags = useMemo(() => tagsExistentes(todas.data), [todas.data])

  const [titulo, setTitulo] = useState(nota?.titulo ?? '')
  const [conteudo, setConteudo] = useState(nota?.conteudo ?? '')
  const [tags, setTags] = useState<string[]>(nota?.tags ?? [])
  const [tagTexto, setTagTexto] = useState('')
  const [fonteTipo, setFonteTipo] = useState<StudyNoteFonteTipo | ''>(nota?.fonte_tipo ?? '')
  const [fonteId, setFonteId] = useState(nota?.fonte_id ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const [gerar, setGerar] = useState<StudyNote | null>(null)

  const opcoesFonte =
    fonteTipo === 'livro'
      ? (livros.data ?? []).map((r) => ({ id: r.id, nome: r.titulo }))
      : fonteTipo === 'curso'
        ? (cursos.data ?? []).map((c) => ({ id: c.id, nome: c.titulo }))
        : []

  function adicionarTag(texto: string) {
    const nova = texto.trim().replace(/^#/, '')
    if (!nova) return
    setTags((t) => (t.some((x) => x.toLowerCase() === nova.toLowerCase()) ? t : [...t, nova]))
    setTagTexto('')
  }

  function salvar(depois?: (salva: StudyNote) => void) {
    if (!titulo.trim()) {
      setErro('Dê um título à anotação.')
      return
    }
    const pendente = tagTexto.trim() ? [...tags, tagTexto.trim().replace(/^#/, '')] : tags
    salvarNota.mutate(
      {
        id: nota?.id,
        values: {
          titulo: titulo.trim(),
          conteudo: conteudo.trim() || null,
          tags: pendente.length ? [...new Set(pendente)] : null,
          fonte_tipo: fonteTipo || null,
          fonte_id: (fonteTipo === 'livro' || fonteTipo === 'curso') && fonteId ? fonteId : null,
        },
      },
      {
        onSuccess: (salva) => {
          toast.success(nota ? 'Anotação atualizada.' : 'Anotação criada.')
          onSalva?.(salva)
          if (depois) depois(salva)
          else onClose()
        },
        onError: (e) => toast.error(mensagemDeErro(e, 'salvar a anotação')),
      },
    )
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        salvar()
      }}
    >
      <FormField label="Título" htmlFor="nota-titulo" erro={erro}>
        <Input value={titulo} onChange={(e) => (setTitulo(e.target.value), setErro(null))} {...propsDeErro('nota-titulo', erro)} />
      </FormField>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nota-conteudo" className="text-sm font-medium text-nevoa">
          Conteúdo
        </label>
        <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
          <MarkdownEditor id="nota-conteudo" value={conteudo} onChange={setConteudo} />
        </Suspense>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nota-tags" className="text-sm font-medium text-nevoa">
          Tags
        </label>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags da anotação">
            {tags.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setTags((x) => x.filter((y) => y !== t))}
                  className="flex min-h-8 items-center gap-1 rounded-full bg-brasa/15 px-2.5 text-xs font-medium text-brasa"
                  aria-label={`Remover tag ${t}`}
                >
                  #{t}
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Input
          id="nota-tags"
          list="nota-tags-sugestoes"
          value={tagTexto}
          placeholder="Digite e tecle Enter (ex.: SBPE, liderança)"
          onChange={(e) => {
            const v = e.target.value
            // Escolher uma opção do datalist dispara change com o valor exato.
            if (sugestoesTags.includes(v)) adicionarTag(v)
            else setTagTexto(v)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              adicionarTag(tagTexto)
            }
          }}
        />
        <datalist id="nota-tags-sugestoes">
          {sugestoesTags
            .filter((t) => !tags.includes(t))
            .map((t) => (
              <option key={t} value={t} />
            ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Fonte" htmlFor="nota-fonte-tipo">
          <Select
            id="nota-fonte-tipo"
            value={fonteTipo}
            onChange={(e) => {
              setFonteTipo(e.target.value as StudyNoteFonteTipo | '')
              setFonteId('')
            }}
          >
            <option value="">Nenhuma</option>
            {FONTES_NOTA.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </FormField>
        {(fonteTipo === 'livro' || fonteTipo === 'curso') && (
          <FormField label={fonteTipo === 'livro' ? 'Livro' : 'Curso'} htmlFor="nota-fonte-id">
            <Select id="nota-fonte-id" value={fonteId} onChange={(e) => setFonteId(e.target.value)}>
              <option value="">Escolha…</option>
              {opcoesFonte.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={salvarNota.isPending}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={salvarNota.isPending || !conteudo.trim()}
          onClick={() => salvar((salva) => setGerar(salva))}
        >
          🤖 Gerar flashcards
        </Button>
        <Button type="submit" className="min-h-11" disabled={salvarNota.isPending}>
          {salvarNota.isPending ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="check" size={18} />}
          {salvarNota.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>

      {gerar && (
        <GerarFlashcardsModal
          open
          titulo={gerar.titulo}
          texto={gerar.conteudo ?? ''}
          fonte={{ tipo: 'anotacao', id: gerar.id }}
          onClose={() => {
            setGerar(null)
            onClose()
          }}
        />
      )}
    </form>
  )
}

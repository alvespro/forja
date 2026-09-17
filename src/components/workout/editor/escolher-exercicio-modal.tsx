import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ExerciseSearch } from '@/components/ExerciseSearch'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { FormField, propsDeErro } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { CATEGORIAS_EXERCICIO, useCriarExercicio, useExercises } from '@/hooks/use-exercises'
import { mensagemDeErro } from '@/lib/feedback'
import type { Exercise } from '@/types/database'

const sem = (s: string | null | undefined) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

type Props = { open: boolean; onClose: () => void; onEscolher: (exercicio: Exercise) => void }

/** "＋ Adicionar exercício": busca na biblioteca por nome ou grupo; sem resultado, ExerciseDB ou cadastro manual. */
export function EscolherExercicioModal({ open, onClose, onEscolher }: Props) {
  const exercicios = useExercises()
  const [termo, setTermo] = useState('')
  const [buscandoDb, setBuscandoDb] = useState(false)
  const [criando, setCriando] = useState(false)

  const resultados = useMemo(() => {
    const t = sem(termo.trim())
    const lista = exercicios.data ?? []
    if (!t) return lista.slice(0, 30)
    return lista.filter((e) => sem(e.nome).includes(t) || sem(e.grupo_muscular).includes(t)).slice(0, 50)
  }, [exercicios.data, termo])

  function escolher(e: Exercise) {
    setTermo('')
    onEscolher(e)
  }

  return (
    <>
      <Modal open={open && !buscandoDb && !criando} onClose={onClose} title="Adicionar exercício" maxWidth="lg">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cinza" />
            <Input autoFocus value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome ou grupo muscular (ex.: costas)" className="pl-9" aria-label="Buscar exercício" />
          </div>

          {exercicios.isLoading ? (
            <p className="text-[13px] text-cinza">Carregando exercícios…</p>
          ) : resultados.length === 0 ? (
            <p className="rounded-[var(--r-md)] border border-dashed border-linha p-3 text-[14px] text-cinza">Nenhum exercício com “{termo}” na sua biblioteca.</p>
          ) : (
            <ul className="flex max-h-[45vh] flex-col divide-y divide-linha overflow-y-auto ds-scroll" aria-label="Exercícios encontrados">
              {resultados.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => escolher(e)} className="flex min-h-12 w-full items-center justify-between gap-3 px-1 text-left outline-none hover:text-brasa focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="text-[15px] text-nevoa">{e.nome}</span>
                    <span className="shrink-0 text-[12px] text-cinza2-texto first-letter:uppercase">{e.grupo_muscular}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 border-t border-linha pt-3">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setBuscandoDb(true)}>
              <Icon name="search" size={18} />
              Buscar no ExerciseDB
            </Button>
            <Button type="button" className="min-h-11" onClick={() => setCriando(true)}>
              <Icon name="add" size={18} />
              Criar exercício
            </Button>
          </div>
        </div>
      </Modal>

      <ExerciseSearch
        open={open && buscandoDb}
        onClose={() => setBuscandoDb(false)}
        termoInicial={termo}
        acaoLabel="Adicionar ao treino"
        onImportado={(e) => {
          setBuscandoDb(false)
          escolher(e)
        }}
      />

      <CriarExercicioModal
        open={open && criando}
        nomeInicial={termo}
        onClose={() => setCriando(false)}
        onCriado={(e) => {
          setCriando(false)
          escolher(e)
        }}
      />
    </>
  )
}

function CriarExercicioModal({ open, nomeInicial, onClose, onCriado }: { open: boolean; nomeInicial: string; onClose: () => void; onCriado: (e: Exercise) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Criar exercício">
      {open && <CriarExercicioForm nomeInicial={nomeInicial} onClose={onClose} onCriado={onCriado} />}
    </Modal>
  )
}

function CriarExercicioForm({ nomeInicial, onClose, onCriado }: { nomeInicial: string; onClose: () => void; onCriado: (e: Exercise) => void }) {
  const criar = useCriarExercicio()
  const [nome, setNome] = useState(nomeInicial)
  const [grupo, setGrupo] = useState('')
  const [equipamento, setEquipamento] = useState('')
  const [categoria, setCategoria] = useState('forca')
  const [erros, setErros] = useState<{ nome?: string; grupo?: string }>({})

  function salvar(ev: React.FormEvent) {
    ev.preventDefault()
    const novos = { nome: nome.trim() ? undefined : 'Informe o nome.', grupo: grupo.trim() ? undefined : 'Informe o grupo muscular.' }
    setErros(novos)
    if (novos.nome || novos.grupo) return
    criar.mutate(
      { nome: nome.trim(), grupo_muscular: grupo.trim().toLowerCase(), equipamento: equipamento.trim() || null, categoria },
      {
        onSuccess: (e) => {
          toast.success(`${e.nome} criado.`)
          onCriado(e)
        },
        onError: (err) => toast.error(mensagemDeErro(err, 'criar o exercício')),
      },
    )
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" htmlFor="ex-nome" erro={erros.nome}>
        <Input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} {...propsDeErro('ex-nome', erros.nome)} />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Grupo muscular" htmlFor="ex-grupo" erro={erros.grupo}>
          <Input value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="costas" {...propsDeErro('ex-grupo', erros.grupo)} />
        </FormField>
        <FormField label="Equipamento" htmlFor="ex-equipamento">
          <Input id="ex-equipamento" value={equipamento} onChange={(e) => setEquipamento(e.target.value)} placeholder="máquina" />
        </FormField>
      </div>
      <FormField label="Categoria" htmlFor="ex-categoria">
        <Select id="ex-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS_EXERCICIO.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={criar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="min-h-11" disabled={criar.isPending}>
          {criar.isPending && <Icon name="progress_activity" size={18} className="animate-spin" />}
          {criar.isPending ? 'Salvando…' : 'Criar e adicionar'}
        </Button>
      </div>
    </form>
  )
}

import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/feedback/error-state'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EscolherExercicioModal } from '@/components/workout/editor/escolher-exercicio-modal'
import { PrescricaoModal, type PrescricaoValores } from '@/components/workout/editor/prescricao-modal'
import { TreinoDadosModal } from '@/components/workout/editor/treino-dados-modal'
import { useConfirm } from '@/hooks/use-confirm'
import { useExercises } from '@/hooks/use-exercises'
import {
  inputDaPrescricao,
  useCreateWorkoutExercise,
  useDeleteWorkoutExercise,
  useReordenarPrescricoes,
  useUpdateWorkoutExercise,
  useWorkoutExercises,
} from '@/hooks/use-workout-exercises'
import { DIAS_SEMANA, useArquivarTreino, useAtualizarDadosTreino, useWorkout } from '@/hooks/use-workouts'
import { mensagemDeErro } from '@/lib/feedback'
import { FASE_LABEL, FASES_EM_ORDEM, faseDe, moverNaFase, ordenarPorFase, resumoPrescricao } from '@/lib/workout-phases'
import { cn } from '@/lib/utils'
import type { Exercise, WorkoutExercise, WorkoutFase } from '@/types/database'

/** Edição de um treino: dados (nome/dia), exercícios por fase com reordenação, adicionar, editar, remover, arquivar. */
export function WorkoutEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const treino = useWorkout(id)
  const prescricoes = useWorkoutExercises(id)
  const exercicios = useExercises()
  const atualizarDados = useAtualizarDadosTreino()
  const arquivar = useArquivarTreino()
  const criar = useCreateWorkoutExercise()
  const atualizar = useUpdateWorkoutExercise()
  const remover = useDeleteWorkoutExercise()
  const reordenar = useReordenarPrescricoes()
  const { confirm, dialog } = useConfirm()

  const [editandoDados, setEditandoDados] = useState(false)
  const [escolhendo, setEscolhendo] = useState(false)
  const [novoExercicio, setNovoExercicio] = useState<Exercise | null>(null)
  const [editando, setEditando] = useState<WorkoutExercise | null>(null)
  // Ordem otimista enquanto a reordenação grava.
  const [ordemLocal, setOrdemLocal] = useState<WorkoutExercise[] | null>(null)

  const lista = useMemo(() => ordemLocal ?? ordenarPorFase(prescricoes.data ?? []), [ordemLocal, prescricoes.data])
  const porId = useMemo(() => new Map((exercicios.data ?? []).map((e) => [e.id, e])), [exercicios.data])

  if (treino.isLoading || prescricoes.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (treino.isError || !treino.data) {
    return <ErrorState message="Treino não encontrado." onRetry={() => treino.refetch()} />
  }
  const t = treino.data

  function mover(p: WorkoutExercise, posicaoNaFase: number) {
    const { lista: nova, mudancas } = moverNaFase(lista, p.id, posicaoNaFase)
    if (mudancas.length === 0) return
    setOrdemLocal(nova)
    reordenar.mutate(
      { workoutId: t.id, mudancas },
      {
        onSettled: () => setOrdemLocal(null),
        onError: (e) => toast.error(mensagemDeErro(e, 'reordenar')),
      },
    )
  }

  async function removerDoTreino(p: WorkoutExercise) {
    const nome = porId.get(p.exercise_id)?.nome ?? 'exercício'
    const ok = await confirm({ title: `Remover ${nome} do treino?`, description: 'O exercício continua na biblioteca e o histórico de cargas não é apagado.', confirmLabel: 'Remover' })
    if (!ok) return
    remover.mutate(
      { id: p.id, workoutId: t.id },
      { onSuccess: () => toast.success(`${nome} removido do treino.`), onError: (e) => toast.error(mensagemDeErro(e, 'remover')) },
    )
  }

  async function arquivarTreino() {
    const ok = await confirm({
      title: `Arquivar ${t.nome}?`,
      description: 'Ele sai da rotação e da lista de treinos. Sessões e cargas registradas continuam salvas.',
      confirmLabel: 'Arquivar',
    })
    if (!ok) return
    arquivar.mutate(t.id, {
      onSuccess: () => {
        toast.success(`${t.nome} arquivado.`)
        navigate('/workout', { state: { initialTab: 'treinos' } })
      },
      onError: (e) => toast.error(mensagemDeErro(e, 'arquivar')),
    })
  }

  function salvarNovo(valores: PrescricaoValores) {
    if (!novoExercicio) return
    const ultimaDaFase = lista.filter((p) => faseDe(p.fase) === valores.fase).at(-1)
    const ordem = ultimaDaFase ? ultimaDaFase.ordem + 1 : (lista.at(-1)?.ordem ?? 0) + 1
    criar.mutate(
      { workout_id: t.id, exercise_id: novoExercicio.id, ordem, reps_alvo: null, cadencia_alvo: null, notas: null, ...valores },
      {
        onSuccess: () => {
          toast.success(`${novoExercicio.nome} adicionado em ${FASE_LABEL[valores.fase]}.`)
          setNovoExercicio(null)
        },
        onError: (e) => toast.error(mensagemDeErro(e, 'adicionar o exercício')),
      },
    )
  }

  function salvarEdicao(valores: PrescricaoValores) {
    if (!editando) return
    atualizar.mutate(
      { id: editando.id, values: { ...inputDaPrescricao(editando), ...valores } },
      {
        onSuccess: () => {
          toast.success('Prescrição atualizada.')
          setEditando(null)
        },
        onError: (e) => toast.error(mensagemDeErro(e, 'salvar a prescrição')),
      },
    )
  }

  const dia = DIAS_SEMANA.find((d) => d.value === t.dia_semana)?.label

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      {dialog}
      <Link to="/workout" state={{ initialTab: 'treinos' }} className="flex min-h-11 w-fit items-center gap-1 text-[14px] text-cinza hover:text-nevoa">
        <Icon name="arrow_back" size={20} />
        Treinos
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="ds-h2 text-nevoa">{t.nome}</h1>
            <span className="text-[13px] text-cinza">
              {dia ? `${dia} · ` : ''}
              {lista.length} {lista.length === 1 ? 'exercício' : 'exercícios'}
              {t.arquivado && <span className="text-brasa"> · arquivado</span>}
            </span>
          </div>
          <Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={() => setEditandoDados(true)}>
            <Icon name="edit" size={18} />
            Nome/dia
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="min-h-11" onClick={() => setEscolhendo(true)}>
            <Icon name="add" size={20} />
            Adicionar exercício
          </Button>
          {!t.arquivado && (
            <Button type="button" variant="ghost" className="min-h-11 text-cinza" onClick={arquivarTreino} disabled={arquivar.isPending}>
              <Icon name="archive" size={18} />
              Arquivar treino
            </Button>
          )}
        </div>
      </header>

      {lista.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-6 text-center">
          <Icon name="fitness_center" size={32} className="text-cinza" />
          <p className="text-[15px] text-nevoa">Nenhum exercício ainda</p>
          <p className="text-[13px] text-cinza">Adicione a mobilidade pré-treino, os exercícios de força e o cardio.</p>
        </div>
      ) : (
        FASES_EM_ORDEM.map((fase) => {
          const daFase = lista.filter((p) => faseDe(p.fase) === fase)
          if (daFase.length === 0) return null
          return (
            <section key={fase} className="flex flex-col gap-2" aria-labelledby={`fase-${fase}`}>
              <h2 id={`fase-${fase}`} className={cn('ds-label', fase === 'mobilidade' && '!text-amber-300')}>
                {FASE_LABEL[fase]} · {daFase.length}
              </h2>
              <ListaReordenavel
                fase={fase}
                itens={daFase}
                nomeDe={(p) => porId.get(p.exercise_id)?.nome ?? 'Exercício removido'}
                onMover={mover}
                onEditar={setEditando}
                onRemover={(p) => void removerDoTreino(p)}
              />
            </section>
          )
        })
      )}

      <TreinoDadosModal
        open={editandoDados}
        titulo="Editar treino"
        inicial={{ nome: t.nome, dia_semana: t.dia_semana }}
        salvando={atualizarDados.isPending}
        rotuloSalvar="Salvar"
        onClose={() => setEditandoDados(false)}
        onSalvar={(valores) =>
          atualizarDados.mutate(
            { id: t.id, values: valores },
            {
              onSuccess: () => {
                toast.success('Treino atualizado.')
                setEditandoDados(false)
              },
              onError: (e) => toast.error(mensagemDeErro(e, 'salvar o treino')),
            },
          )
        }
      />

      <EscolherExercicioModal
        open={escolhendo}
        onClose={() => setEscolhendo(false)}
        onEscolher={(e) => {
          setEscolhendo(false)
          setNovoExercicio(e)
        }}
      />

      <PrescricaoModal
        open={novoExercicio !== null}
        exercicioNome={novoExercicio?.nome ?? ''}
        faseInicial={novoExercicio?.categoria === 'mobilidade' || novoExercicio?.categoria === 'alongamento' ? 'mobilidade' : novoExercicio?.categoria === 'cardio' ? 'cardio' : 'treino'}
        salvando={criar.isPending}
        onClose={() => setNovoExercicio(null)}
        onSalvar={salvarNovo}
      />

      <PrescricaoModal
        open={editando !== null}
        exercicioNome={editando ? (porId.get(editando.exercise_id)?.nome ?? 'Exercício') : ''}
        prescricao={editando ?? undefined}
        salvando={atualizar.isPending}
        onClose={() => setEditando(null)}
        onSalvar={salvarEdicao}
      />
    </div>
  )
}

type ListaProps = {
  fase: WorkoutFase
  itens: WorkoutExercise[]
  nomeDe: (p: WorkoutExercise) => string
  onMover: (p: WorkoutExercise, posicaoNaFase: number) => void
  onEditar: (p: WorkoutExercise) => void
  onRemover: (p: WorkoutExercise) => void
}

/**
 * Lista de uma fase com arrastar pela alça (ponteiro/toque) e alternativa de teclado:
 * com a alça em foco, ↑/↓ movem o exercício.
 */
function ListaReordenavel({ fase, itens, nomeDe, onMover, onEditar, onRemover }: ListaProps) {
  const refs = useRef(new Map<string, HTMLLIElement>())
  const [arrastando, setArrastando] = useState<{ id: string; destino: number } | null>(null)

  function destinoPara(clientY: number) {
    let destino = 0
    for (const [i, p] of itens.entries()) {
      const el = refs.current.get(p.id)
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (clientY > r.top + r.height / 2) destino = i + 1
    }
    return destino
  }

  function soltar(p: WorkoutExercise) {
    if (!arrastando) return
    const atual = itens.findIndex((x) => x.id === p.id)
    // O destino conta a posição com o próprio item ainda na lista: descendo, desconta 1.
    const destino = arrastando.destino > atual ? arrastando.destino - 1 : arrastando.destino
    setArrastando(null)
    if (destino !== atual) onMover(p, destino)
  }

  return (
    <ol className="flex flex-col gap-2">
      {itens.map((p, i) => {
        const nome = nomeDe(p)
        const esteArrastando = arrastando?.id === p.id
        const linhaAntes = arrastando && !esteArrastando && arrastando.destino === i
        const linhaDepois = arrastando && !esteArrastando && i === itens.length - 1 && arrastando.destino === itens.length
        return (
          <li
            key={p.id}
            ref={(el) => {
              if (el) refs.current.set(p.id, el)
              else refs.current.delete(p.id)
            }}
            className={cn(
              'glass-card flex min-h-16 items-center gap-1 !rounded-[var(--r-md)] py-2 pl-1 pr-2 transition-shadow',
              esteArrastando && 'opacity-60 ring-2 ring-brasa',
              linhaAntes && 'shadow-[0_-3px_0_0_var(--brasa)]',
              linhaDepois && 'shadow-[0_3px_0_0_var(--brasa)]',
              fase === 'mobilidade' && '!border-amber-400/25',
            )}
          >
            <button
              type="button"
              aria-label={`Reordenar ${nome}. Use as setas para cima e para baixo.`}
              className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-cinza outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setArrastando({ id: p.id, destino: i })
              }}
              onPointerMove={(e) => {
                if (esteArrastando) setArrastando({ id: p.id, destino: destinoPara(e.clientY) })
              }}
              onPointerUp={() => soltar(p)}
              onPointerCancel={() => setArrastando(null)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' && i > 0) {
                  e.preventDefault()
                  onMover(p, i - 1)
                }
                if (e.key === 'ArrowDown' && i < itens.length - 1) {
                  e.preventDefault()
                  onMover(p, i + 1)
                }
              }}
            >
              <Icon name="drag_indicator" size={22} />
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold text-nevoa">{nome}</span>
              <span className="truncate text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">{resumoPrescricao(p)}</span>
              {p.observacao && <span className="truncate text-[12px] font-semibold text-brasa">{p.observacao}</span>}
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Editar ${nome}`} onClick={() => onEditar(p)}>
              <Icon name="edit" size={18} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-cinza hover:text-alerta-texto" aria-label={`Remover ${nome} do treino`} onClick={() => onRemover(p)}>
              <Icon name="delete" size={18} />
            </Button>
          </li>
        )
      })}
    </ol>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/feedback/empty-state'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useExerciseDBStatus, useExerciseImport, type GrupoBusca, type ResultadoBusca } from '@/hooks/useExerciseImport'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

const GRUPOS: { valor: GrupoBusca; label: string }[] = [
  { valor: 'peito', label: 'Peito' },
  { valor: 'costas', label: 'Costas' },
  { valor: 'pernas', label: 'Pernas' },
  { valor: 'ombros', label: 'Ombros' },
  { valor: 'biceps', label: 'Bíceps' },
  { valor: 'triceps', label: 'Tríceps' },
  { valor: 'core', label: 'Core' },
]

const DEBOUNCE_MS = 400

type ExerciseSearchProps = {
  open: boolean
  onClose: () => void
  /** Vincular a um exercício existente do FORJA; sem isso, cria um novo na biblioteca. */
  exerciseId?: string | null
  /** Termo inicial (ex.: nome do exercício que está sendo vinculado). */
  termoInicial?: string
  acaoLabel?: string
  onImportado: (exercicio: Exercise) => void
}

/** Busca no ExerciseDB (nome ou grupo) e importa o escolhido — com GIF/imagem para reconhecer o movimento. */
export function ExerciseSearch({ open, onClose, exerciseId, termoInicial = '', acaoLabel, onImportado }: ExerciseSearchProps) {
  const status = useExerciseDBStatus()
  const { buscar, importar } = useExerciseImport()
  const queryClient = useQueryClient()
  const [termo, setTermo] = useState(termoInicial)
  const [grupo, setGrupo] = useState<GrupoBusca | null>(null)
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [importando, setImportando] = useState<string | null>(null)
  const pedido = useRef(0)

  useEffect(() => {
    if (open) setTermo(termoInicial)
  }, [open, termoInicial])

  useEffect(() => {
    if (!open || status.data?.configurado === false) return
    const q = termo.trim()
    if (!grupo && q.length < 3) {
      setResultados([])
      return
    }
    const id = ++pedido.current
    const timer = window.setTimeout(async () => {
      setCarregando(true)
      setErro(null)
      try {
        const r = await buscar(grupo ? { grupo } : { query: q })
        if (id === pedido.current) setResultados(r)
      } catch (err) {
        if (id === pedido.current) setErro(err instanceof Error ? err.message : 'Falha na busca.')
      } finally {
        if (id === pedido.current) setCarregando(false)
      }
    }, grupo ? 0 : DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // `buscar` é estável o bastante: depende só do cliente Supabase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, termo, grupo, status.data?.configurado])

  async function escolher(r: ResultadoBusca) {
    // Já importado e só queremos usar: nada de chamar a API (cache-first).
    const local = r.exercise_id && !exerciseId
      ? queryClient.getQueryData<Exercise[]>(['exercises'])?.find((e) => e.id === r.exercise_id)
      : null
    if (local) {
      onImportado(local)
      onClose()
      return
    }
    setImportando(r.exercisedb_id)
    try {
      const exercicio = await importar(r.exercisedb_id, exerciseId ?? null)
      toast.success(`✅ ${exercicio.nome} importado do ExerciseDB`)
      onImportado(exercicio)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao importar.')
    } finally {
      setImportando(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buscar no ExerciseDB" description="GIF, instruções e músculos do movimento" maxWidth="lg">
      {status.data?.configurado === false ? (
        <EmptyState
          message="ExerciseDB ainda não configurado"
          description="Adicione o secret EXERCISEDB_API_KEY (RapidAPI · ExerciseDB) no Supabase para buscar e importar exercícios."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-aco-texto" aria-hidden="true" />
            <Input
              autoFocus
              value={termo}
              onChange={(e) => {
                setGrupo(null)
                setTermo(e.target.value)
              }}
              placeholder="Buscar em inglês: bench press, squat…"
              className="h-11 pl-9"
              aria-label="Buscar exercício"
            />
          </div>

          <div role="group" aria-label="Filtrar por grupo" className="ds-scroll -mx-1 flex gap-2 overflow-x-auto px-1">
            {GRUPOS.map((g) => (
              <button
                key={g.valor}
                type="button"
                aria-pressed={grupo === g.valor}
                onClick={() => setGrupo((atual) => (atual === g.valor ? null : g.valor))}
                className={cn(
                  'flex min-h-11 shrink-0 items-center rounded-full border px-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  grupo === g.valor ? 'border-brasa bg-brasa/15 text-foreground' : 'border-linha text-aco-texto',
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          {erro && <p className="ds-body-sm text-alerta">{erro}</p>}

          {carregando ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-md)]" />
              ))}
            </div>
          ) : resultados.length === 0 ? (
            <p className="ds-body-sm text-aco-texto">
              {grupo || termo.trim().length >= 3 ? 'Nenhum exercício encontrado.' : 'Digite ao menos 3 letras ou escolha um grupo.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {resultados.map((r) => (
                <li key={r.exercisedb_id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-linha bg-card/60 p-2">
                  {r.gif_url || r.imagem_url ? (
                    <img
                      src={r.gif_url ?? r.imagem_url ?? ''}
                      alt=""
                      loading="lazy"
                      className="size-16 shrink-0 rounded-[var(--radius-sm)] bg-white object-cover"
                    />
                  ) : (
                    <span className="size-16 shrink-0 rounded-[var(--radius-sm)] bg-aco" aria-hidden="true" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-2 ds-body-md font-semibold capitalize text-foreground">{r.nome_original}</span>
                    <span className="truncate ds-body-sm text-aco-texto first-letter:uppercase">
                      {[r.grupo_muscular, r.equipamento].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={importando !== null}
                    onClick={() => escolher(r)}
                    className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-brasa px-3 ds-body-sm font-semibold text-meia-noite outline-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {importando === r.exercisedb_id ? (
                      'Importando…'
                    ) : r.exercise_id && !exerciseId ? (
                      <>
                        <Check className="size-4" aria-hidden="true" />
                        Usar
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" aria-hidden="true" />
                        {acaoLabel ?? 'Adicionar'}
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}

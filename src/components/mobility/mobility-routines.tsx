import { useEffect, useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { ErrorState } from '@/components/feedback/error-state'
import { MobilityRunner } from '@/components/mobility/mobility-runner'
import { Skeleton } from '@/components/ui/skeleton'
import { useMobilityRoutines, type RotinaComExercicios } from '@/hooks/use-mobility-routines'
import { useExerciseDBStatus, useExerciseImport } from '@/hooks/useExerciseImport'
import { CONTEXTO_INFO } from '@/lib/mobility'
import type { MobilityContexto } from '@/types/database'

type MobilityRoutinesProps = {
  /** Abre direto a rotina deste contexto (ex.: vindo do Hoje). */
  iniciarContexto?: MobilityContexto | null
  habitId?: string | null
  onIniciado?: () => void
}

/** Treino → Mobilidade (e /mobilidade): cards das rotinas e execução em tela cheia. */
export function MobilityRoutines({ iniciarContexto, habitId, onIniciado }: MobilityRoutinesProps) {
  const rotinas = useMobilityRoutines()
  const status = useExerciseDBStatus()
  const { syncSeed } = useExerciseImport()
  const [executando, setExecutando] = useState<{ rotina: RotinaComExercicios; habitId: string | null } | null>(null)
  const [preparando, setPreparando] = useState(false)

  // Atalho do Hoje: ?rotina=manha&iniciar=1 abre a execução assim que carregar.
  useEffect(() => {
    if (!iniciarContexto || !rotinas.data || executando) return
    const alvo = rotinas.data.find((r) => r.contexto === iniciarContexto && r.exercicios.length > 0)
    if (alvo) {
      setExecutando({ rotina: alvo, habitId: habitId ?? null })
      onIniciado?.()
    }
  }, [iniciarContexto, rotinas.data, executando, habitId, onIniciado])

  async function preparar() {
    setPreparando(true)
    try {
      const r = await syncSeed()
      toast.success(`Rotinas prontas: ${r.rotinas.length} · ${r.mobilidade} exercícios de mobilidade importados`)
      if (r.erros.length > 0) toast.warning(r.erros.slice(0, 2).join(' · '))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao preparar as rotinas.')
    } finally {
      setPreparando(false)
    }
  }

  const lista = rotinas.data ?? []
  const semRotinas = !rotinas.isLoading && !rotinas.isError && lista.length === 0

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="ds-h2 text-foreground">🧘 Mobilidade & Alongamento</h2>
        <p className="ds-body-sm text-aco-texto">Prepare e recupere seu corpo</p>
      </header>

      {rotinas.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : rotinas.isError ? (
        <ErrorState message="Não foi possível carregar as rotinas." onRetry={() => rotinas.refetch()} />
      ) : semRotinas ? (
        <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-linha p-4">
          <p className="ds-body-md text-foreground">Nenhuma rotina ainda.</p>
          <p className="ds-body-sm text-aco-texto">
            {status.data?.configurado === false
              ? 'As rotinas usam exercícios do ExerciseDB (com GIF). Adicione o secret EXERCISEDB_API_KEY no Supabase e volte aqui.'
              : 'Importa exercícios de mobilidade, alongamento e reabilitação do ExerciseDB e monta 4 rotinas: Ativação Matinal 5AM, Aquecimento Pré-Força, Mobilidade Pós-Corrida e Recuperação Ativa.'}
          </p>
          <button
            type="button"
            onClick={preparar}
            disabled={preparando || status.data?.configurado === false}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brasa px-5 ds-body-md font-semibold text-meia-noite outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className={preparando ? 'size-4 animate-spin' : 'size-4'} aria-hidden="true" />
            {preparando ? 'Importando e traduzindo… (até 1 min)' : 'Preparar rotinas'}
          </button>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((rotina) => {
            const info = CONTEXTO_INFO[rotina.contexto ?? 'qualquer']
            const vazia = rotina.exercicios.length === 0
            return (
              <li key={rotina.id} className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-[28px] leading-none" aria-hidden="true">
                    {info.icone}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="w-fit rounded-full bg-brasa/15 px-2 py-0.5 text-[11px] font-semibold text-brasa">{info.label}</span>
                    <span className="ds-h4 text-foreground">{rotina.nome}</span>
                    <span className="ds-data-md text-aco-texto">
                      {rotina.duracao_min ?? 5} min · {rotina.exercicios.length} exercícios
                    </span>
                    {rotina.descricao && <span className="ds-body-sm text-aco-texto">{rotina.descricao}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={vazia}
                  onClick={() => setExecutando({ rotina, habitId: null })}
                  className="ds-pressable flex min-h-12 items-center justify-center gap-2 rounded-full bg-brasa px-5 ds-body-md font-semibold text-meia-noite outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Play className="size-4 fill-current" aria-hidden="true" />
                  {vazia ? 'Sem exercícios' : 'Iniciar'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {executando && (
        <MobilityRunner rotina={executando.rotina} habitId={executando.habitId} onClose={() => setExecutando(null)} />
      )}
    </div>
  )
}

import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/Icon'

import { MobilityRoutines } from '@/components/mobility/mobility-routines'
import type { MobilityContexto } from '@/types/database'

const CONTEXTOS: MobilityContexto[] = ['manha', 'pre_forca', 'pre_corrida', 'pos_treino', 'recuperacao', 'qualquer']

/** /mobilidade — mesma lista da aba Treino → Mobilidade; aceita ?rotina=<contexto>&iniciar=1&habito=<id>. */
export function MobilidadePage() {
  const [params, setParams] = useSearchParams()
  const rotina = params.get('rotina') as MobilityContexto | null
  const iniciar = params.get('iniciar') === '1' && rotina && CONTEXTOS.includes(rotina) ? rotina : null

  // Depois de abrir a execução, limpa a query para o "voltar" não reabrir a rotina.
  const limpar = useCallback(() => setParams({}, { replace: true }), [setParams])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        to="/workout"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-full px-2 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="chevron_left" size={16} />
        Treino
      </Link>
      <MobilityRoutines iniciarContexto={iniciar} habitId={params.get('habito')} onIniciado={limpar} />
    </div>
  )
}

import type { ReactNode } from 'react'
import { Check, Plus } from 'lucide-react'

import { MacroBar } from '@/components/ds/macro-bar'
import { cn } from '@/lib/utils'

type Macro = { atual: number; meta: number }

export type NutritionCardProps = {
  nome: string
  horario?: string | null
  agora?: boolean
  passada?: boolean
  kcal: Macro
  proteina: Macro
  carbo: Macro
  gordura: Macro
  onRegistrar?: () => void
  /** Ações extras no rodapé (manual, sugestões). */
  extra?: ReactNode
  /** Aviso contextual abaixo do cabeçalho (ex.: limite de carbo no jantar). */
  aviso?: ReactNode
  /** Há registro hoje, mesmo sem calorias (ex.: lançamento manual só com descrição). */
  registrado?: boolean
  /** Versão menor para a lista de próximas refeições. */
  compact?: boolean
  className?: string
}

/**
 * Card de refeição (referência: MyFitnessPal). Vazio mostra convite tracejado;
 * registrado mostra a MacroBar com meta e um check discreto.
 */
export function NutritionCard({
  nome,
  horario,
  agora = false,
  passada = false,
  kcal,
  proteina,
  carbo,
  gordura,
  onRegistrar,
  extra,
  aviso,
  registrado: registradoProp,
  compact = false,
  className,
}: NutritionCardProps) {
  const registrado = registradoProp ?? kcal.atual > 0

  return (
    <div
      className={cn(
        'flex flex-col rounded-[var(--radius-lg)] border bg-card',
        compact ? 'gap-3 p-3.5' : 'gap-4 p-4',
        agora ? 'ds-card-brasa border-brasa' : 'border-border',
        passada && !agora && 'opacity-60',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {agora && (
              <span className="ds-pulse rounded-full bg-brasa px-2 py-0.5 ds-data-sm font-bold text-meia-noite">
                AGORA
              </span>
            )}
            <span className={cn('truncate font-semibold text-foreground', agora ? 'ds-h4' : 'ds-body-lg')}>{nome}</span>
            {registrado && <Check className="size-4 shrink-0 text-ok" aria-label="registrado" />}
          </div>
          {horario && <span className="ds-data-md text-aco-texto">{horario}</span>}
        </div>

        <span className="shrink-0 ds-data-lg text-foreground">
          {Math.round(kcal.atual)}
          <span className="text-aco-texto"> / {Math.round(kcal.meta)} kcal</span>
        </span>
      </div>

      {aviso}

      {registrado ? (
        <MacroBar proteina={proteina} carbo={carbo} gordura={gordura} />
      ) : (
        onRegistrar && (
          <button
            type="button"
            onClick={onRegistrar}
            className={cn(
              'ds-pressable-card flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed outline-none hover:border-brasa/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
              agora ? 'min-h-14 border-brasa/60 ds-body-md font-semibold text-brasa' : 'min-h-11 border-linha ds-body-sm text-aco-texto',
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            {agora ? 'Registrar alimento' : 'Registrar'}
          </button>
        )
      )}

      {(registrado || extra) && (
        <div className="flex flex-wrap items-center gap-2">
          {registrado && onRegistrar && (
            <button
              type="button"
              onClick={onRegistrar}
              className={cn(
                'ds-pressable flex min-h-11 items-center gap-1.5 rounded-full px-4 ds-body-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                agora ? 'bg-brasa text-meia-noite' : 'bg-aco-claro text-foreground',
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              Registrar alimento
            </button>
          )}
          {extra}
        </div>
      )}
    </div>
  )
}

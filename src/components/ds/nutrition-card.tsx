import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'

import { MacroBar } from '@/components/ds/macro-bar'
import { StatusDot } from '@/components/ds/status-dot'
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
  /** Passou de um limite do plano (ex.: carbo no jantar): borda vermelha. */
  alerta?: boolean
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
  alerta = false,
  className,
}: NutritionCardProps) {
  const registrado = registradoProp ?? kcal.atual > 0

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-[var(--r-md)] border bg-aco',
        compact ? 'gap-3 p-3.5' : 'gap-4 p-4',
        alerta ? 'border-alerta' : agora ? 'border-brasa shadow-[var(--shadow-brasa)]' : 'border-linha',
        // Refeição que já passou e foi registrada sai de foco; passada sem registro continua pedindo atenção.
        passada && registrado && !agora && 'opacity-50',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {agora && (
              <span className="ds-terminal-xs rounded-[4px] bg-brasa px-1.5 pb-px pt-0.5 text-fundo">Agora</span>
            )}
            <span className={cn('truncate font-semibold text-nevoa', agora ? 'ds-h4' : 'ds-body-lg')}>{nome}</span>
            {registrado && <Icon name="check" size={16} className="text-ok" label="registrado" />}
          </div>
          {horario && <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">{horario}</span>}
        </div>

        <span className="flex shrink-0 items-center gap-2 text-[14px] tabular-nums text-nevoa [font-family:var(--font-display)]">
          <span>
            {Math.round(kcal.atual)}
            <span className="text-cinza"> / {Math.round(kcal.meta)} kcal</span>
          </span>
          {agora && <StatusDot color="brasa" pulse />}
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
              'ds-pressable-card flex items-center justify-center gap-2 rounded-[var(--r-sm)] border border-dashed outline-none hover:border-brasa/50 hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring',
              agora ? 'min-h-14 border-brasa/60 ds-body-md font-semibold text-brasa' : 'min-h-11 border-linha ds-body-sm text-cinza',
            )}
          >
            <Icon name="add" size={16} />
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
                'ds-pressable flex min-h-11 items-center gap-1.5 rounded-[var(--r-md)] px-4 ds-body-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                agora ? 'bg-brasa text-fundo shadow-[var(--shadow-brasa)]' : 'border border-linha bg-fundo text-nevoa',
              )}
            >
              <Icon name="add" size={16} />
              Registrar alimento
            </button>
          )}
          {extra}
        </div>
      )}
    </div>
  )
}

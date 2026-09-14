import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { MacroBar } from '@/components/ds/macro-bar'
import { useActiveDietPlan } from '@/hooks/use-diet-plan'
import { useMealLogsToday } from '@/hooks/use-meal-logs'

/** SECTION 6 do cockpit: prévia compacta dos macros do dia (só com plano ativo). */
export function NutritionPreviewCard() {
  const plan = useActiveDietPlan()
  const logs = useMealLogsToday()

  const consumido = useMemo(
    () =>
      (logs.data ?? []).reduce(
        (acc, l) => ({
          kcal: acc.kcal + (l.calorias ?? 0),
          p: acc.p + (l.proteina_g ?? 0),
          c: acc.c + (l.carbo_g ?? 0),
          g: acc.g + (l.gordura_g ?? 0),
        }),
        { kcal: 0, p: 0, c: 0, g: 0 },
      ),
    [logs.data],
  )

  const p = plan.data
  if (!p) return null

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="ds-label">Nutrição</span>
        <Link
          to="/nutricao"
          className="flex min-h-11 items-center gap-1 ds-body-sm font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver detalhes
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="-mt-2 grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <span className="ds-display-sm text-[28px] text-foreground">{Math.round(consumido.kcal)}</span>
          <span className="ds-data-md text-aco-texto">de {p.calorias_alvo ?? '—'} kcal</span>
        </div>
        <div className="flex flex-col">
          <span className="ds-display-sm text-[28px] text-ok">{Math.round(consumido.p)}</span>
          <span className="ds-data-md text-aco-texto">de {p.proteina_g ?? '—'} g proteína</span>
        </div>
      </div>

      <MacroBar
        compact
        proteina={{ atual: consumido.p, meta: p.proteina_g ?? 0 }}
        carbo={{ atual: consumido.c, meta: p.carbo_g ?? 0 }}
        gordura={{ atual: consumido.g, meta: p.gordura_g ?? 0 }}
      />
    </section>
  )
}

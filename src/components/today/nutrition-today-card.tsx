import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { MacroBar } from '@/components/ds/macro-bar'
import { StatusDot } from '@/components/ds/status-dot'
import { useActiveDietPlan, useMealSlots } from '@/hooks/use-diet-plan'
import { useMealLogsToday } from '@/hooks/use-meal-logs'
import { useSystemStatus } from '@/hooks/use-system-status'
import { nowMinutesInSaoPaulo } from '@/lib/date'
import { classifyMeals } from '@/lib/meal-schedule'

/**
 * SECTION 5 do cockpit (upcoming events do Aaru): macros do dia numa barra de 3
 * segmentos, kcal consumidas/meta e a refeição do momento. O ponto de sync
 * reflete o estado real (offline, falha ou em dia).
 */
export function NutritionTodayCard() {
  const plan = useActiveDietPlan()
  const slots = useMealSlots(plan.data?.id)
  const logs = useMealLogsToday()
  const status = useSystemStatus()

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
  const lista = slots.data ?? []
  const atual = lista.find((s) => s.id === classifyMeals(lista, nowMinutesInSaoPaulo()).currentId) ?? null
  const kcal = (n: number) => Math.round(n).toLocaleString('pt-BR')

  const sync =
    status.estado === 'offline'
      ? { cor: 'cinza' as const, label: 'Offline' }
      : logs.isFetching
        ? { cor: 'brasa' as const, label: 'Sincronizando' }
        : status.estado === 'falhas'
          ? { cor: 'alerta' as const, label: 'Falha de sync' }
          : { cor: 'ok' as const, label: 'Sync OK' }

  return (
    <Link to="/nutricao" className="block rounded-[var(--r-lg)] outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <GlassCard className="interactive flex flex-col gap-4" padding="var(--s4)" as="div">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Icon name="restaurant" size={18} className="text-cinza2" />
            <span className="ds-label">Nutrição hoje</span>
          </span>
          <StatusDot color={sync.cor} pulse={logs.isFetching} label={sync.label} colorLabel={sync.cor !== 'cinza'} />
        </div>

        {p ? (
          <MacroBar
            size="lg"
            compact
            proteina={{ atual: consumido.p, meta: p.proteina_g ?? 0 }}
            carbo={{ atual: consumido.c, meta: p.carbo_g ?? 0 }}
            gordura={{ atual: consumido.g, meta: p.gordura_g ?? 0 }}
          />
        ) : null}

        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-[16px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">
            {kcal(consumido.kcal)}
            <span className="font-normal text-cinza"> / {p?.calorias_alvo ? kcal(p.calorias_alvo) : '—'} kcal</span>
          </span>
          {p && (
            <span className="text-[12px] tabular-nums text-cinza2-texto [font-family:var(--font-display)]">
              P {Math.round(consumido.p)}/{p.proteina_g ?? '—'}g
            </span>
          )}
        </div>

        {atual ? (
          <span className="flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[13px] text-nevoa">
            <Icon name="lunch_dining" size={18} className="text-brasa" />
            <span className="min-w-0 flex-1 truncate">{atual.nome}</span>
            <span className="shrink-0 tabular-nums text-cinza [font-family:var(--font-display)]">{atual.horario_alvo?.slice(0, 5) ?? '—'}</span>
          </span>
        ) : (
          !p && <span className="text-[13px] text-cinza">Sem plano alimentar ativo.</span>
        )}
      </GlassCard>
    </Link>
  )
}

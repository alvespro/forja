import { Link } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useHeartZones } from '@/hooks/use-heart-zones'

const ZONA_COR: Record<string, string> = {
  Z1: 'bg-aco-texto/60',
  Z2: 'bg-ok',
  Z3: 'bg-atencao',
  Z4: 'bg-brasa-quente',
  Z5: 'bg-alerta',
}

/** Zonas de FC do cardio: Karvonen (FC de repouso) quando calculadas, senão estimadas por % da FC máxima. */
export function HeartZonesCard() {
  const { zones, isLoading } = useHeartZones()

  if (isLoading) return <Skeleton className="h-44 w-full rounded-[var(--radius-lg)]" />

  const rotulo = zones.metodo === 'karvonen' ? 'Karvonen' : 'estimado'

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="ds-label">Zonas de FC</span>
        <Link
          to="/configuracoes"
          className="flex min-h-11 items-center ds-body-sm font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Recalcular
        </Link>
      </div>

      <ul className="-mt-2 flex flex-col gap-1.5">
        {zones.zonas.map((z) => (
          <li key={z.zona} className="flex items-center gap-3">
            <span className={`h-8 w-1 shrink-0 rounded-full ${ZONA_COR[z.zona]}`} aria-hidden="true" />
            <span className="w-7 shrink-0 font-bold text-foreground [font-family:var(--font-data)]">{z.zona}</span>
            <span className="min-w-0 flex-1 ds-body-sm text-aco-texto">{z.nome}</span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="ds-data-md text-foreground tabular-nums">
                {z.min}–{z.max} bpm
              </span>
              <span className="ds-data-sm text-aco-texto">({rotulo})</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="ds-body-sm text-aco-texto">
        {zones.metodo === 'karvonen'
          ? `${zones.idade} anos · FC de repouso ${zones.fcRepouso} bpm`
          : `Estimativa por % da FC máxima (${zones.idade} anos). Informe sua FC de repouso para zonas Karvonen.`}
      </p>
    </section>
  )
}

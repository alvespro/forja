import { Icon } from '@/components/Icon'

import { gradientForGroup } from '@/lib/muscle-groups'
import { cn } from '@/lib/utils'

export type WorkoutCardProps = {
  nome: string
  /** Grupo dominante — define o gradiente de identidade do card. */
  grupo: string | null
  /** Texto relativo da última sessão (ex.: "há 3 dias"). */
  ultimaVez?: string | null
  /** Destaca em âmbar quando o treino está parado há muito tempo. */
  atrasado?: boolean
  duracaoMin?: number | null
  emAndamento?: boolean
  imagemUrl?: string | null
  onStart?: () => void
  className?: string
}

/**
 * Card de treino com capa (referência: Nike Training Club).
 * Nome grande sobre gradiente escuro; badges de contexto; botão de play de 48px.
 */
export function WorkoutCard({
  nome,
  grupo,
  ultimaVez,
  atrasado = false,
  duracaoMin,
  emAndamento = false,
  imagemUrl,
  onStart,
  className,
}: WorkoutCardProps) {
  return (
    <div
      className={cn(
        'relative isolate flex min-h-40 flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] border border-border p-5',
        emAndamento && 'border-brasa ds-pulse',
        className,
      )}
      style={{ background: imagemUrl ? undefined : gradientForGroup(grupo) }}
    >
      {imagemUrl && (
        <img src={imagemUrl} alt="" className="absolute inset-0 -z-10 size-full object-cover" loading="lazy" />
      )}
      {/* Overlay para legibilidade do título sobre qualquer capa */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, transparent 30%, #000000 100%)' }}
        aria-hidden="true"
      />

      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          {emAndamento && <span className="ds-label text-brasa">● Em andamento</span>}
          <h3 className="ds-h3 line-clamp-2 text-foreground">{nome}</h3>
          <div className="flex flex-wrap gap-1.5">
            {grupo && <Badge>{grupo}</Badge>}
            {ultimaVez && <Badge tone={atrasado ? 'atencao' : 'default'}>{ultimaVez}</Badge>}
            {duracaoMin != null && <Badge>~{duracaoMin} min</Badge>}
          </div>
        </div>

        {onStart && (
          <button
            type="button"
            onClick={onStart}
            aria-label={`Iniciar ${nome}`}
            className="ds-pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-brasa text-meia-noite shadow-[var(--shadow-brasa)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="play_arrow" size={20} filled />
          </button>
        )}
      </div>
    </div>
  )
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'atencao' }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 ds-data-sm backdrop-blur',
        tone === 'atencao' ? 'bg-atencao/20 text-atencao' : 'bg-black/30 text-nevoa',
      )}
    >
      {children}
    </span>
  )
}

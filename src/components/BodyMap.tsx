import { useMemo, useState, type ReactElement } from 'react'
import { RotateCcw } from 'lucide-react'

import { GROUP_LABEL, resolveGroupKeys, type MuscleKey } from '@/lib/muscle-groups'
import { cn } from '@/lib/utils'

export type MuscleState = 'inativo' | 'ativo' | 'recente' | 'descansado'
export type BodyView = 'frente' | 'costas'

const FILL: Record<MuscleState, string> = {
  inativo: 'var(--linha)',
  ativo: 'var(--brasa)',
  recente: 'var(--ok)',
  descansado: 'var(--alerta)',
}

/** Partes do corpo que não são grupos musculares treináveis (cabeça, antebraço, canela…). */
const BASE_FILL = '#16223a'

type Region = { key: MuscleKey; el: (props: { fill: string }) => ReactElement }

// Silhueta estilizada, viewBox 0 0 120 240. Formas simples e simétricas:
// legível em 40px de altura (ícone) e em tamanho grande (painel).
const FRENTE: Region[] = [
  { key: 'ombros', el: (p) => <g {...p}><ellipse cx="34" cy="50" rx="10" ry="9" /><ellipse cx="86" cy="50" rx="10" ry="9" /></g> },
  { key: 'peito', el: (p) => <g {...p}><path d="M60 50 C52 48 42 50 39 58 C38 66 45 71 60 70 Z" /><path d="M60 50 C68 48 78 50 81 58 C82 66 75 71 60 70 Z" /></g> },
  { key: 'biceps', el: (p) => <g {...p}><ellipse cx="27" cy="76" rx="6" ry="13" /><ellipse cx="93" cy="76" rx="6" ry="13" /></g> },
  { key: 'core', el: (p) => <g {...p}><rect x="49" y="74" width="22" height="36" rx="7" /></g> },
  { key: 'pernas', el: (p) => <g {...p}><ellipse cx="50" cy="152" rx="10" ry="26" /><ellipse cx="70" cy="152" rx="10" ry="26" /></g> },
]

const COSTAS: Region[] = [
  { key: 'ombros', el: (p) => <g {...p}><ellipse cx="34" cy="50" rx="10" ry="9" /><ellipse cx="86" cy="50" rx="10" ry="9" /></g> },
  { key: 'costas', el: (p) => <g {...p}><path d="M44 45 L76 45 L73 96 Q60 105 47 96 Z" /></g> },
  { key: 'triceps', el: (p) => <g {...p}><ellipse cx="27" cy="76" rx="6" ry="13" /><ellipse cx="93" cy="76" rx="6" ry="13" /></g> },
  { key: 'gluteo', el: (p) => <g {...p}><ellipse cx="51" cy="118" rx="10" ry="9" /><ellipse cx="69" cy="118" rx="10" ry="9" /></g> },
  { key: 'pernas', el: (p) => <g {...p}><ellipse cx="50" cy="152" rx="10" ry="23" /><ellipse cx="70" cy="152" rx="10" ry="23" /></g> },
  { key: 'panturrilha', el: (p) => <g {...p}><ellipse cx="50" cy="196" rx="7" ry="16" /><ellipse cx="70" cy="196" rx="7" ry="16" /></g> },
]

function BaseSilhouette({ vista }: { vista: BodyView }) {
  return (
    <g fill={BASE_FILL}>
      <ellipse cx="60" cy="20" rx="12" ry="14" />
      <rect x="54" y="31" width="12" height="10" rx="3" />
      {/* tronco */}
      <path d="M40 42 L80 42 L78 112 Q60 122 42 112 Z" />
      {/* antebraços e mãos */}
      <ellipse cx="23" cy="103" rx="5" ry="14" />
      <ellipse cx="97" cy="103" rx="5" ry="14" />
      {/* quadril */}
      <ellipse cx="60" cy="120" rx="20" ry="10" />
      {/* canelas (frente) ou base das panturrilhas (costas) */}
      <ellipse cx="50" cy="198" rx="6" ry="20" />
      <ellipse cx="70" cy="198" rx="6" ry="20" />
      <ellipse cx="49" cy="224" rx="7" ry="4" />
      <ellipse cx="71" cy="224" rx="7" ry="4" />
      {vista === 'costas' && <rect x="57" y="44" width="6" height="60" rx="3" fill="#0b1220" opacity="0.35" />}
    </g>
  )
}

const VIEW_OF: Record<MuscleKey, BodyView> = {
  peito: 'frente',
  biceps: 'frente',
  core: 'frente',
  ombros: 'frente',
  pernas: 'frente',
  costas: 'costas',
  triceps: 'costas',
  gluteo: 'costas',
  panturrilha: 'costas',
}

const SIZE = {
  icon: 'h-12',
  tile: 'h-16',
  md: 'h-44',
  lg: 'h-64',
} as const

export type BodyMapProps = {
  /** Estado por grupo. Grupos ausentes ficam inativos. */
  estados?: Partial<Record<MuscleKey, MuscleState>>
  /** Atalho do spec: nomes livres ("peito", "Costas e Bíceps") marcados como ativos. */
  musculosAtivos?: string[]
  /** Vista fixa. Padrão: a que tem mais grupos destacados. */
  vista?: BodyView
  size?: keyof typeof SIZE
  /** Mostra botão de girar frente/costas e legenda de descansados. */
  interativo?: boolean
  onSelect?: (key: MuscleKey) => void
  className?: string
}

/**
 * Mapa corporal (referência: FitFolio). Inativo escuro, ativo brasa, trabalhado
 * recentemente verde, descansado há mais de 7 dias em vermelho-tijolo.
 * Os grupos destacados acendem em sequência (stagger de 80ms).
 */
export function BodyMap({
  estados,
  musculosAtivos,
  vista,
  size = 'md',
  interativo = false,
  onSelect,
  className,
}: BodyMapProps) {
  const mapa = useMemo(() => {
    const m: Partial<Record<MuscleKey, MuscleState>> = { ...estados }
    for (const nome of musculosAtivos ?? []) for (const k of resolveGroupKeys(nome)) m[k] = 'ativo'
    return m
  }, [estados, musculosAtivos])

  const vistaAuto = useMemo<BodyView>(() => {
    const destacados = (Object.keys(mapa) as MuscleKey[]).filter((k) => mapa[k] && mapa[k] !== 'inativo')
    const costas = destacados.filter((k) => VIEW_OF[k] === 'costas').length
    return costas > destacados.length - costas ? 'costas' : 'frente'
  }, [mapa])

  const [vistaManual, setVistaManual] = useState<BodyView | null>(null)
  const vistaAtual = vista ?? vistaManual ?? vistaAuto
  const regioes = vistaAtual === 'frente' ? FRENTE : COSTAS
  const descansados = (Object.keys(mapa) as MuscleKey[]).filter((k) => mapa[k] === 'descansado')

  let ordemAcesa = 0

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative">
        <svg
          viewBox="0 0 120 240"
          className={cn(SIZE[size], 'w-auto')}
          role="img"
          aria-label={`Mapa corporal (${vistaAtual})`}
        >
          <BaseSilhouette vista={vistaAtual} />
          {regioes.map(({ key, el }) => {
            const estado = mapa[key] ?? 'inativo'
            const aceso = estado !== 'inativo'
            const delay = aceso ? ordemAcesa++ * 80 : 0
            const props = {
              fill: FILL[estado],
              style: aceso ? { animation: `ds-muscle-on var(--dur-normal) var(--spring-smooth) ${delay}ms both` } : undefined,
              className: onSelect ? 'cursor-pointer' : undefined,
              onClick: onSelect ? () => onSelect(key) : undefined,
            }
            return (
              <g key={`${vistaAtual}-${key}`} {...props}>
                <title>{`${GROUP_LABEL[key]}${aceso ? ` — ${estado}` : ''}`}</title>
                {el({ fill: FILL[estado] })}
              </g>
            )
          })}
        </svg>

        {interativo && !vista && (
          <button
            type="button"
            onClick={() => setVistaManual(vistaAtual === 'frente' ? 'costas' : 'frente')}
            aria-label={`Ver ${vistaAtual === 'frente' ? 'costas' : 'frente'}`}
            className="ds-pressable absolute -right-10 bottom-0 flex size-9 items-center justify-center rounded-full border border-linha bg-aco text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {interativo && descansados.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {descansados.map((k) => (
            <span key={k} className="rounded-full bg-alerta/15 px-2 py-0.5 ds-data-sm text-alerta">
              ⚠️ {GROUP_LABEL[k]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

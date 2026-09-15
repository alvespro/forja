import { cn } from '@/lib/utils'

// Um batimento a cada 60 unidades: linha de base, onda P, complexo QRS, onda T.
const BATIMENTO = 'l12 0 l4 -4 l4 4 l6 0 l3 6 l5 -26 l5 32 l4 -12 l6 0 l5 -6 l6 6'
const LARGURA = 240
// Comprimento do traço (4 batimentos ≈ 520); o keyframe ecgDraw anima o offset de +530 a −530,
// então o brilho entra antes do início e sai depois do fim.
const COMPRIMENTO_TRACO = 530

/** Linha de ECG decorativa (inspirada no DeerFlow Medical Monitor): o traço percorre da esquerda para a direita. */
export function EcgLine({ className, duracao = 2.4 }: { className?: string; duracao?: number }) {
  const d = `M0 24 ${Array.from({ length: 4 }, () => BATIMENTO).join(' ')}`
  return (
    <svg
      viewBox={`0 0 ${LARGURA} 40`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('block h-8 w-full overflow-visible', className)}
    >
      <path d={d} fill="none" stroke="var(--linha)" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d={d}
        fill="none"
        stroke="var(--brasa)"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: `${COMPRIMENTO_TRACO / 3} ${COMPRIMENTO_TRACO * 2}`,
          animation: `ecgDraw ${duracao}s linear infinite`,
        }}
      />
    </svg>
  )
}

import { Icon } from '@/components/Icon'

import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number | null
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly, size = 'md' }: StarRatingProps) {
  const iconSize = size === 'sm' ? 14 : 20
  const nota = value ?? 0

  // Só leitura: uma imagem com texto alternativo, não 5 botões desativados.
  if (readonly) {
    return (
      <div className="flex gap-0.5" role="img" aria-label={`Nota ${nota} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} name="star" size={iconSize} filled={nota >= n} className={nota >= n ? 'text-brasa' : 'text-cinza2'} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex" role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={nota === n}
          aria-label={`${n} de 5`}
          onClick={() => onChange?.(n)}
          // Área de toque de 44px com a estrela no centro.
          className={cn(
            'flex size-11 items-center justify-center rounded-full transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-ring',
            'hover:scale-110',
          )}
        >
          <Icon name="star" size={iconSize + 4} filled={nota >= n} className={nota >= n ? 'text-brasa' : 'text-cinza2'} />
        </button>
      ))}
    </div>
  )
}

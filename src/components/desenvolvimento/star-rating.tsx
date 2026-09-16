import { Icon } from '@/components/Icon'

type StarRatingProps = {
  value: number | null
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

const ICON_SIZE = { sm: 14, md: 20 } as const

export function StarRating({ value, onChange, readonly, size = 'md' }: StarRatingProps) {
  const nota = value ?? 0
  const star = (n: number, px: number) => (
    <Icon name="star" size={px} filled={nota >= n} className={nota >= n ? 'text-brasa' : 'text-cinza2'} />
  )

  // Só leitura: uma imagem com texto alternativo, não 5 botões desativados.
  if (readonly) {
    return (
      <div className="flex gap-0.5" role="img" aria-label={`Nota ${nota} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{star(n, ICON_SIZE[size])}</span>
        ))}
      </div>
    )
  }

  // Área de toque de 44px com a estrela no centro; o foco usa o anel global (:focus-visible).
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
          className="flex size-11 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-90"
        >
          {star(n, ICON_SIZE[size] + 4)}
        </button>
      ))}
    </div>
  )
}

import { Icon } from '@/components/Icon'

import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number | null
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly, size = 'md' }: StarRatingProps) {
  const starSize = size === 'sm' ? 'size-3.5' : 'size-5'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={cn('outline-none', !readonly && 'cursor-pointer hover:scale-110 transition-transform')}
        >
          <Icon name="star" size={24} className={cn(
              starSize,
              (value ?? 0) >= n ? 'fill-brasa stroke-brasa' : 'fill-transparent stroke-border',
            )} />
        </button>
      ))}
    </div>
  )
}

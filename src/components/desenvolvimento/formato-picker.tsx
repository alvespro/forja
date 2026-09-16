import { Icon } from '@/components/Icon'
import { COURSE_FORMATOS } from '@/lib/course-formato'
import { cn } from '@/lib/utils'
import type { CourseFormato } from '@/types/database'

type FormatoPickerProps = {
  value: CourseFormato | null
  onChange: (formato: CourseFormato) => void
}

/** Escolha do formato do curso: chips com ícone, um só selecionado (radiogroup). */
export function FormatoPicker({ value, onChange }: FormatoPickerProps) {
  return (
    <div role="radiogroup" aria-label="Formato do curso" className="flex flex-wrap gap-2">
      {COURSE_FORMATOS.map((f) => {
        const ativo = value === f.value
        return (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={ativo}
            title={f.dica}
            onClick={() => onChange(f.value)}
            className={cn(
              'flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
              ativo ? 'border-brasa bg-brasa/15 text-foreground' : 'border-linha text-aco-texto hover:text-foreground',
            )}
          >
            <Icon name={f.icon} size={16} filled={ativo} className={ativo ? 'text-brasa' : undefined} />
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

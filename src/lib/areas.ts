import type { GoalArea } from '@/types/database'

// Seção 3, decisão 1 do SPEC: identificadores em inglês snake_case;
// rótulos pt-BR vivem só na UI, via este mapa.
export const AREA_OPTIONS: { value: GoalArea; label: string }[] = [
  { value: 'fisico', label: 'Físico' },
  { value: 'mental', label: 'Mental' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'vinculos', label: 'Vínculos' },
  { value: 'negocio', label: 'Negócio' },
]

export const AREA_LABELS: Record<GoalArea, string> = AREA_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {} as Record<GoalArea, string>,
)

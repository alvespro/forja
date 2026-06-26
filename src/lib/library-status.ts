import type { LibraryStatus } from '@/types/database'

// Seção 3, decisão 1 do SPEC: identificadores em inglês snake_case;
// rótulos pt-BR vivem só na UI, via este mapa.
export const LIBRARY_STATUS_OPTIONS: { value: LibraryStatus; label: string }[] = [
  { value: 'quero_ler', label: 'Quero ler' },
  { value: 'lendo', label: 'Lendo' },
  { value: 'lido', label: 'Lido' },
]

export const LIBRARY_STATUS_LABELS: Record<LibraryStatus, string> = LIBRARY_STATUS_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {} as Record<LibraryStatus, string>,
)

export const LIBRARY_STATUS_DOT_CLASS: Record<LibraryStatus, string> = {
  quero_ler: 'bg-aco-texto',
  lendo: 'bg-atencao',
  lido: 'bg-ok',
}

export const LIBRARY_STATUS_TEXT_CLASS: Record<LibraryStatus, string> = {
  quero_ler: 'text-aco-texto',
  lendo: 'text-atencao',
  lido: 'text-ok',
}

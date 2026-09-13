// Ícones e ordenação canônica dos grupos musculares para a navegação de treino.

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const ICONS: Record<string, string> = {
  peito: '🫁',
  costas: '🔙',
  pernas: '🦵',
  perna: '🦵',
  biceps: '💪',
  triceps: '🦾',
  ombros: '🎯',
  ombro: '🎯',
  gluteo: '🍑',
  gluteos: '🍑',
  core: '🧱',
  abdomen: '🧱',
  abdome: '🧱',
  panturrilha: '🐮',
  panturrilhas: '🐮',
}

/** Rótulo usado quando o exercício não tem grupo muscular definido. */
export const SEM_GRUPO = 'Outros'

/** Ordem canônica exibida na grade (grupos presentes nos dados vêm primeiro nesta ordem). */
export const MUSCLE_GROUP_ORDER = [
  'Peito',
  'Costas',
  'Pernas',
  'Bíceps',
  'Tríceps',
  'Ombros',
  'Glúteo',
  'Core',
  'Panturrilha',
]

export function iconForGroup(grupo: string | null | undefined): string {
  if (!grupo) return '🏋️'
  return ICONS[norm(grupo)] ?? '🏋️'
}

/** Índice de ordenação: grupos canônicos primeiro (na ordem definida), depois alfabético, "Outros" por último. */
export function groupSortIndex(grupo: string): number {
  if (grupo === SEM_GRUPO) return MUSCLE_GROUP_ORDER.length + 1000
  const idx = MUSCLE_GROUP_ORDER.findIndex((g) => norm(g) === norm(grupo))
  return idx === -1 ? MUSCLE_GROUP_ORDER.length : idx
}

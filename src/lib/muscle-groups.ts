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

const GROUP_COLORS: Record<string, string> = {
  peito: '#1a3a5c',
  costas: '#1a4a3a',
  pernas: '#3a2a1a',
  perna: '#3a2a1a',
  biceps: '#2a1a4a',
  triceps: '#4a2a1a',
  ombros: '#1a2a4a',
  ombro: '#1a2a4a',
  gluteo: '#3a1a3a',
  gluteos: '#3a1a3a',
  core: '#2a3a1a',
  abdomen: '#2a3a1a',
  abdome: '#2a3a1a',
  panturrilha: '#1a3a4a',
  panturrilhas: '#1a3a4a',
}

/** Cor-base de identidade do grupo muscular (fundo dos cards). */
export function colorForGroup(grupo: string | null | undefined): string {
  if (!grupo) return '#1b2a42'
  return GROUP_COLORS[norm(grupo)] ?? '#1b2a42'
}

/** Gradiente de card por grupo: cor de identidade → meia-noite. */
export function gradientForGroup(grupo: string | null | undefined): string {
  return `linear-gradient(160deg, ${colorForGroup(grupo)} 0%, #0b1220 100%)`
}

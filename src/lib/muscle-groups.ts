import type { IconName } from '@/lib/icons'

// Grupos musculares: reconhecimento a partir de texto livre, ícones, cores e ordenação.

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export type MuscleKey =
  | 'peito'
  | 'costas'
  | 'pernas'
  | 'biceps'
  | 'triceps'
  | 'ombros'
  | 'gluteo'
  | 'core'
  | 'panturrilha'

export const MUSCLE_KEYS: MuscleKey[] = [
  'peito',
  'costas',
  'pernas',
  'biceps',
  'triceps',
  'ombros',
  'gluteo',
  'core',
  'panturrilha',
]

export const GROUP_LABEL: Record<MuscleKey, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas: 'Pernas',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  ombros: 'Ombros',
  gluteo: 'Glúteo',
  core: 'Core',
  panturrilha: 'Panturrilha',
}

/**
 * Termos (já normalizados, sem acento) que indicam cada grupo. Os treinos usam
 * nomes compostos e sinônimos — "Costas e Bíceps", "Membros Inferiores" — então
 * a comparação é por palavra contida, não por igualdade.
 */
const ALIASES: Record<MuscleKey, string[]> = {
  peito: ['peito', 'peitoral', 'supino'],
  costas: ['costas', 'dorsal', 'dorso', 'trapezio', 'lombar', 'remada'],
  pernas: ['pernas', 'perna', 'membros inferiores', 'inferiores', 'quadriceps', 'posterior', 'coxa', 'agachamento'],
  biceps: ['biceps', 'rosca'],
  triceps: ['triceps'],
  ombros: ['ombros', 'ombro', 'deltoide', 'deltoides'],
  gluteo: ['gluteos', 'gluteo'],
  core: ['core', 'abdomen', 'abdome', 'abdominal', 'abdominais', 'prancha'],
  panturrilha: ['panturrilhas', 'panturrilha'],
}

/**
 * Grupos presentes num texto livre, na ordem em que aparecem.
 * resolveGroupKeys('Costas e Bíceps') → ['costas', 'biceps']
 */
export function resolveGroupKeys(texto: string | null | undefined): MuscleKey[] {
  if (!texto) return []
  const t = ` ${norm(texto)} `
  const encontrados: { key: MuscleKey; pos: number }[] = []
  for (const key of MUSCLE_KEYS) {
    let melhor = -1
    for (const alias of ALIASES[key]) {
      const pos = t.search(new RegExp(`[^a-z]${alias}[^a-z]`))
      if (pos !== -1 && (melhor === -1 || pos < melhor)) melhor = pos
    }
    if (melhor !== -1) encontrados.push({ key, pos: melhor })
  }
  return encontrados.sort((a, b) => a.pos - b.pos).map((e) => e.key)
}

/** Grupo dominante de um texto: o primeiro mencionado. */
export function primaryGroupKey(texto: string | null | undefined): MuscleKey | null {
  return resolveGroupKeys(texto)[0] ?? null
}

const ICONS: Record<MuscleKey, string> = {
  peito: '🫁',
  costas: '🔙',
  pernas: '🦵',
  biceps: '💪',
  triceps: '🦾',
  ombros: '🎯',
  gluteo: '🍑',
  core: '🧱',
  panturrilha: '🐮',
}

// Material Symbols por grupo: não há ícone de músculo, então cada um usa o movimento que o representa.
const MATERIAL_ICONS: Record<MuscleKey, IconName> = {
  peito: 'fitness_center',
  costas: 'rowing',
  pernas: 'directions_walk',
  biceps: 'sports_mma',
  triceps: 'front_hand',
  ombros: 'accessibility_new',
  gluteo: 'airline_seat_recline_extra',
  core: 'self_improvement',
  panturrilha: 'directions_run',
}

/** Ícone Material do grupo (grupos fora do mapa, como antebraço e pescoço, usam o genérico). */
export function materialIconForGroup(grupo: string | null | undefined): IconName {
  const texto = (grupo ?? '').toLowerCase()
  if (texto.includes('antebra')) return 'back_hand'
  const key = primaryGroupKey(grupo)
  return key ? MATERIAL_ICONS[key] : 'sports_gymnastics'
}

/** Rótulo usado quando o exercício não tem grupo muscular definido. */
export const SEM_GRUPO = 'Outros'

/** Ordem canônica exibida na grade (grupos presentes nos dados vêm primeiro nesta ordem). */
export const MUSCLE_GROUP_ORDER = MUSCLE_KEYS.map((k) => GROUP_LABEL[k])

export function iconForGroup(grupo: string | null | undefined): string {
  const key = primaryGroupKey(grupo)
  return key ? ICONS[key] : '🏋️'
}

/** Índice de ordenação: grupos canônicos primeiro (na ordem definida), depois alfabético, "Outros" por último. */
export function groupSortIndex(grupo: string): number {
  if (grupo === SEM_GRUPO) return MUSCLE_GROUP_ORDER.length + 1000
  const key = primaryGroupKey(grupo)
  return key ? MUSCLE_KEYS.indexOf(key) : MUSCLE_GROUP_ORDER.length
}

const GROUP_COLORS: Record<MuscleKey, string> = {
  // Tons escuros quase neutros: identidade discreta sobre o Cod Gray, sem competir com a brasa.
  peito: '#2e1a13',
  costas: '#1c2420',
  pernas: '#2b2216',
  biceps: '#231d28',
  triceps: '#2e1c17',
  ombros: '#1b2027',
  gluteo: '#2a1a21',
  core: '#20251b',
  panturrilha: '#1a2326',
}

/** Cor-base de identidade do grupo muscular (fundo dos cards). */
export function colorForGroup(grupo: string | null | undefined): string {
  const key = primaryGroupKey(grupo)
  return key ? GROUP_COLORS[key] : '#1d1d1d'
}

/** Gradiente de card por grupo: cor de identidade → meia-noite. */
export function gradientForGroup(grupo: string | null | undefined): string {
  return `linear-gradient(160deg, ${colorForGroup(grupo)} 0%, #000000 100%)`
}

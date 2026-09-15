import type { DevAreaCategoria } from '@/types/database'

export const AREA_COR: Record<DevAreaCategoria, string> = {
  mentalidade: '#FC4C13',
  interpessoal: '#4CAF7D',
  soft_skill: '#A7A7A7',
  hard_skill: '#F9F9F9',
}

export const AREA_LABEL: Record<DevAreaCategoria, string> = {
  mentalidade: 'Mentalidade',
  interpessoal: 'Interpessoal',
  soft_skill: 'Soft Skills',
  hard_skill: 'Hard Skills',
}

export const AREA_EMOJI: Record<DevAreaCategoria, string> = {
  mentalidade: '🧠',
  interpessoal: '🤝',
  soft_skill: '⚙️',
  hard_skill: '📊',
}

// Tailwind classes aproximadas às cores (usando opacidade inline não funciona bem com Tailwind,
// então retornamos style objects para uso direto)
export function areaBgStyle(categoria: string, opacity = 0.12): Record<string, string> {
  const cor = AREA_COR[categoria as DevAreaCategoria] ?? '#6B7280'
  return {
    backgroundColor: hexToRgba(cor, opacity),
    borderColor: hexToRgba(cor, 0.4),
  }
}

export function areaTextColor(categoria: string): string {
  return AREA_COR[categoria as DevAreaCategoria] ?? '#6B7280'
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const STATUS_LABEL: Record<string, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
  quero_ver: 'Quero ver',
  assistindo: 'Assistindo',
  assistido: 'Assistido',
}

export const MEDIA_TIPO_LABEL: Record<string, string> = {
  filme: 'Filme',
  documentario: 'Documentário',
  serie: 'Série',
  podcast: 'Podcast',
  video: 'Vídeo',
}

export const MEDIA_TIPO_EMOJI: Record<string, string> = {
  filme: '🎬',
  documentario: '🎥',
  serie: '📺',
  podcast: '🎙️',
  video: '▶️',
}

export const SUGGESTION_TIPO_EMOJI: Record<string, string> = {
  livro: '📚',
  curso: '🎓',
  filme: '🎬',
  documentario: '🎥',
  podcast: '🎙️',
  video: '▶️',
}

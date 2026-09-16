import type { IconName } from '@/lib/icons'
import type { CourseFormato } from '@/types/database'

export const COURSE_FORMATOS: { value: CourseFormato; label: string; icon: IconName; dica: string }[] = [
  { value: 'leitura', label: 'Leitura', icon: 'menu_book', dica: 'Apostila, artigo ou material escrito' },
  { value: 'video_aula', label: 'Video-aula', icon: 'play_circle', dica: 'Aulas gravadas (link opcional)' },
  { value: 'modulos', label: 'Capítulos/Módulos', icon: 'view_list', dica: 'Progresso pelos módulos concluídos' },
  { value: 'link', label: 'Link', icon: 'link', dica: 'Conteúdo aberto por um endereço' },
  { value: 'analise_area', label: 'Análise de área', icon: 'query_stats', dica: 'Estudo focado numa área de desenvolvimento' },
]

export function formatoInfo(formato: CourseFormato | null | undefined) {
  return COURSE_FORMATOS.find((f) => f.value === formato) ?? null
}

/** Formatos em que o endereço do conteúdo faz sentido no cadastro. */
export function pedeUrl(formato: CourseFormato | null | undefined): boolean {
  return formato === 'link' || formato === 'video_aula'
}

/** % de módulos concluídos; null quando o total ainda não foi informado. */
export function progressoModulos(feitos: number | null | undefined, total: number | null | undefined): number | null {
  if (!total || total <= 0) return null
  const pct = Math.round(((feitos ?? 0) / total) * 100)
  return Math.min(100, Math.max(0, pct))
}

/** Aceita "youtube.com/…" sem protocolo; vazio vira null. */
export function normalizarUrl(valor: string): string | null {
  const url = valor.trim()
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

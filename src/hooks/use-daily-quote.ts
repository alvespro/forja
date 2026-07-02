import { useMemo } from 'react'

import { useCourses } from '@/hooks/use-courses'
import { useDevMedia } from '@/hooks/use-dev-media'
import { useReadings } from '@/hooks/use-readings'
import { pickQuoteOfDay, type DailyQuote } from '@/lib/daily-quote'

const EMOJI_MEDIA: Record<string, string> = {
  filme: '🎬',
  documentario: '🎬',
  serie: '📺',
  podcast: '🎙️',
  video: '▶️',
}

/**
 * Frase do dia combinando frases FORJA com o acervo pessoal:
 * citações favoritas e aprendizados salvos em livros, cursos e mídias.
 */
export function useDailyQuote(dateStr: string): DailyQuote {
  const readings = useReadings()
  const courses = useCourses()
  const media = useDevMedia()

  const userQuotes = useMemo(() => {
    const pool: DailyQuote[] = []

    for (const r of readings.data ?? []) {
      const fonte = r.autor ? `${r.titulo} — ${r.autor}` : r.titulo
      if (r.citacao_favorita?.trim()) {
        pool.push({ texto: r.citacao_favorita.trim(), fonte, emoji: '📖' })
      }
      for (const ap of [r.aprendizado_1, r.aprendizado_2, r.aprendizado_3]) {
        if (ap?.trim()) pool.push({ texto: ap.trim(), fonte, emoji: '📖' })
      }
    }

    for (const c of courses.data ?? []) {
      if (c.citacao_favorita?.trim()) {
        pool.push({ texto: c.citacao_favorita.trim(), fonte: c.titulo, emoji: '🎓' })
      }
      for (const ap of [c.aprendizado_1, c.aprendizado_2, c.aprendizado_3]) {
        if (ap?.trim()) pool.push({ texto: ap.trim(), fonte: c.titulo, emoji: '🎓' })
      }
    }

    for (const m of media.data ?? []) {
      const emoji = EMOJI_MEDIA[m.tipo ?? ''] ?? '🎬'
      for (const ap of [m.aprendizado_1, m.aprendizado_2, m.aprendizado_3]) {
        if (ap?.trim()) pool.push({ texto: ap.trim(), fonte: m.titulo, emoji })
      }
    }

    // Ordem estável para a rotação determinística não embaralhar entre renders
    pool.sort((a, b) => a.texto.localeCompare(b.texto))
    return pool
  }, [readings.data, courses.data, media.data])

  return useMemo(() => pickQuoteOfDay(userQuotes, dateStr), [userQuotes, dateStr])
}

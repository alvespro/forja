import { diffInDays } from '@/lib/date'

/**
 * Revisão espaçada dos aprendizados (7/30/90 dias após a conclusão).
 * Sem isto, o 3-2-1 é escrito uma vez e nunca mais relido deliberadamente.
 * Stateless por design: cada marco tem janela de 3 dias de exibição —
 * aparece, cobra e sai, sem precisar de tabela de "revisado".
 */

export const REVIEW_MILESTONES = [7, 30, 90] as const

const WINDOW_DAYS = 3

export type Reviewable = {
  titulo: string
  data_conclusao: string | null
  aprendizado_1: string | null
  aprendizado_2: string | null
  aprendizado_3: string | null
  acao_1: string | null
}

export type DueReview<T extends Reviewable> = {
  item: T
  marco: (typeof REVIEW_MILESTONES)[number]
  diasDesdeConclusao: number
}

export function dueForReview<T extends Reviewable>(items: T[], today: string): DueReview<T>[] {
  const due: DueReview<T>[] = []
  for (const item of items) {
    if (!item.data_conclusao) continue
    // Sem nenhum aprendizado registrado não há o que revisar
    if (!item.aprendizado_1 && !item.aprendizado_2 && !item.aprendizado_3) continue

    const dias = diffInDays(today, item.data_conclusao)
    for (const marco of REVIEW_MILESTONES) {
      if (dias >= marco && dias < marco + WINDOW_DAYS) {
        due.push({ item, marco, diasDesdeConclusao: dias })
        break
      }
    }
  }
  return due.sort((a, b) => a.marco - b.marco)
}

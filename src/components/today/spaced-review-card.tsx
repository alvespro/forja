import { useNavigate } from 'react-router-dom'
import { BookOpenCheck } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { useCourses } from '@/hooks/use-courses'
import { useReadings } from '@/hooks/use-readings'
import { todayInSaoPaulo } from '@/lib/date'
import { dueForReview } from '@/lib/spaced-review'

/**
 * Revisão espaçada (7/30/90 dias): ressurface os aprendizados 3-2-1 de
 * livros/cursos concluídos com a pergunta que importa — ainda aplica isso?
 */
export function SpacedReviewCard() {
  const readings = useReadings()
  const courses = useCourses()
  const navigate = useNavigate()
  const today = todayInSaoPaulo()

  const dueLivros = dueForReview(
    (readings.data ?? []).map((r) => ({ ...r, __tipo: 'livro' as const })),
    today,
  )
  const dueCursos = dueForReview(
    (courses.data ?? []).map((c) => ({ ...c, __tipo: 'curso' as const })),
    today,
  )
  const due = [...dueLivros, ...dueCursos].slice(0, 2)

  if (due.length === 0) return null

  return (
    <Card className="border-purple-700/30 bg-purple-950/10">
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="size-4 text-purple-400" />
          <span className="text-sm font-semibold text-foreground">🔁 Revisão de hoje</span>
        </div>

        {due.map(({ item, marco }) => {
          const aprendizados = [item.aprendizado_1, item.aprendizado_2, item.aprendizado_3].filter(Boolean)
          const isLivro = item.__tipo === 'livro'
          return (
            <button
              key={`${item.__tipo}-${item.titulo}`}
              type="button"
              onClick={() =>
                navigate(isLivro ? `/biblioteca/livro/${item.id}` : `/desenvolvimento/curso/${item.id}`)
              }
              className="flex flex-col gap-1.5 rounded-lg border border-border/30 bg-card/40 p-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {isLivro ? '📖' : '🎓'} {item.titulo}
                </span>
                <span className="shrink-0 rounded-full bg-purple-900/50 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                  {marco} dias
                </span>
              </div>
              <ul className="flex flex-col gap-0.5">
                {aprendizados.slice(0, 3).map((a, i) => (
                  <li key={i} className="truncate text-xs text-aco-texto">
                    • {a}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] font-medium text-purple-300/90">
                Você ainda aplica isso?{' '}
                {item.acao_1 ? `A ação era: "${item.acao_1}"` : 'Reveja o 3-2-1 →'}
              </p>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

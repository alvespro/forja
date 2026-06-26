import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { CourseCard } from '@/components/library/course-card'
import { CourseForm } from '@/components/library/course-form'
import { ReadingCard } from '@/components/library/reading-card'
import { ReadingForm } from '@/components/library/reading-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourses, useCreateCourse } from '@/hooks/use-courses'
import { groupReadingsByTrilha, useCreateReading, useReadings } from '@/hooks/use-readings'
import { cn } from '@/lib/utils'

type LibraryTab = 'leituras' | 'cursos'

export function LibraryPage() {
  const [tab, setTab] = useState<LibraryTab>('leituras')

  const readings = useReadings()
  const courses = useCourses()
  const createReading = useCreateReading()
  const createCourse = useCreateCourse()

  const [isAddingReading, setIsAddingReading] = useState(false)
  const [isAddingCourse, setIsAddingCourse] = useState(false)

  const readingsByTrilha = useMemo(() => groupReadingsByTrilha(readings.data), [readings.data])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Biblioteca</h1>
        <p className="text-sm text-aco-texto">Leituras por trilha com notas 3-2-1 e cursos.</p>
      </div>

      <div className="flex gap-1 border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'leituras'}
          onClick={() => setTab('leituras')}
          className={cn(
            'rounded-t px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            tab === 'leituras' ? 'border-b-2 border-brasa text-foreground' : 'text-aco-texto hover:text-foreground',
          )}
        >
          Leituras
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cursos'}
          onClick={() => setTab('cursos')}
          className={cn(
            'rounded-t px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            tab === 'cursos' ? 'border-b-2 border-brasa text-foreground' : 'text-aco-texto hover:text-foreground',
          )}
        >
          Cursos
        </button>
      </div>

      {tab === 'leituras' ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            {!isAddingReading && (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingReading(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                Nova leitura
              </Button>
            )}
          </div>

          {isAddingReading && (
            <ReadingForm
              onSubmit={(values) =>
                createReading.mutate(values, { onSuccess: () => setIsAddingReading(false) })
              }
              onCancel={() => setIsAddingReading(false)}
              isSubmitting={createReading.isPending}
            />
          )}

          {readings.isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : readings.isError ? (
            <ErrorState
              message="Não foi possível carregar as leituras."
              onRetry={() => readings.refetch()}
            />
          ) : readingsByTrilha.size === 0 ? (
            <EmptyState message="Nenhuma leitura cadastrada ainda." />
          ) : (
            Array.from(readingsByTrilha.entries()).map(([trilha, items]) => (
              <section key={trilha} className="flex flex-col gap-3">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-aco-texto">
                  {trilha}
                </h2>
                {items.map((reading) => (
                  <ReadingCard key={reading.id} reading={reading} />
                ))}
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            {!isAddingCourse && (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingCourse(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                Novo curso
              </Button>
            )}
          </div>

          {isAddingCourse && (
            <CourseForm
              onSubmit={(values) =>
                createCourse.mutate(values, { onSuccess: () => setIsAddingCourse(false) })
              }
              onCancel={() => setIsAddingCourse(false)}
              isSubmitting={createCourse.isPending}
            />
          )}

          {courses.isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : courses.isError ? (
            <ErrorState message="Não foi possível carregar os cursos." onRetry={() => courses.refetch()} />
          ) : !courses.data || courses.data.length === 0 ? (
            <EmptyState message="Nenhum curso cadastrado ainda." />
          ) : (
            courses.data.map((course) => <CourseCard key={course.id} course={course} />)
          )}
        </div>
      )}
    </div>
  )
}

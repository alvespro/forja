import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { CourseForm } from '@/components/library/course-form'
import { useDeleteCourse, useUpdateCourse } from '@/hooks/use-courses'
import { LIBRARY_STATUS_DOT_CLASS, LIBRARY_STATUS_OPTIONS } from '@/lib/library-status'
import { cn } from '@/lib/utils'
import type { Course, LibraryStatus } from '@/types/database'

type CourseCardProps = {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  function handleStatusChange(status: LibraryStatus) {
    updateCourse.mutate({ id: course.id, values: { status } })
  }

  function handleDelete() {
    if (!window.confirm(`Excluir o curso "${course.titulo}"? Essa ação não pode ser desfeita.`)) return
    deleteCourse.mutate(course.id)
  }

  if (isEditing) {
    return (
      <CourseForm
        course={course}
        onSubmit={(values) =>
          updateCourse.mutate({ id: course.id, values }, { onSuccess: () => setIsEditing(false) })
        }
        onCancel={() => setIsEditing(false)}
        isSubmitting={updateCourse.isPending}
      />
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{course.titulo}</span>
            {course.provedor && <span className="text-xs text-aco-texto">{course.provedor}</span>}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Select
              aria-label={`Status de ${course.titulo}`}
              value={course.status}
              onChange={(event) => handleStatusChange(event.target.value as LibraryStatus)}
              className="w-32"
            >
              {LIBRARY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <span className={cn('size-2 rounded-full', LIBRARY_STATUS_DOT_CLASS[course.status])} aria-hidden="true" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar curso ${course.titulo}`}
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir curso ${course.titulo}`}
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Progress value={course.progresso} className="flex-1" />
          <span className="w-10 shrink-0 text-right font-mono text-xs text-aco-texto">{course.progresso}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

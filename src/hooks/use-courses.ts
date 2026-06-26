import { createCrudHooks } from '@/lib/crud-factory'
import type { Course, LibraryStatus } from '@/types/database'

export type CourseInput = {
  provedor: string | null
  titulo: string
  status: LibraryStatus
  progresso: number
}

const coursesCrud = createCrudHooks<Course, CourseInput>({
  table: 'courses',
  queryKey: 'courses',
  orderBy: { column: 'titulo', ascending: true },
})

export const useCourses = coursesCrud.useList
export const useCreateCourse = coursesCrud.useCreate
export const useUpdateCourse = coursesCrud.useUpdate
export const useDeleteCourse = coursesCrud.useDelete

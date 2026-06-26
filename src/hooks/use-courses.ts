import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Course, LibraryStatus } from '@/types/database'

import { useAuth } from './use-auth'

export function useCourses() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('titulo', { ascending: true })
      if (error) throw error
      return data as Course[]
    },
    enabled: !!user,
  })
}

export type CourseInput = {
  provedor: string | null
  titulo: string
  status: LibraryStatus
  progresso: number
}

export function useCreateCourse() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: CourseInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('courses').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<CourseInput> }) => {
      const { error } = await supabase.from('courses').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  })
}

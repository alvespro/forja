import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Course, CourseFormato, LibraryStatus } from '@/types/database'

import { useAuth } from './use-auth'

export type CourseInput = {
  dev_area_id?: string | null
  provedor?: string | null
  titulo: string
  status?: LibraryStatus
  progresso?: number | null
  nota_geral?: number | null
  plataforma?: string | null
  carga_horaria?: number | null
  certificado_url?: string | null
  citacao_favorita?: string | null
  data_inicio?: string | null
  data_conclusao?: string | null
  habilidades_desenvolvidas?: string[] | null
  aprendizado_1?: string | null
  aprendizado_2?: string | null
  aprendizado_3?: string | null
  aplicacao_1?: string | null
  aplicacao_2?: string | null
  acao_1?: string | null
  resumo?: string | null
  formato?: CourseFormato | null
  url?: string | null
  modulos_total?: number | null
  modulos_feitos?: number | null
}

export function useCourses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('titulo', { ascending: true })
      if (error) throw error
      return data as Course[]
    },
    enabled: !!user,
  })
}

export function useCourse(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['courses', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Course
    },
    enabled: !!user && !!id,
  })
}

export function useCreateCourse() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: CourseInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('courses').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<CourseInput> }) => {
      const { error } = await supabase.from('courses').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['courses'] })
      qc.invalidateQueries({ queryKey: ['courses', id] })
    },
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

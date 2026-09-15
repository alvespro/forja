import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { CourseInput } from '@/hooks/use-courses'
import { LIBRARY_STATUS_OPTIONS } from '@/lib/library-status'
import type { Course } from '@/types/database'

const courseSchema = z.object({
  provedor: z.string(),
  titulo: z.string().min(1, 'Informe um título'),
  status: z.enum(['quero_ler', 'lendo', 'lido']),
  progresso: z.number().min(0).max(100),
})

type CourseFormValues = z.infer<typeof courseSchema>

type CourseFormProps = {
  course?: Course
  onSubmit: (values: CourseInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function CourseForm({ course, onSubmit, onCancel, isSubmitting }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      provedor: course?.provedor ?? '',
      titulo: course?.titulo ?? '',
      status: course?.status ?? 'quero_ler',
      progresso: course?.progresso ?? 0,
    },
  })

  function handleValidSubmit(values: CourseFormValues) {
    onSubmit({
      ...values,
      provedor: values.provedor.trim() || null,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit(handleValidSubmit)}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" aria-invalid={!!errors.titulo} {...register('titulo')} />
        {errors.titulo && <p className="text-xs text-alerta-texto">{errors.titulo.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provedor">Provedor</Label>
        <Input id="provedor" placeholder="Ex: G4 Educação" {...register('provedor')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register('status')}>
            {LIBRARY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="progresso">Progresso (%)</Label>
          <Input
            id="progresso"
            type="number"
            min={0}
            max={100}
            {...register('progresso', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

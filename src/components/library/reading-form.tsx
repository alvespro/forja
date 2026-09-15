import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ReadingInput } from '@/hooks/use-readings'
import { LIBRARY_STATUS_OPTIONS } from '@/lib/library-status'
import type { Reading } from '@/types/database'

const readingSchema = z.object({
  trilha: z.string(),
  titulo: z.string().min(1, 'Informe um título'),
  autor: z.string(),
  status: z.enum(['quero_ler', 'lendo', 'lido']),
  progresso: z.number().min(0).max(100),
  nota_321: z.string(),
})

type ReadingFormValues = z.infer<typeof readingSchema>

type ReadingFormProps = {
  defaultTrilha?: string
  reading?: Reading
  onSubmit: (values: ReadingInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function ReadingForm({ defaultTrilha, reading, onSubmit, onCancel, isSubmitting }: ReadingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      trilha: reading?.trilha ?? defaultTrilha ?? '',
      titulo: reading?.titulo ?? '',
      autor: reading?.autor ?? '',
      status: reading?.status ?? 'quero_ler',
      progresso: reading?.progresso ?? 0,
      nota_321: reading?.nota_321 ?? '',
    },
  })

  function handleValidSubmit(values: ReadingFormValues) {
    onSubmit({
      ...values,
      trilha: values.trilha.trim() || null,
      autor: values.autor.trim() || null,
      nota_321: values.nota_321.trim() || null,
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trilha">Trilha</Label>
          <Input id="trilha" placeholder="Ex: Mente & Disciplina" {...register('trilha')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="autor">Autor</Label>
          <Input id="autor" {...register('autor')} />
        </div>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nota_321">Notas 3-2-1 (3 ideias, 2 aplicações, 1 ação)</Label>
        <Textarea id="nota_321" rows={4} {...register('nota_321')} />
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

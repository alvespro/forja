import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { GoalInput } from '@/hooks/use-goals'
import { AREA_OPTIONS } from '@/lib/areas'
import type { Cycle, Goal, GoalArea } from '@/types/database'

const goalSchema = z.object({
  titulo: z.string().min(1, 'Informe um título'),
  area: z.enum(['fisico', 'mental', 'financeiro', 'vinculos', 'negocio']),
  cycle_id: z.string(),
  resultado_rpm: z.string(),
  proposito_rpm: z.string(),
  plano_rpm: z.string(),
  progresso: z.number().min(0).max(100),
  status: z.enum(['ativo', 'concluido', 'pausado']),
})

type GoalFormValues = z.infer<typeof goalSchema>

const NO_CYCLE = 'none'

type GoalFormProps = {
  defaultArea: GoalArea
  defaultCycleId: string | null
  cycles: Cycle[]
  goal?: Goal
  onSubmit: (values: GoalInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function GoalForm({
  defaultArea,
  defaultCycleId,
  cycles,
  goal,
  onSubmit,
  onCancel,
  isSubmitting,
}: GoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      titulo: goal?.titulo ?? '',
      area: goal?.area ?? defaultArea,
      cycle_id: goal?.cycle_id ?? defaultCycleId ?? NO_CYCLE,
      resultado_rpm: goal?.resultado_rpm ?? '',
      proposito_rpm: goal?.proposito_rpm ?? '',
      plano_rpm: goal?.plano_rpm ?? '',
      progresso: goal?.progresso ?? 0,
      status: goal?.status ?? 'ativo',
    },
  })

  function handleValidSubmit(values: GoalFormValues) {
    onSubmit({
      ...values,
      cycle_id: values.cycle_id === NO_CYCLE ? null : values.cycle_id,
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
        {errors.titulo && <p className="text-xs text-alerta">{errors.titulo.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="area">Área</Label>
          <Select id="area" {...register('area')}>
            {AREA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cycle_id">Ciclo</Label>
          <Select id="cycle_id" {...register('cycle_id')}>
            <option value={NO_CYCLE}>Sem ciclo</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.nome}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resultado_rpm">Resultado</Label>
        <Textarea id="resultado_rpm" rows={2} {...register('resultado_rpm')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proposito_rpm">Propósito</Label>
        <Textarea id="proposito_rpm" rows={2} {...register('proposito_rpm')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plano_rpm">Plano de Ação Massiva</Label>
        <Textarea id="plano_rpm" rows={2} {...register('plano_rpm')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="progresso">Progresso manual (%)</Label>
          <Input
            id="progresso"
            type="number"
            min={0}
            max={100}
            {...register('progresso', { valueAsNumber: true })}
          />
          <p className="text-xs text-aco-texto">Só é usado se a meta não tiver resultados-chave.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register('status')}>
            <option value="ativo">Ativo</option>
            <option value="concluido">Concluído</option>
            <option value="pausado">Pausado</option>
          </Select>
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

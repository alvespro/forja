import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFrogTask } from '@/hooks/use-frog-task'

type FocusTaskPickerProps = {
  value: string
  onChange: (value: string) => void
}

/** Seleção do sapo do dia (ou tarefa livre) para a sessão de foco. */
export function FocusTaskPicker({ value, onChange }: FocusTaskPickerProps) {
  const { data: frog } = useFrogTask()

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="tarefa-foco">Tarefa em foco</Label>
      <Input
        id="tarefa-foco"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="No que você vai focar agora?"
      />
      {frog && frog.titulo !== value && (
        <button
          type="button"
          onClick={() => onChange(frog.titulo)}
          className="self-start rounded text-xs text-aco-texto outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          🐸 Usar sapo do dia: {frog.titulo}
        </button>
      )}
    </div>
  )
}

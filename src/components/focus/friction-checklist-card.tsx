import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CHECKLIST_ITEMS = [
  { id: 'celular', texto: 'Celular no modo avião ou silencioso' },
  { id: 'agua', texto: 'Água por perto' },
  { id: 'banheiro', texto: 'Já fui ao banheiro' },
  { id: 'abas', texto: 'Fechei abas e redes sociais que não preciso agora' },
]

type FrictionChecklistCardProps = {
  onReady: () => void
}

/** Ritual anti-atrito da Fase 7: gate antes do pomodoro, contra a procrastinação. */
export function FrictionChecklistCard({ onReady }: FrictionChecklistCardProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tudoChecado = checked.size === CHECKLIST_ITEMS.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ritual anti-atrito</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2.5">
          {CHECKLIST_ITEMS.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <Checkbox
                id={`atrito-${item.id}`}
                checked={checked.has(item.id)}
                onCheckedChange={() => toggle(item.id)}
              />
              <Label htmlFor={`atrito-${item.id}`} className="font-normal text-foreground">
                {item.texto}
              </Label>
            </li>
          ))}
        </ul>
        <Button type="button" disabled={!tudoChecado} onClick={onReady}>
          Iniciar foco
        </Button>
      </CardContent>
    </Card>
  )
}

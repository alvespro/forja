import { useState } from 'react'
import { Brain, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { FORJA_AGENTES, useForjaAI, type ForjaAgente } from '@/hooks/useForjaAI'

export function ForjaChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [agente, setAgente] = useState<ForjaAgente>('coach')
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState<string | null>(null)
  const perguntar = useForjaAI()

  if (!user) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!pergunta.trim()) return
    setResposta(null)
    perguntar.mutate(
      { agente, pergunta: pergunta.trim() },
      { onSuccess: (data) => setResposta(data) },
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6">
      {isOpen && (
        <Card className="w-[min(22rem,calc(100vw-2rem))]">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-heading text-sm font-bold text-foreground">Agentes FORJA</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Fechar chat de agentes"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </div>

            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <Select value={agente} onChange={(event) => setAgente(event.target.value as ForjaAgente)}>
                {FORJA_AGENTES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <Textarea
                placeholder="Pergunte algo para o agente..."
                value={pergunta}
                onChange={(event) => setPergunta(event.target.value)}
                rows={3}
              />
              <Button type="submit" size="sm" disabled={perguntar.isPending || !pergunta.trim()}>
                {perguntar.isPending ? 'Pensando…' : 'Perguntar'}
              </Button>
            </form>

            {perguntar.isError && (
              <p className="text-xs text-alerta">
                {perguntar.error instanceof Error
                  ? perguntar.error.message
                  : 'Não foi possível obter resposta do agente. Tente novamente.'}
              </p>
            )}

            {resposta && (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-card/60 p-3">
                <p className="whitespace-pre-wrap text-sm text-foreground">{resposta}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        size="icon-lg"
        className="rounded-full shadow-lg"
        aria-label={isOpen ? 'Fechar agentes FORJA' : 'Abrir agentes FORJA'}
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? <X className="size-4" aria-hidden="true" /> : <Brain className="size-4" aria-hidden="true" />}
      </Button>
    </div>
  )
}

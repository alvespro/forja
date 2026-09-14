import { useEffect, useRef, useState } from 'react'
import { Brain, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAiMessages, useInvalidateAiMessages } from '@/hooks/use-ai-messages'
import { useAuth } from '@/hooks/use-auth'
import { FORJA_AGENTES, useForjaAI, type ForjaAgente } from '@/hooks/useForjaAI'
import { useForjaChatLaunchRequest } from '@/lib/forja-chat-store'
import { cn } from '@/lib/utils'

export function ForjaChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [agente, setAgente] = useState<ForjaAgente>('coach')
  const [pergunta, setPergunta] = useState('')
  const perguntar = useForjaAI()
  const launchRequest = useForjaChatLaunchRequest()

  // Conversa persistida: o histórico sobrevive a fechar o chat/app,
  // e o backend envia as últimas mensagens ao modelo (follow-up real)
  const historico = useAiMessages(agente)
  const invalidateMessages = useInvalidateAiMessages()
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!launchRequest) return
    setAgente(launchRequest.agente)
    setPergunta(launchRequest.pergunta ?? '')
    setIsOpen(true)
  }, [launchRequest])

  // Rolar para o fim quando a conversa muda
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [historico.data, perguntar.isPending])

  if (!user) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!pergunta.trim()) return
    const q = pergunta.trim()
    setPergunta('')
    perguntar.mutate(
      { agente, pergunta: q },
      {
        onSuccess: () => invalidateMessages(agente),
        onError: () => setPergunta(q), // devolve a pergunta para reenviar
      },
    )
  }

  const mensagens = historico.data ?? []

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 [html[data-immersive]_&]:hidden">
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

            <Select value={agente} onChange={(event) => setAgente(event.target.value as ForjaAgente)}>
              {FORJA_AGENTES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>

            {/* Thread da conversa */}
            {(mensagens.length > 0 || perguntar.isPending) && (
              <div ref={threadRef} className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {mensagens.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[88%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'self-end rounded-br-sm bg-brasa/15 text-foreground'
                        : 'self-start rounded-bl-sm border border-border/50 bg-card/60 text-foreground',
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                {perguntar.isPending && (
                  <div className="self-start rounded-xl rounded-bl-sm border border-border/50 bg-card/60 px-3 py-2 text-sm text-aco-texto">
                    Pensando…
                  </div>
                )}
              </div>
            )}

            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <Textarea
                placeholder={mensagens.length > 0 ? 'Continuar a conversa…' : 'Pergunte algo para o agente...'}
                value={pergunta}
                onChange={(event) => setPergunta(event.target.value)}
                rows={2}
              />
              <Button type="submit" size="sm" disabled={perguntar.isPending || !pergunta.trim()}>
                {perguntar.isPending ? 'Pensando…' : mensagens.length > 0 ? 'Responder' : 'Perguntar'}
              </Button>
            </form>

            {perguntar.isError && (
              <p className="text-xs text-alerta">
                {perguntar.error instanceof Error
                  ? perguntar.error.message
                  : 'Não foi possível obter resposta do agente. Tente novamente.'}
              </p>
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

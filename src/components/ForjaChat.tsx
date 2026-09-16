import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll'

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
  const escondido = useHideOnScroll()
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
    <div className="fixed bottom-[var(--float-bottom)] right-5 z-50 flex flex-col items-end gap-3 md:bottom-6 [html[data-immersive]_&]:hidden">
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
                <Icon name="close" size={14} />
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
              <p className="text-xs text-alerta-texto">
                {perguntar.error instanceof Error
                  ? perguntar.error.message
                  : 'Não foi possível obter resposta do agente. Tente novamente.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* FAB: 56px vermilion com glow; some ao rolar para baixo (volta ao subir). */}
      <button
        type="button"
        aria-label={isOpen ? 'Fechar agentes FORJA' : 'Abrir agentes FORJA'}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brasa text-fundo shadow-[var(--glow-brasa)] outline-none transition-[transform,opacity] duration-[var(--dur-normal)] ease-[var(--spring-bounce)] hover:bg-brasa2 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fundo',
          escondido && !isOpen && 'pointer-events-none translate-y-24 opacity-0',
        )}
      >
        <Icon name={isOpen ? 'close' : 'psychology'} size={24} />
      </button>
    </div>
  )
}

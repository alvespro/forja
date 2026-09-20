import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll'
import { useAiMessages, type AiMessage, useInvalidateAiMessages } from '@/hooks/use-ai-messages'
import { useAuth } from '@/hooks/use-auth'
import { useCreateTask } from '@/hooks/use-tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FORJA_AGENTES, useForjaChatAI, type ForjaAgente } from '@/hooks/useForjaAI'
import { MAX_AI_QUESTION } from '@/lib/forja-agents'
import { useForjaChatLaunchRequest } from '@/lib/forja-chat-store'
import { cn } from '@/lib/utils'

type LocalTurn = { id: string; role: 'user' | 'assistant'; content: string }

export function ForjaChat({ mostrarAtalho = true }: { mostrarAtalho?: boolean }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const escondido = useHideOnScroll()
  const [agente, setAgente] = useState<ForjaAgente>('coach')
  const [pergunta, setPergunta] = useState('')
  const [turnosLocais, setTurnosLocais] = useState<LocalTurn[]>([])
  const [novaTarefa, setNovaTarefa] = useState('')
  const perguntar = useForjaChatAI()
  const criarTarefa = useCreateTask()
  const launchRequest = useForjaChatLaunchRequest()
  const historico = useAiMessages(agente, 30, isOpen)
  const invalidateMessages = useInvalidateAiMessages()
  const threadRef = useRef<HTMLDivElement>(null)
  const agent = FORJA_AGENTES.find((item) => item.value === agente)!

  useEffect(() => {
    if (!launchRequest) return
    setAgente(launchRequest.agente)
    setPergunta(launchRequest.pergunta ?? '')
    setIsOpen(true)
  }, [launchRequest])

  useEffect(() => {
    const salvas = new Set((historico.data ?? []).map((m) => `${m.role}:${m.content}`))
    setTurnosLocais((atuais) => atuais.filter((m) => !salvas.has(`${m.role}:${m.content}`)))
  }, [historico.data])

  const mensagens = useMemo(
    () => [...(historico.data ?? []), ...turnosLocais] as Array<AiMessage | LocalTurn>,
    [historico.data, turnosLocais],
  )

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensagens, perguntar.isPending])

  if (!user) return null

  function enviar(texto = pergunta) {
    const q = texto.trim()
    if (!q || perguntar.isPending) return
    setPergunta('')
    const userTurn = { id: `local-user-${crypto.randomUUID()}`, role: 'user' as const, content: q }
    setTurnosLocais((atuais) => [...atuais, userTurn])
    perguntar.mutate({ agente, pergunta: q }, {
      onSuccess: (resposta) => {
        setTurnosLocais((atuais) => [...atuais, { id: `local-assistant-${crypto.randomUUID()}`, role: 'assistant', content: resposta }])
        invalidateMessages(agente)
      },
      onError: () => {
        setTurnosLocais((atuais) => atuais.filter((turno) => turno.id !== userTurn.id))
        setPergunta(q)
      },
    })
  }

  function salvarTarefa() {
    const titulo = novaTarefa.trim()
    if (!titulo) return
    criarTarefa.mutate({ titulo, area: agent.area }, { onSuccess: () => setNovaTarefa('') })
  }

  return (
    <div className="fixed bottom-[var(--float-bottom)] right-5 z-50 flex flex-col items-end gap-3 md:bottom-6 [html[data-immersive]_&]:hidden">
      {isOpen && (
        <section aria-label="Agentes FORJA" className="flex max-h-[min(42rem,calc(100vh-7rem))] w-[min(42rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[rgba(16,16,16,0.96)] shadow-2xl backdrop-blur-[30px]">
          <header className="flex items-start justify-between gap-4 border-b border-border/50 px-4 py-3 sm:px-5">
            <div><p className="font-heading text-base font-bold text-foreground">Agentes FORJA</p><p className="mt-0.5 text-xs text-aco-texto">Conselhos baseados nos seus registros — você decide a ação.</p></div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar agentes FORJA" onClick={() => setIsOpen(false)}><Icon name="close" size={16} /></Button>
          </header>
          <div className="flex gap-2 overflow-x-auto border-b border-border/40 px-4 py-2.5 sm:px-5" role="tablist" aria-label="Escolher agente">
            {FORJA_AGENTES.map((item) => <button key={item.value} type="button" role="tab" aria-selected={agente === item.value} onClick={() => setAgente(item.value)} disabled={perguntar.isPending} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', agente === item.value ? 'border-brasa bg-brasa/15 text-nevoa' : 'border-border/60 text-aco-texto hover:border-border hover:text-foreground')}>{item.label}</button>)}
          </div>
          <div className="border-b border-border/40 px-4 py-3 sm:px-5"><p className="font-heading text-sm font-semibold text-foreground">{agent.label}</p><p className="mt-0.5 text-xs text-aco-texto">{agent.description} Consulta: {agent.context}.</p>
            {mensagens.length === 0 && <div className="mt-3 flex flex-wrap gap-2">{agent.prompts.map((prompt) => <Button key={prompt} type="button" variant="outline" size="xs" disabled={perguntar.isPending} onClick={() => enviar(prompt)}>{prompt}</Button>)}</div>}
          </div>
          <div ref={threadRef} className="min-h-40 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite">
            {historico.isLoading && <p className="text-sm text-aco-texto">Carregando conversa…</p>}
            {historico.isError && <p className="rounded-[var(--r-sm)] border border-alerta/35 bg-alerta/10 px-3 py-2 text-sm text-alerta-texto">Não foi possível carregar o histórico. Você ainda pode iniciar uma nova pergunta.</p>}
            {!historico.isLoading && mensagens.length === 0 && <p className="max-w-sm text-sm leading-6 text-aco-texto">Comece por uma pergunta específica. Quanto mais completos os registros, mais útil será a análise.</p>}
            {mensagens.map((m) => <div key={m.id} className={cn('max-w-[92%] rounded-[var(--r-md)] px-3 py-2.5 text-sm leading-6 whitespace-pre-wrap', m.role === 'user' ? 'ml-auto rounded-br-sm bg-brasa/15 text-foreground' : 'rounded-bl-sm border border-border/60 bg-card/70 text-foreground')}>{m.content}</div>)}
            {perguntar.isPending && <div className="w-fit rounded-[var(--r-md)] rounded-bl-sm border border-border/60 bg-card/70 px-3 py-2 text-sm text-aco-texto"><Icon name="progress_activity" size={15} className="mr-1 animate-spin align-text-bottom" />Analisando seus registros…</div>}
          </div>
          <div className="border-t border-border/50 p-4 sm:px-5">
            {perguntar.isError && <p className="mb-2 text-xs text-alerta-texto">{perguntar.error instanceof Error ? perguntar.error.message : 'Não foi possível obter a resposta.'}</p>}
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); enviar() }}><label className="sr-only" htmlFor="forja-chat-question">Sua pergunta para {agent.label}</label><Textarea id="forja-chat-question" value={pergunta} onChange={(event) => setPergunta(event.target.value)} maxLength={MAX_AI_QUESTION} rows={2} placeholder="Escreva uma pergunta objetiva…" disabled={perguntar.isPending} /><Button type="submit" size="icon-lg" aria-label="Enviar pergunta" disabled={perguntar.isPending || !pergunta.trim()}><Icon name="arrow_forward" size={18} /></Button></form>
            <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[11px] text-cinza2-texto">{pergunta.length}/{MAX_AI_QUESTION}</span><span className="text-[11px] text-cinza2-texto">Enter envia</span></div>
            <div className="mt-3 flex gap-2 border-t border-border/35 pt-3"><Input value={novaTarefa} onChange={(event) => setNovaTarefa(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); salvarTarefa() } }} placeholder="Transformar uma decisão em tarefa…" maxLength={200} disabled={criarTarefa.isPending} aria-label="Título da nova tarefa" /><Button type="button" variant="secondary" size="sm" onClick={salvarTarefa} disabled={!novaTarefa.trim() || criarTarefa.isPending}>{criarTarefa.isPending ? 'Salvando…' : 'Criar tarefa'}</Button></div>
          </div>
        </section>
      )}
      {mostrarAtalho && <button type="button" aria-label={isOpen ? 'Fechar agentes FORJA' : 'Abrir agentes FORJA'} onClick={() => setIsOpen((v) => !v)} className={cn('flex size-12 items-center justify-center rounded-full bg-brasa text-fundo shadow-[var(--glow-brasa)] outline-none transition-[transform,opacity] duration-[var(--dur-normal)] ease-[var(--spring-bounce)] hover:bg-brasa2 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fundo', escondido && !isOpen && 'pointer-events-none translate-y-24 opacity-0')}><Icon name={isOpen ? 'close' : 'psychology'} size={22} /></button>}
    </div>
  )
}

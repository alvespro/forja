import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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

/** Renderização deliberadamente pequena e segura do formato que os agentes retornam. */
function InlineMarkdown({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-aco2 px-1 py-0.5 font-mono text-[0.85em] text-nevoa">{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index} className="italic text-foreground/90">{part.slice(1, -1)}</em>
    return part
  })
}

function AgentMessage({ content }: { content: string }) {
  const lines = content.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim()
    if (!line) { index += 1; continue }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const Tag = heading[1].length === 1 ? 'h2' : heading[1].length === 2 ? 'h3' : 'h4'
      blocks.push(<Tag key={`heading-${index}`} className={cn('font-heading font-semibold text-foreground', heading[1].length === 1 ? 'text-base leading-6' : 'text-sm leading-5')}><InlineMarkdown text={heading[2]} /></Tag>)
      index += 1
      continue
    }

    if (/^(?:[-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line)
      const items: ReactNode[] = []
      while (index < lines.length) {
        const item = lines[index].trim()
        const match = item.match(ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/)
        if (!match) break
        items.push(<li key={index}><InlineMarkdown text={match[1]} /></li>)
        index += 1
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={`list-${index}`} className={cn('space-y-1 pl-5', ordered ? 'list-decimal' : 'list-disc')}>{items}</List>)
      continue
    }

    const paragraph: string[] = []
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^(?:[-*]|\d+\.)\s+/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={`paragraph-${index}`}><InlineMarkdown text={paragraph.join(' ')} /></p>)
  }

  return <div className="space-y-3 text-[13px] leading-6 text-foreground sm:text-sm">{blocks}</div>
}

export function ForjaChat({ mostrarAtalho = true }: { mostrarAtalho?: boolean }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const escondido = useHideOnScroll()
  const [agente, setAgente] = useState<ForjaAgente>('coach')
  const [pergunta, setPergunta] = useState('')
  const [turnosLocais, setTurnosLocais] = useState<LocalTurn[]>([])
  const [novaTarefa, setNovaTarefa] = useState('')
  const [mostrarCriarTarefa, setMostrarCriarTarefa] = useState(false)
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
  const temResposta = mensagens.some((mensagem) => mensagem.role === 'assistant')

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
        <section aria-label="Agentes FORJA" className="flex max-h-[calc(100vh-6.5rem)] w-[min(42rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[rgba(10,10,10,0.985)] shadow-2xl backdrop-blur-[30px]">
          <header className="flex items-center justify-between gap-4 border-b border-border/70 px-4 py-2.5 sm:px-5">
            <div><p className="font-heading text-base font-bold text-foreground">IA FORJA</p><p className="text-xs text-foreground/75">Análises baseadas nos seus registros.</p></div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar agentes FORJA" onClick={() => setIsOpen(false)}><Icon name="close" size={16} /></Button>
          </header>
          <div className="border-b border-border/50 px-4 py-2.5 sm:px-5">
            <label className="sr-only" htmlFor="forja-agent-select">Escolher agente</label>
            <select id="forja-agent-select" value={agente} onChange={(event) => setAgente(event.target.value as ForjaAgente)} disabled={perguntar.isPending} className="h-11 w-full rounded-[var(--r-md)] border border-border bg-aco px-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden">
              {FORJA_AGENTES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <div className="hidden gap-2 overflow-x-auto sm:flex" role="tablist" aria-label="Escolher agente">
              {FORJA_AGENTES.map((item) => <button key={item.value} type="button" role="tab" aria-selected={agente === item.value} onClick={() => setAgente(item.value)} disabled={perguntar.isPending} className={cn('min-h-11 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors', agente === item.value ? 'border-brasa bg-brasa/15 text-nevoa' : 'border-border/70 text-foreground/80 hover:border-cinza hover:text-foreground')}>{item.label}</button>)}
            </div>
          </div>
          <div className="border-b border-border/50 px-4 py-2.5 sm:px-5"><p className="font-heading text-sm font-semibold text-foreground">{agent.label}</p><p className="mt-0.5 text-[13px] leading-5 text-foreground/80">{agent.description}<span className="hidden sm:inline"> Consulta: {agent.context}.</span></p>
            {mensagens.length === 0 && <div className="mt-3 flex flex-wrap gap-2">{agent.prompts.map((prompt) => <Button key={prompt} type="button" variant="outline" size="xs" disabled={perguntar.isPending} onClick={() => enviar(prompt)}>{prompt}</Button>)}</div>}
          </div>
          <div ref={threadRef} className="min-h-32 flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-5" aria-live="polite">
            {historico.isLoading && <p className="text-sm text-foreground/75">Carregando conversa…</p>}
            {historico.isError && <p className="rounded-[var(--r-sm)] border border-alerta/35 bg-alerta/10 px-3 py-2 text-sm text-alerta-texto">Não foi possível carregar o histórico. Você ainda pode iniciar uma nova pergunta.</p>}
            {!historico.isLoading && mensagens.length === 0 && <p className="max-w-sm text-sm leading-6 text-foreground/75">Comece por uma pergunta específica. Quanto mais completos os registros, mais útil será a análise.</p>}
            {mensagens.map((m) => <div key={m.id} className={cn('max-w-[92%] rounded-[var(--r-md)] px-3 py-2.5', m.role === 'user' ? 'ml-auto rounded-br-sm bg-brasa/15 text-sm leading-6 text-foreground whitespace-pre-wrap' : 'rounded-bl-sm border border-border/70 bg-card text-foreground')}>
              {m.role === 'assistant' ? <AgentMessage content={m.content} /> : m.content}
            </div>)}
            {perguntar.isPending && <div className="w-fit rounded-[var(--r-md)] rounded-bl-sm border border-border/70 bg-card px-3 py-2 text-sm text-foreground/75"><Icon name="progress_activity" size={15} className="mr-1 animate-spin align-text-bottom" />Analisando seus registros…</div>}
          </div>
          <div className="border-t border-border/70 p-3 sm:px-5 sm:py-4">
            {perguntar.isError && <p className="mb-2 text-xs text-alerta-texto">{perguntar.error instanceof Error ? perguntar.error.message : 'Não foi possível obter a resposta.'}</p>}
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); enviar() }}><label className="sr-only" htmlFor="forja-chat-question">Sua pergunta para {agent.label}</label><Textarea id="forja-chat-question" value={pergunta} onChange={(event) => setPergunta(event.target.value)} maxLength={MAX_AI_QUESTION} rows={2} placeholder="Escreva uma pergunta objetiva…" disabled={perguntar.isPending} /><Button type="submit" size="icon-lg" aria-label="Enviar pergunta" disabled={perguntar.isPending || !pergunta.trim()}><Icon name="arrow_forward" size={18} /></Button></form>
            <div className="mt-1.5 flex items-center justify-between gap-2"><span className="text-[11px] text-foreground/65">{pergunta.length}/{MAX_AI_QUESTION}</span><span className="text-[11px] text-foreground/65">Enter envia</span></div>
            {temResposta && !mostrarCriarTarefa && <button type="button" onClick={() => setMostrarCriarTarefa(true)} className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-brasa outline-none hover:text-brasa2 focus-visible:ring-2 focus-visible:ring-ring"><Icon name="task_alt" size={17} />Transformar uma resposta em tarefa</button>}
            {temResposta && mostrarCriarTarefa && <div className="mt-2 flex gap-2 border-t border-border/50 pt-2.5"><Input value={novaTarefa} onChange={(event) => setNovaTarefa(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); salvarTarefa() } }} placeholder="Descreva a tarefa…" maxLength={200} disabled={criarTarefa.isPending} aria-label="Título da nova tarefa" /><Button type="button" variant="secondary" size="sm" onClick={salvarTarefa} disabled={!novaTarefa.trim() || criarTarefa.isPending}>{criarTarefa.isPending ? 'Salvando…' : 'Criar tarefa'}</Button></div>}
          </div>
        </section>
      )}
      {mostrarAtalho && <button type="button" aria-label={isOpen ? 'Fechar agentes FORJA' : 'Abrir agentes FORJA'} onClick={() => setIsOpen((v) => !v)} className={cn('flex size-12 items-center justify-center rounded-full bg-brasa text-fundo shadow-[var(--glow-brasa)] outline-none transition-[transform,opacity] duration-[var(--dur-normal)] ease-[var(--spring-bounce)] hover:bg-brasa2 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fundo', escondido && !isOpen && 'pointer-events-none translate-y-24 opacity-0')}><Icon name={isOpen ? 'close' : 'psychology'} size={22} /></button>}
    </div>
  )
}

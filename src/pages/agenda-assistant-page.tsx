import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSaveCalendarEvent } from '@/hooks/use-calendar'
import { useForjaAI } from '@/hooks/useForjaAI'
import { CATEGORIES, day_shift, type Category, timestamp } from '@/lib/calendar'

type Attachment = { name: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string }
type Draft = { titulo: string; data: string; inicio: string | null; fim: string | null; dia_inteiro: boolean; categoria: Category; local: string; descricao: string }
type Answer = { mensagem: string; acao: 'criar_evento' | 'perguntar' | 'nenhuma'; evento: Draft | null; conflitos: string[] }
type Turn = { role: 'user' | 'assistant'; content: string }

type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null }
type RecognitionConstructor = new () => Recognition

function parseAnswer(value: string): Answer {
  const clean = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const parsed = JSON.parse(clean) as Partial<Answer>
  const event = parsed.evento
  const category = event?.categoria && event.categoria in CATEGORIES ? event.categoria : 'pessoal'
  const validEvent = event && /^\d{4}-\d{2}-\d{2}$/.test(event.data ?? '') && typeof event.titulo === 'string'
    ? { titulo: event.titulo, data: event.data, inicio: event.inicio ?? null, fim: event.fim ?? null, dia_inteiro: Boolean(event.dia_inteiro), categoria: category as Category, local: event.local ?? '', descricao: event.descricao ?? '' }
    : null
  return { mensagem: parsed.mensagem || 'Não consegui interpretar o compromisso.', acao: validEvent && parsed.acao === 'criar_evento' ? 'criar_evento' : parsed.acao === 'perguntar' ? 'perguntar' : 'nenhuma', evento: validEvent, conflitos: Array.isArray(parsed.conflitos) ? parsed.conflitos.filter((item): item is string => typeof item === 'string') : [] }
}

async function readImage(file: File): Promise<Attachment> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Envie uma imagem JPEG, PNG ou WebP.')
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.')
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Não foi possível ler a imagem.')); reader.readAsDataURL(file) })
  return { name: file.name, mediaType: file.type as Attachment['mediaType'], data: dataUrl.split(',')[1] }
}

/** Chat de agenda: interpreta a intenção, exibe prévia e só cria após confirmação explícita. */
export function AgendaAssistantPage() {
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [turns, setTurns] = useState<Turn[]>([{ role: 'assistant', content: 'Posso organizar um compromisso por texto, foto ou voz. Ex.: “Reunião com o João na terça, às 14h, por 1 hora”.' }])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [conflicts, setConflicts] = useState<string[]>([])
  const [listening, setListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ask = useForjaAI()
  const save = useSaveCalendarEvent()

  function send() {
    const prompt = text.trim() || (attachment ? 'Leia esta imagem e proponha o compromisso identificado.' : '')
    if (!prompt || ask.isPending) return
    setText('')
    setDraft(null)
    setConflicts([])
    setTurns((items) => [...items, { role: 'user', content: attachment ? `${prompt}\n📎 ${attachment.name}` : prompt }])
    ask.mutate({ agente: 'agenda', pergunta: prompt, anexo: attachment ? { media_type: attachment.mediaType, data: attachment.data } : undefined }, {
      onSuccess: (raw) => {
        try {
          const answer = parseAnswer(raw)
          setTurns((items) => [...items, { role: 'assistant', content: answer.mensagem }])
          setDraft(answer.evento)
          setConflicts(answer.conflitos)
          setAttachment(null)
        } catch {
          setTurns((items) => [...items, { role: 'assistant', content: 'Não consegui estruturar esse pedido. Informe data, horário e duração para eu montar a prévia.' }])
        }
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Não foi possível consultar a IA.'),
    })
  }

  function startVoice() {
    const BrowserWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
    const Constructor = BrowserWindow.SpeechRecognition ?? BrowserWindow.webkitSpeechRecognition
    if (!Constructor) { toast.error('Ditado por voz não é suportado neste navegador. Use Chrome ou envie o texto transcrito.'); return }
    const recognition = new Constructor()
    recognition.lang = 'pt-BR'; recognition.interimResults = false; recognition.continuous = false
    recognition.onresult = (event) => setText((current) => `${current}${current ? ' ' : ''}${event.results[0][0].transcript}`)
    recognition.onerror = () => toast.error('Não foi possível entender o áudio. Tente novamente.')
    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  function confirm() {
    if (!draft) return
    if (!draft.dia_inteiro && (!draft.inicio || !draft.fim)) { toast.error('Informe horário de início e fim antes de confirmar.'); return }
    const inicio = timestamp(draft.data, draft.dia_inteiro ? '00:00' : draft.inicio!)
    const fim = timestamp(draft.data, draft.dia_inteiro ? '00:00' : draft.fim!)
    if (fim <= inicio && !draft.dia_inteiro) { toast.error('O fim deve ser posterior ao início.'); return }
    save.mutate({ id: crypto.randomUUID(), titulo: draft.titulo, inicio, fim: draft.dia_inteiro ? timestamp(day_shift(draft.data, 1), '00:00') : fim, dia_inteiro: draft.dia_inteiro, categoria: draft.categoria, local: draft.local, descricao: draft.descricao, acao: 'criar_evento' }, { onSuccess: () => { setTurns((items) => [...items, { role: 'assistant', content: 'Compromisso criado na agenda. Você pode editá-lo a qualquer momento.' }]); setDraft(null); setConflicts([]) } })
  }

  return <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-4">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-brasa">Assistente de agenda</p><h1 className="mt-1 text-2xl font-bold">Agende conversando</h1><p className="mt-1 max-w-xl text-sm leading-6 text-foreground/80">A IA monta uma prévia. Você revisa e confirma antes de criar.</p></div><Button asChild variant="outline"><Link to="/agenda">Voltar à agenda</Link></Button></header>
    <section className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm">
      <div className="min-h-36 max-h-[min(22rem,calc(100vh-20rem))] space-y-3 overflow-y-auto p-4 sm:min-h-56 sm:p-6" aria-live="polite">
        {turns.map((turn, index) => <div key={index} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${turn.role === 'user' ? 'ml-auto bg-brasa/15 text-foreground' : 'border border-border bg-black/20 text-foreground'}`}>{turn.content}</div>)}
        {ask.isPending && <p className="flex items-center gap-2 text-sm text-aco-texto"><Icon name="progress_activity" size={16} className="animate-spin" />Entendendo seu compromisso…</p>}
      </div>
      <div className="border-t border-border p-4 sm:p-5">
        {attachment && <div className="mb-2 flex items-center justify-between rounded-lg border border-brasa/40 bg-brasa/10 px-3 py-2 text-sm"><span>Imagem: {attachment.name}</span><button type="button" aria-label="Remover imagem" onClick={() => setAttachment(null)}><Icon name="close" size={18} /></button></div>}
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); send() }}><Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Ex.: reunião com João na terça, às 14h" rows={2} maxLength={6000} disabled={ask.isPending} /><Button type="submit" disabled={ask.isPending || (!text.trim() && !attachment)}>{ask.isPending ? 'Lendo…' : 'Enviar'} <Icon name="arrow_forward" size={17} /></Button></form>
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={ask.isPending} className="min-h-11"><Icon name="attach_file" size={16} />Imagem</Button><input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) readImage(file).then(setAttachment).catch((error: Error) => toast.error(error.message)); event.target.value = '' }} /><Button type="button" size="sm" variant={listening ? 'default' : 'outline'} onClick={listening ? undefined : startVoice} disabled={ask.isPending || listening} className="min-h-11"><Icon name="mic" size={16} />{listening ? 'Ouvindo…' : 'Falar'}</Button><span className="col-span-2 self-center text-xs leading-5 text-foreground/75 sm:ml-1">Texto, foto/print ou ditado em português.</span></div>
      </div>
    </section>
    {draft && <section className="rounded-2xl border border-brasa/50 bg-brasa/[0.07] p-4 sm:p-5" aria-labelledby="ai-event-preview"><div className="flex items-start justify-between gap-3"><div><p className="ds-label text-brasa">PRÉVIA DA IA — REVISE ANTES DE CRIAR</p><h2 id="ai-event-preview" className="mt-1 text-lg font-bold">{draft.titulo}</h2></div><span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: CATEGORIES[draft.categoria].color }}>{CATEGORIES[draft.categoria].label}</span></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-aco-texto">Quando</dt><dd>{draft.data.split('-').reverse().join('/')} · {draft.dia_inteiro ? 'Dia inteiro' : `${draft.inicio} – ${draft.fim}`}</dd></div>{draft.local && <div><dt className="text-aco-texto">Local</dt><dd>{draft.local}</dd></div>}{draft.descricao && <div className="sm:col-span-2"><dt className="text-aco-texto">Detalhes</dt><dd>{draft.descricao}</dd></div>}</dl>{conflicts.length > 0 && <div role="alert" className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100"><strong>Possível conflito:</strong><ul className="mt-1 list-disc pl-5">{conflicts.map((item) => <li key={item}>{item}</li>)}</ul></div>}<div className="mt-5 flex flex-wrap gap-2"><Button onClick={confirm} disabled={save.isPending}>{save.isPending ? 'Criando…' : 'Confirmar e criar evento'}</Button><Button variant="outline" onClick={() => setDraft(null)} disabled={save.isPending}>Descartar prévia</Button></div></section>}
  </main>
}

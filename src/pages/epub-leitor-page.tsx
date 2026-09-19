import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Book, Rendition } from 'epubjs'

import { Icon } from '@/components/Icon'
import { ErrorState } from '@/components/feedback/error-state'
import { FlashcardModal } from '@/components/estudos/flashcard-modal'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { baixarEpub, useAtualizarEpub, useEpubBook } from '@/hooks/use-epub-library'
import { useImmersiveMode } from '@/hooks/use-immersive-mode'
import { mensagemDeErro } from '@/lib/feedback'
import type { EpubAnotacao, EpubBook, EpubDestaque } from '@/types/database'

type Tema = 'escuro' | 'claro'

const TEMAS: Record<Tema, { fundo: string; texto: string; destaque: string }> = {
  escuro: { fundo: '#1A1A1A', texto: '#F0EDE4', destaque: 'rgba(232, 162, 61, 0.35)' },
  claro: { fundo: '#F9F7F1', texto: '#1D1D1D', destaque: 'rgba(252, 76, 19, 0.25)' },
}

const PREFS_KEY = 'forja:leitor-prefs'
const FONTE_MIN = 14
const FONTE_MAX = 28

function lerPrefs(): { tema: Tema; fonte: number } {
  try {
    const p = JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? '{}')
    return { tema: p.tema === 'claro' ? 'claro' : 'escuro', fonte: Number(p.fonte) >= FONTE_MIN && Number(p.fonte) <= FONTE_MAX ? Number(p.fonte) : 18 }
  } catch {
    return { tema: 'escuro', fonte: 18 }
  }
}

type Selecao = { cfi: string; texto: string }

export function EpubLeitorPage() {
  const { id } = useParams<{ id: string }>()
  const livro = useEpubBook(id)
  if (livro.isError) return <ErrorState message="EPUB não encontrado." onRetry={() => livro.refetch()} />
  if (!livro.data) return <p className="p-6 text-sm text-cinza">Carregando livro…</p>
  return <Leitor livro={livro.data} />
}

function Leitor({ livro }: { livro: EpubBook }) {
  useImmersiveMode(true)
  const navigate = useNavigate()
  const atualizar = useAtualizarEpub()
  const areaRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  // Destaques/anotações vivos (o `livro` do cache não muda a cada gravação local).
  const destaquesRef = useRef<EpubDestaque[]>(livro.destaques ?? [])
  const anotacoesRef = useRef<EpubAnotacao[]>(livro.anotacoes ?? [])

  const [prefs, setPrefs] = useState(lerPrefs)
  const [progresso, setProgresso] = useState(livro.progresso_pct ?? 0)
  const [capitulo, setCapitulo] = useState('')
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando')
  const [selecao, setSelecao] = useState<Selecao | null>(null)
  const [anotando, setAnotando] = useState<Selecao | null>(null)
  const [nota, setNota] = useState('')
  const [flashcard, setFlashcard] = useState<string | null>(null)

  const salvar = useCallback(
    (values: Parameters<typeof atualizar.mutate>[0]['values']) =>
      atualizar.mutate({ id: livro.id, values }, { onError: (e) => toast.error(mensagemDeErro(e, 'salvar no livro')) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [livro.id],
  )

  // Abre o livro uma vez (arquivo do bucket privado → ArrayBuffer → epub.js).
  useEffect(() => {
    let cancelado = false
    let book: Book | null = null
    ;(async () => {
      try {
        if (!livro.arquivo_url) throw new Error('sem arquivo')
        const [{ default: ePub }, dados] = await Promise.all([import('epubjs'), baixarEpub(livro.arquivo_url)])
        if (cancelado || !areaRef.current) return
        book = ePub(dados)
        bookRef.current = book
        const rendition = book.renderTo(areaRef.current, { width: '100%', height: '100%', flow: 'paginated', spread: 'none', allowScriptedContent: false })
        renditionRef.current = rendition

        for (const d of destaquesRef.current) rendition.annotations.highlight(d.cfi, {}, undefined, 'forja-destaque')
        for (const a of anotacoesRef.current) rendition.annotations.underline(a.cfi, {}, undefined, 'forja-anotacao')

        rendition.on('relocated', (loc: { start: { cfi: string; href: string; percentage?: number } }) => {
          const cfi = loc.start.cfi
          const locs = book!.locations
          const pct = locs && locs.length() > 0 ? Math.round(locs.percentageFromCfi(cfi) * 100) : undefined
          if (pct !== undefined) setProgresso(pct)
          const item = book!.navigation?.get(loc.start.href)
          setCapitulo(item?.label?.trim() ?? '')
          // Posição salva a cada virada de página.
          salvar({ ultima_posicao: cfi, ...(pct !== undefined ? { progresso_pct: pct } : {}) })
        })

        rendition.on('selected', (cfiRange: string, contents: { window: Window }) => {
          const texto = contents.window.getSelection()?.toString().trim() ?? ''
          if (texto) setSelecao({ cfi: cfiRange, texto })
        })
        rendition.on('click', () => setSelecao(null))

        await rendition.display(livro.ultima_posicao || undefined)
        if (cancelado) return
        setEstado('pronto')
        // Localizações (para o %) em segundo plano: livros grandes demoram alguns segundos.
        void book.ready.then(() => book!.locations.generate(1600)).then(() => {
          if (cancelado) return
          const atual = rendition.currentLocation() as unknown as { start?: { cfi: string } }
          if (atual?.start?.cfi) setProgresso(Math.round(book!.locations.percentageFromCfi(atual.start.cfi) * 100))
        })
      } catch {
        if (!cancelado) setEstado('erro')
      }
    })()
    return () => {
      cancelado = true
      renditionRef.current = null
      bookRef.current = null
      book?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livro.id])

  // Tema e fonte (Georgia) aplicados dentro do iframe do livro.
  useEffect(() => {
    const r = renditionRef.current
    if (!r || estado !== 'pronto') return
    const t = TEMAS[prefs.tema]
    r.themes.default({
      body: { background: `${t.fundo} !important`, color: `${t.texto} !important`, 'font-family': 'Georgia, serif !important', 'line-height': '1.6' },
      'p, li, span, div': { color: `${t.texto} !important`, 'font-family': 'Georgia, serif !important' },
      a: { color: '#FC4C13 !important' },
      '.forja-destaque': { fill: t.destaque, 'fill-opacity': '1' },
    })
    r.themes.fontSize(`${prefs.fonte}px`)
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      // preferências valem só nesta sessão
    }
  }, [prefs, estado])

  const anterior = () => void renditionRef.current?.prev()
  const proxima = () => void renditionRef.current?.next()

  // Setas do teclado viram a página.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') anterior()
      if (e.key === 'ArrowRight') proxima()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function limparSelecao() {
    const contents = renditionRef.current?.getContents() as unknown as { window: Window }[] | undefined
    for (const c of contents ?? []) c.window.getSelection()?.removeAllRanges()
    setSelecao(null)
  }

  function destacar() {
    if (!selecao) return
    const novo: EpubDestaque = { cfi: selecao.cfi, texto: selecao.texto, criado_em: new Date().toISOString() }
    destaquesRef.current = [...destaquesRef.current, novo]
    renditionRef.current?.annotations.highlight(selecao.cfi, {}, undefined, 'forja-destaque')
    salvar({ destaques: destaquesRef.current })
    toast.success('Trecho destacado.')
    limparSelecao()
  }

  function salvarAnotacao() {
    if (!anotando || !nota.trim()) return
    const nova: EpubAnotacao = { cfi: anotando.cfi, texto: anotando.texto, nota: nota.trim(), criado_em: new Date().toISOString() }
    anotacoesRef.current = [...anotacoesRef.current, nova]
    renditionRef.current?.annotations.underline(anotando.cfi, {}, undefined, 'forja-anotacao')
    salvar({ anotacoes: anotacoesRef.current })
    toast.success('Anotação salva.')
    setAnotando(null)
    setNota('')
  }

  const t = TEMAS[prefs.tema]
  const botaoBarra = 'flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brasa disabled:opacity-40'

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: t.fundo, color: t.texto }}>
      {/* Progresso no topo */}
      <div className="h-1 w-full" style={{ backgroundColor: `${t.texto}1A` }} role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do livro">
        <div className="h-full bg-brasa transition-[width] duration-300" style={{ width: `${progresso}%` }} />
      </div>

      <header className="flex items-center gap-1 px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" className={botaoBarra} onClick={() => navigate('/estudos?tab=epub')} aria-label="Voltar à biblioteca">
          <Icon name="arrow_back" size={22} />
        </button>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-sm font-semibold">{livro.titulo}</p>
          <p className="truncate text-[11px] opacity-70">
            {capitulo ? `${capitulo} · ` : ''}
            {progresso}%
          </p>
        </div>
        <button type="button" className={botaoBarra} aria-label="Diminuir fonte" disabled={prefs.fonte <= FONTE_MIN} onClick={() => setPrefs((p) => ({ ...p, fonte: p.fonte - 2 }))}>
          <Icon name="text_decrease" size={20} />
        </button>
        <button type="button" className={botaoBarra} aria-label="Aumentar fonte" disabled={prefs.fonte >= FONTE_MAX} onClick={() => setPrefs((p) => ({ ...p, fonte: p.fonte + 2 }))}>
          <Icon name="text_increase" size={20} />
        </button>
        <button
          type="button"
          className={botaoBarra}
          aria-label={prefs.tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
          onClick={() => setPrefs((p) => ({ ...p, tema: p.tema === 'escuro' ? 'claro' : 'escuro' }))}
        >
          <Icon name={prefs.tema === 'escuro' ? 'light_mode' : 'dark_mode'} size={20} />
        </button>
      </header>

      <main className="relative min-h-0 flex-1">
        <div ref={areaRef} className="absolute inset-0 px-4 py-3 md:px-12" />
        {estado === 'carregando' && (
          <p role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-sm opacity-80">
            <Icon name="progress_activity" size={18} className="animate-spin" />
            Abrindo o livro…
          </p>
        )}
        {estado === 'erro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm">
            <p>Não consegui abrir este EPUB.</p>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => navigate('/estudos?tab=epub')}>
              Voltar à biblioteca
            </Button>
          </div>
        )}

        {/* Ações sobre o trecho selecionado */}
        {selecao && (
          <div role="toolbar" aria-label="Ações do trecho selecionado" className="absolute inset-x-0 bottom-3 z-10 mx-auto flex w-fit gap-1 rounded-full border border-white/10 bg-[#101010]/95 p-1 text-[#F0EDE4] shadow-2xl backdrop-blur">
            <button type="button" onClick={destacar} className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-white/10">
              🖍️ Destacar
            </button>
            <button
              type="button"
              onClick={() => {
                setAnotando(selecao)
                limparSelecao()
              }}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-white/10"
            >
              📝 Anotar
            </button>
            <button
              type="button"
              onClick={() => {
                setFlashcard(selecao.texto)
                limparSelecao()
              }}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-white/10"
            >
              🃏 Flashcard
            </button>
          </div>
        )}
      </main>

      <footer className="flex items-center justify-between gap-2 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1">
        <button type="button" onClick={anterior} disabled={estado !== 'pronto'} className="flex min-h-11 items-center gap-1 rounded-full px-3 text-sm opacity-80 hover:opacity-100 disabled:opacity-30">
          <Icon name="chevron_left" size={22} />
          Anterior
        </button>
        <button type="button" onClick={proxima} disabled={estado !== 'pronto'} className="flex min-h-11 items-center gap-1 rounded-full px-3 text-sm opacity-80 hover:opacity-100 disabled:opacity-30">
          Próxima
          <Icon name="chevron_right" size={22} />
        </button>
      </footer>

      <Modal open={anotando !== null} onClose={() => setAnotando(null)} title="Anotar trecho" maxWidth="sm">
        {anotando && (
          <div className="flex flex-col gap-3">
            <blockquote className="border-l-2 border-brasa pl-3 text-sm italic text-cinza">“{anotando.texto.slice(0, 300)}”</blockquote>
            <Textarea autoFocus rows={4} value={nota} onChange={(e) => setNota(e.target.value)} aria-label="Sua anotação" placeholder="O que isso significa para você?" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="min-h-11" onClick={() => setAnotando(null)}>
                Cancelar
              </Button>
              <Button type="button" className="min-h-11" disabled={!nota.trim()} onClick={salvarAnotacao}>
                Salvar anotação
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <FlashcardModal
        open={flashcard !== null}
        onClose={() => setFlashcard(null)}
        inicial={{ frente: flashcard ?? '', fonte: { tipo: 'livro', id: null, nome: livro.titulo } }}
      />
    </div>
  )
}

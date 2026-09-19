import { useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/use-confirm'
import { EPUB_MAX_BYTES, useCapasAssinadas, useEpubLibrary, useExcluirEpub, useImportarEpub } from '@/hooks/use-epub-library'
import { mensagemDeErro } from '@/lib/feedback'
import type { EpubBook } from '@/types/database'

/** Lê título, autor e capa do .epub no navegador (epub.js carregado sob demanda). */
async function extrairMetadados(arquivo: File): Promise<{ titulo: string; autor: string | null; capa: Blob | null }> {
  const { default: ePub } = await import('epubjs')
  const livro = ePub(await arquivo.arrayBuffer())
  try {
    const meta = await livro.loaded.metadata
    let capa: Blob | null = null
    try {
      const url = await livro.coverUrl()
      if (url) capa = await (await fetch(url)).blob()
    } catch {
      // livro sem capa — segue sem
    }
    return {
      titulo: meta.title?.trim() || arquivo.name.replace(/\.epub$/i, ''),
      autor: meta.creator?.trim() || null,
      capa,
    }
  } finally {
    livro.destroy()
  }
}

export function EpubTab() {
  const navigate = useNavigate()
  const livros = useEpubLibrary()
  const importar = useImportarEpub()
  const excluir = useExcluirEpub()
  const { confirm, dialog } = useConfirm()
  const inputRef = useRef<HTMLInputElement>(null)
  const [lendoArquivo, setLendoArquivo] = useState(false)
  const capas = useCapasAssinadas((livros.data ?? []).map((l) => l.capa_url).filter((c): c is string => !!c))

  async function onArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (!/\.epub$/i.test(arquivo.name)) return toast.error('Escolha um arquivo .epub.')
    if (arquivo.size > EPUB_MAX_BYTES) return toast.error('O arquivo passa de 50 MB.')
    setLendoArquivo(true)
    try {
      const meta = await extrairMetadados(arquivo)
      importar.mutate(
        { arquivo, ...meta },
        {
          onSuccess: (livro) => toast.success(`${livro.titulo} importado.`),
          onError: (err) => toast.error(mensagemDeErro(err, 'importar o EPUB')),
        },
      )
    } catch {
      toast.error('Não consegui ler este EPUB. O arquivo pode estar corrompido.')
    } finally {
      setLendoArquivo(false)
    }
  }

  async function handleExcluir(livro: EpubBook) {
    const ok = await confirm({
      title: `Remover ${livro.titulo}?`,
      description: 'O arquivo, a posição de leitura, os destaques e as anotações deste EPUB serão apagados.',
      critico: true,
    })
    if (!ok) return
    excluir.mutate(livro, {
      onSuccess: () => toast.success(`${livro.titulo} removido.`),
      onError: (err) => toast.error(mensagemDeErro(err, 'remover o EPUB')),
    })
  }

  const ocupado = lendoArquivo || importar.isPending

  return (
    <div className="flex flex-col gap-4">
      <input ref={inputRef} type="file" accept=".epub,application/epub+zip" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onArquivo} />
      <Button type="button" className="min-h-12" disabled={ocupado} onClick={() => inputRef.current?.click()}>
        {ocupado ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="upload" size={18} />}
        {lendoArquivo ? 'Lendo o arquivo…' : importar.isPending ? 'Enviando…' : 'Importar EPUB'}
      </Button>

      {livros.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : livros.isError ? (
        <ErrorState message="Não foi possível carregar a biblioteca." onRetry={() => livros.refetch()} />
      ) : (livros.data ?? []).length === 0 ? (
        <EmptyState message="Nenhum EPUB na biblioteca." description="Importe um .epub (até 50 MB) para ler aqui, com destaques e anotações." icon="menu_book" />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(livros.data ?? []).map((l) => {
            const capa = l.capa_url ? capas.data?.[l.capa_url] : undefined
            return (
              <li key={l.id} className="flex gap-3 rounded-[var(--r-lg)] border border-linha bg-[#1D1D1D] p-3">
                <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-sm)] bg-white/5">
                  {capa ? <img src={capa} alt="" className="size-full object-cover" /> : <Icon name="menu_book" size={28} className="text-cinza" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="line-clamp-2 font-semibold text-nevoa">{l.titulo}</p>
                  {l.autor && <p className="truncate text-xs text-cinza">{l.autor}</p>}
                  <div className="flex items-center gap-2">
                    <Progress value={l.progresso_pct ?? 0} className="h-1.5 flex-1" aria-label={`Progresso de ${l.titulo}`} />
                    <span className="text-[11px] text-cinza tabular-nums">{l.progresso_pct ?? 0}%</span>
                  </div>
                  {l.updated_at && (
                    <p className="text-[11px] text-cinza/80">
                      Último acesso: {formatDistanceToNow(new Date(l.updated_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  )}
                  <div className="mt-auto flex gap-1">
                    <Button type="button" size="sm" className="min-h-11 flex-1" onClick={() => navigate(`/estudos/epub/${l.id}`)}>
                      <Icon name="play_arrow" size={18} />
                      {(l.progresso_pct ?? 0) > 0 ? 'Continuar leitura' : 'Começar'}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-11 text-cinza hover:text-alerta-texto" aria-label={`Remover ${l.titulo}`} onClick={() => void handleExcluir(l)}>
                      <Icon name="delete" size={18} />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {dialog}
    </div>
  )
}

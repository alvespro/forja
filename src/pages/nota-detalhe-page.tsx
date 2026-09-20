import { lazy, Suspense, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { ErrorState } from '@/components/feedback/error-state'
import { corDaTag, ICONE_FONTE } from '@/components/estudos/anotacoes-tab'
import { FlashcardsDaFonte } from '@/components/estudos/flashcards-da-fonte'
import { NotaModal } from '@/components/estudos/nota-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/use-confirm'
import { useAlternarFavorito, useExcluirNota, useStudyNote } from '@/hooks/use-study-notes'
import { mensagemDeErro } from '@/lib/feedback'

const MarkdownView = lazy(() => import('@/components/estudos/markdown').then((m) => ({ default: m.MarkdownView })))

export function NotaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const nota = useStudyNote(id)
  const favoritar = useAlternarFavorito()
  const excluir = useExcluirNota()
  const { confirm, dialog } = useConfirm()
  const [editando, setEditando] = useState(false)

  if (nota.isLoading) return <Skeleton className="h-64 w-full" />
  if (nota.isError || !nota.data) return <ErrorState message="Anotação não encontrada." onRetry={() => nota.refetch()} />
  const n = nota.data

  async function handleExcluir() {
    const ok = await confirm({
      title: `Excluir "${n.titulo}"?`,
      description: 'A anotação some de vez. Os flashcards gerados dela continuam nos decks.',
      critico: true,
    })
    if (!ok) return
    excluir.mutate(n.id, {
      onSuccess: () => {
        toast.success('Anotação excluída.')
        navigate('/estudos?tab=anotacoes', { replace: true })
      },
      onError: (e) => toast.error(mensagemDeErro(e, 'excluir a anotação')),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <button type="button" onClick={() => navigate('/estudos?tab=anotacoes')} className="flex min-h-11 w-fit items-center gap-1.5 text-sm text-aco-texto hover:text-foreground">
        <Icon name="arrow_back" size={16} />
        Anotações
      </button>

      <article id="nota-impressao" className="flex flex-col gap-3 rounded-[var(--r-xl)] border border-linha bg-[#1D1D1D] p-5">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold text-nevoa">{n.titulo}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-cinza">
              <Icon name={ICONE_FONTE[n.fonte_tipo ?? 'outro'] ?? 'description'} size={14} />
              {n.created_at && format(new Date(n.created_at), "d 'de' MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => favoritar.mutate({ id: n.id, favorito: !n.favorito })}
            aria-pressed={!!n.favorito}
            aria-label={n.favorito ? 'Desfavoritar' : 'Favoritar'}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-cinza hover:text-[#E8A23D] print:hidden"
          >
            <Icon name="star" size={22} filled={!!n.favorito} className={n.favorito ? 'text-[#E8A23D]' : undefined} />
          </button>
        </header>
        {n.sync_status !== 'synced' && (
          <p className={n.sync_status === 'conflict' ? 'text-sm text-alerta-texto' : 'text-sm text-ambar'}>
            {n.sync_status === 'conflict'
              ? 'Esta anotação também foi alterada em outro dispositivo. Edite e salve novamente para manter esta versão.'
              : 'Salva neste dispositivo. Ela será sincronizada automaticamente quando a conexão voltar.'}
          </p>
        )}
        {(n.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(n.tags ?? []).map((t) => (
              <span key={t} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: corDaTag(t), backgroundColor: `${corDaTag(t)}22` }}>
                #{t}
              </span>
            ))}
          </div>
        )}
        {n.conteudo ? (
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <MarkdownView texto={n.conteudo} />
          </Suspense>
        ) : (
          <p className="text-sm text-cinza">Sem conteúdo ainda.</p>
        )}
      </article>

      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={() => setEditando(true)}>
          <Icon name="edit" size={18} />
          Editar
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => window.print()}>
          <Icon name="print" size={18} />
          Exportar como PDF
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 text-cinza hover:text-alerta-texto" onClick={() => void handleExcluir()}>
          <Icon name="delete" size={18} />
          Excluir
        </Button>
      </div>

      <FlashcardsDaFonte tipo="anotacao" fonteId={n.id} titulo={n.titulo} textoParaIA={n.conteudo ?? ''} />

      <NotaModal open={editando} nota={n} onClose={() => setEditando(false)} />
      {dialog}
    </div>
  )
}

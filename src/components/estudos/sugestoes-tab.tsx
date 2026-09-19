import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdicionarSugestaoABiblioteca, useBookSuggestions, useIgnorarSugestao, useSalvarSugestoesLivros } from '@/hooks/use-book-suggestions'
import { useDevSuggestions } from '@/hooks/use-dev-suggestions'
import { useForjaAI } from '@/hooks/useForjaAI'
import { mensagemDeErro } from '@/lib/feedback'
import { sugestoesDaResposta } from '@/lib/flashcards'

type Item = { origem: 'book' | 'dev'; id: string; titulo: string; autor: string | null; motivo: string | null; area: string | null; semanal: boolean }

const PEDIDO =
  'Sugira 5 livros para meu perfil atual.\n' +
  'Responda APENAS com JSON válido, sem texto antes ou depois: ' +
  '{"sugestoes": [{"titulo": "...", "autor": "...", "motivo": "por que este livro, para mim, agora (1-2 frases)", "area": "área de desenvolvimento"}]}'

export function SugestoesTab() {
  const livros = useBookSuggestions()
  const semanais = useDevSuggestions()
  const ia = useForjaAI()
  const salvar = useSalvarSugestoesLivros()
  const adicionar = useAdicionarSugestaoABiblioteca()
  const ignorar = useIgnorarSugestao()

  // Sugestões da IA sob demanda + as semanais automáticas (weekly-suggestions) do tipo livro.
  const itens: Item[] = [
    ...(livros.data ?? []).map((s) => ({ origem: 'book' as const, id: s.id, titulo: s.titulo, autor: s.autor, motivo: s.motivo, area: s.area, semanal: false })),
    ...(semanais.data ?? [])
      .filter((s) => s.tipo === 'livro' && (s.status ?? 'pendente') === 'pendente')
      .map((s) => ({ origem: 'dev' as const, id: s.id, titulo: s.titulo, autor: s.autor_ou_diretor, motivo: s.motivo, area: s.area, semanal: true })),
  ]

  function pedir() {
    ia.mutate(
      { agente: 'desenvolvimento', pergunta: PEDIDO },
      {
        onSuccess: (resposta) => {
          const sugestoes = sugestoesDaResposta(resposta)
          if (sugestoes.length === 0) {
            toast.error('A IA não devolveu sugestões válidas. Tente de novo.')
            return
          }
          salvar.mutate(
            { sugestoes, pendentes: itens.map((i) => i.titulo) },
            {
              onSuccess: (n) => toast.success(n ? `${n} ${n === 1 ? 'livro sugerido' : 'livros sugeridos'}.` : 'Nenhum título novo — as sugestões já estavam na lista.'),
              onError: (e) => toast.error(mensagemDeErro(e, 'salvar as sugestões')),
            },
          )
        },
      },
    )
  }

  function add(i: Item) {
    adicionar.mutate(
      { origem: i.origem, id: i.id, titulo: i.titulo, autor: i.autor },
      {
        onSuccess: () => toast.success(`${i.titulo} entrou na biblioteca (quero ler).`),
        onError: (e) => toast.error(mensagemDeErro(e, 'adicionar à biblioteca')),
      },
    )
  }

  function skip(i: Item) {
    ignorar.mutate(
      { origem: i.origem, id: i.id },
      { onSuccess: () => toast.success('Sugestão ignorada.'), onError: (e) => toast.error(mensagemDeErro(e, 'ignorar a sugestão')) },
    )
  }

  const pedindo = ia.isPending || salvar.isPending

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" className="min-h-12" disabled={pedindo} onClick={pedir}>
        {pedindo ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <span aria-hidden="true">🤖</span>}
        {pedindo ? 'Pensando nas sugestões…' : 'Pedir sugestões'}
      </Button>

      {livros.isLoading || semanais.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : livros.isError ? (
        <ErrorState message="Não foi possível carregar as sugestões." onRetry={() => livros.refetch()} />
      ) : itens.length === 0 ? (
        <EmptyState message="Nenhuma sugestão pendente." description="Peça sugestões à IA — ela olha suas leituras, áreas mais fracas e metas." icon="lightbulb" />
      ) : (
        <ul className="flex flex-col gap-3">
          {itens.map((i) => (
            <li key={`${i.origem}-${i.id}`} className="flex flex-col gap-2 rounded-[var(--r-lg)] border border-linha bg-[#1D1D1D] p-4">
              <div className="flex items-start gap-2">
                <Icon name="menu_book" size={20} className="mt-0.5 shrink-0 text-brasa" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-nevoa">{i.titulo}</p>
                  {i.autor && <p className="text-xs text-cinza">{i.autor}</p>}
                </div>
                {i.semanal && <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-cinza">Semanal</span>}
              </div>
              {i.motivo && <p className="text-sm text-cinza">{i.motivo}</p>}
              {i.area && (
                <span className="w-fit rounded-full bg-brasa/10 px-2 py-0.5 text-[11px] font-medium text-brasa">{i.area}</span>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" size="sm" className="min-h-11" disabled={adicionar.isPending} onClick={() => add(i)}>
                  <Icon name="add" size={18} />
                  Adicionar à biblioteca
                </Button>
                <Button type="button" size="sm" variant="ghost" className="min-h-11 text-cinza" disabled={ignorar.isPending} onClick={() => skip(i)}>
                  <Icon name="close" size={18} />
                  Ignorar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

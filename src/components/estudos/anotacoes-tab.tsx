import { useDeferredValue, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlternarFavorito, useStudyNotes } from '@/hooks/use-study-notes'
import { mensagemDeErro } from '@/lib/feedback'
import { cn } from '@/lib/utils'
import type { StudyNote } from '@/types/database'

import { NotaModal } from './nota-modal'

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'livro', label: 'Livros' },
  { key: 'curso', label: 'Cursos' },
  { key: 'tecnico', label: 'Técnico' },
  { key: 'favoritos', label: 'Favoritos' },
] as const
type Filtro = (typeof FILTROS)[number]['key']

const ORDENS = [
  { key: 'recentes', label: 'Recentes' },
  { key: 'alfabetico', label: 'Alfabético' },
  { key: 'favoritos', label: 'Favoritos' },
] as const
type Ordem = (typeof ORDENS)[number]['key']

/** Tons fixos por tag (hash do texto) para os pills. */
const TONS = ['#FC4C13', '#E8A23D', '#4CAF7D', '#3B82F6', '#A855F7', '#EC4899', '#14B8A6']
export function corDaTag(tag: string): string {
  let h = 0
  for (const ch of tag.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TONS[h % TONS.length]
}

/** Markdown → texto corrido para o preview de 2 linhas. */
function textoPlano(md: string | null): string {
  return (md ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`|~-]+/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export const ICONE_FONTE: Record<string, 'menu_book' | 'school' | 'science' | 'description'> = {
  livro: 'menu_book',
  curso: 'school',
  aula: 'school',
  tecnico: 'science',
  outro: 'description',
}

export function AnotacoesTab() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const termo = useDeferredValue(busca)
  const notas = useStudyNotes(termo)
  const favoritar = useAlternarFavorito()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [nova, setNova] = useState(false)

  const lista = useMemo(() => {
    let l = (notas.data ?? []).filter((n) =>
      filtro === 'todos' ? true : filtro === 'favoritos' ? n.favorito : n.fonte_tipo === filtro || (filtro === 'curso' && n.fonte_tipo === 'aula'),
    )
    if (ordem === 'alfabetico') l = [...l].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
    if (ordem === 'favoritos') l = [...l].sort((a, b) => Number(!!b.favorito) - Number(!!a.favorito))
    return l
  }, [notas.data, filtro, ordem])

  function alternarFavorito(n: StudyNote) {
    favoritar.mutate(
      { id: n.id, favorito: !n.favorito },
      { onError: (e) => toast.error(mensagemDeErro(e, 'favoritar a anotação')) },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cinza" />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nas anotações"
            aria-label="Buscar nas anotações"
            className="pl-9"
          />
        </div>
        <Button type="button" className="min-h-11" onClick={() => setNova(true)}>
          <Icon name="add" size={18} />
          Nova
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar anotações">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filtro === f.key}
              onClick={() => setFiltro(f.key)}
              className={cn(
                'min-h-9 shrink-0 rounded-full border px-3 text-[13px] font-medium transition-colors',
                filtro === f.key ? 'border-brasa bg-brasa/15 text-brasa' : 'border-linha text-cinza hover:text-nevoa',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[13px] text-cinza" role="group" aria-label="Ordenar anotações">
          Ordenar:
          {ORDENS.map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={ordem === o.key}
              onClick={() => setOrdem(o.key)}
              className={cn('min-h-9 rounded px-1.5', ordem === o.key ? 'font-semibold text-nevoa underline decoration-brasa underline-offset-4' : 'hover:text-nevoa')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {notas.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : notas.isError ? (
        <ErrorState message="Não foi possível carregar as anotações." onRetry={() => notas.refetch()} />
      ) : lista.length === 0 ? (
        <EmptyState message={termo ? `Nada encontrado para "${termo}".` : 'Nenhuma anotação ainda.'} icon="edit_note" />
      ) : (
        <ul className="flex flex-col gap-3" aria-busy={notas.isFetching}>
          {lista.map((n) => (
            <li key={n.id} className="relative rounded-[var(--r-lg)] border border-linha bg-[#1D1D1D] transition-colors hover:border-brasa/40">
              <button type="button" onClick={() => navigate(`/estudos/nota/${n.id}`)} className="flex w-full flex-col gap-2 p-4 pr-14 text-left">
                <span className="flex items-center gap-2">
                  <Icon name={ICONE_FONTE[n.fonte_tipo ?? 'outro'] ?? 'description'} size={16} className="shrink-0 text-cinza" />
                  <span className="truncate font-semibold text-nevoa">{n.titulo}</span>
                </span>
                {n.conteudo && <span className="line-clamp-2 text-sm text-cinza">{textoPlano(n.conteudo)}</span>}
                <span className="flex flex-wrap items-center gap-1.5">
                  {(n.tags ?? []).map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: corDaTag(t), backgroundColor: `${corDaTag(t)}22` }}>
                      #{t}
                    </span>
                  ))}
                  {n.created_at && (
                    <span className="ml-auto text-[11px] text-cinza/80">{format(new Date(n.created_at), "d 'de' MMM yyyy", { locale: ptBR })}</span>
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => alternarFavorito(n)}
                aria-pressed={!!n.favorito}
                aria-label={n.favorito ? `Desfavoritar ${n.titulo}` : `Favoritar ${n.titulo}`}
                className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-cinza hover:text-[#E8A23D]"
              >
                <Icon name="star" size={20} filled={!!n.favorito} className={n.favorito ? 'text-[#E8A23D]' : undefined} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <NotaModal open={nova} onClose={() => setNova(false)} />
    </div>
  )
}

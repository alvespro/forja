import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ObjectiveBadge } from '@/components/body/objective-badge'
import { LivroCard } from '@/components/desenvolvimento/livro-card'
import { CursoCard } from '@/components/desenvolvimento/curso-card'
import { MediaCardItem, AddMediaButton } from '@/components/desenvolvimento/media-card'
import { SkillLevelCard } from '@/components/desenvolvimento/skill-level-card'
import { SkillsRadarChart } from '@/components/desenvolvimento/skills-radar-chart'
import { SuggestionsCard } from '@/components/desenvolvimento/suggestions-card'
import { useReadings, useCreateReading } from '@/hooks/use-readings'
import { useCourses, useCreateCourse } from '@/hooks/use-courses'
import { useDevMedia } from '@/hooks/use-dev-media'
import { useDevAreas } from '@/hooks/use-dev-areas'
import { cn } from '@/lib/utils'
import type { LibraryStatus, DevMediaStatus } from '@/types/database'

type DevTab = 'biblioteca' | 'cursos' | 'midia' | 'habilidades'

const TABS: { key: DevTab; label: string }[] = [
  { key: 'biblioteca', label: '📚 Biblioteca' },
  { key: 'cursos', label: '🎓 Cursos' },
  { key: 'midia', label: '🎬 Mídia' },
  { key: 'habilidades', label: '🧠 Habilidades' },
]

const LIVRO_STATUS_FILTERS: { key: LibraryStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'lendo', label: 'Lendo' },
  { key: 'lido', label: 'Lidos' },
  { key: 'quero_ler', label: 'Quero ler' },
]

const MEDIA_STATUS_FILTERS: { key: DevMediaStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'quero_ver', label: 'Quero ver' },
  { key: 'assistindo', label: 'Assistindo' },
  { key: 'assistido', label: 'Assistido' },
]

export function DesenvolvimentoPage() {
  const [tab, setTab] = useState<DevTab>('biblioteca')
  const [livroStatus, setLivroStatus] = useState<LibraryStatus | 'todos'>('todos')
  const [mediaStatus, setMediaStatus] = useState<DevMediaStatus | 'todos'>('todos')
  const [livroArea, setLivroArea] = useState<string>('todos')
  const [showAddReading, setShowAddReading] = useState(false)
  const [newReadingTitle, setNewReadingTitle] = useState('')
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourseTitle, setNewCourseTitle] = useState('')

  const readings = useReadings()
  const courses = useCourses()
  const media = useDevMedia()
  const devAreas = useDevAreas()
  const createReading = useCreateReading()
  const createCourse = useCreateCourse()

  const filteredReadings = useMemo(() => {
    let items = readings.data ?? []
    if (livroStatus !== 'todos') items = items.filter((r) => r.status === livroStatus)
    if (livroArea !== 'todos') items = items.filter((r) => r.dev_area_id === livroArea)
    return items
  }, [readings.data, livroStatus, livroArea])

  const filteredMedia = useMemo(() => {
    let items = media.data ?? []
    if (mediaStatus !== 'todos') items = items.filter((m) => m.status === mediaStatus)
    return items
  }, [media.data, mediaStatus])

  const SUGGESTION_TIPO_MAP: Record<DevTab, string[]> = {
    biblioteca: ['livro'],
    cursos: ['curso'],
    midia: ['filme', 'documentario', 'podcast', 'video'],
    habilidades: [],
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Desenvolvimento 🧠</h1>
          <p className="text-sm text-aco-texto">Biblioteca, cursos, mídia e habilidades</p>
        </div>
        <ObjectiveBadge />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'whitespace-nowrap rounded-t px-3 py-2 text-sm font-medium outline-none transition-colors shrink-0',
              tab === t.key
                ? 'border-b-2 border-brasa text-foreground'
                : 'text-aco-texto hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sugestões da semana (por tipo) */}
      {SUGGESTION_TIPO_MAP[tab].length > 0 && (
        <SuggestionsCard tipo={SUGGESTION_TIPO_MAP[tab] as never} />
      )}

      {/* ── TAB BIBLIOTECA ─────────────────────────────────────── */}
      {tab === 'biblioteca' && (
        <div className="flex flex-col gap-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {LIVRO_STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setLivroStatus(f.key)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    livroStatus === f.key
                      ? 'bg-brasa/20 text-brasa'
                      : 'bg-border/50 text-aco-texto hover:bg-border',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {(devAreas.data ?? []).length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setLivroArea('todos')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    livroArea === 'todos' ? 'bg-border text-foreground' : 'bg-border/50 text-aco-texto hover:bg-border',
                  )}
                >
                  Todas as áreas
                </button>
                {(devAreas.data ?? []).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setLivroArea(a.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      livroArea === a.id ? 'bg-border text-foreground' : 'bg-border/50 text-aco-texto hover:bg-border',
                    )}
                  >
                    {a.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {!showAddReading && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddReading(true)}>
                <Plus className="size-3.5" />
                Nova leitura
              </Button>
            )}
          </div>

          {showAddReading && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!newReadingTitle.trim()) return
                createReading.mutate(
                  { titulo: newReadingTitle, status: 'quero_ler' },
                  { onSuccess: () => { setShowAddReading(false); setNewReadingTitle('') } },
                )
              }}
            >
              <input
                autoFocus
                value={newReadingTitle}
                onChange={(e) => setNewReadingTitle(e.target.value)}
                placeholder="Título do livro"
                className="flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <Button type="submit" size="sm" disabled={createReading.isPending}>Adicionar</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddReading(false)}>Cancelar</Button>
            </form>
          )}

          {readings.isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : readings.isError ? (
            <ErrorState message="Não foi possível carregar as leituras." onRetry={() => readings.refetch()} />
          ) : filteredReadings.length === 0 ? (
            <EmptyState message="Nenhuma leitura encontrada." />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredReadings.map((r) => (
                <LivroCard key={r.id} reading={r} areas={devAreas.data} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CURSOS ─────────────────────────────────────────── */}
      {tab === 'cursos' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            {!showAddCourse && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCourse(true)}>
                <Plus className="size-3.5" />
                Novo curso
              </Button>
            )}
          </div>

          {showAddCourse && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!newCourseTitle.trim()) return
                createCourse.mutate(
                  { titulo: newCourseTitle, status: 'quero_ler' },
                  { onSuccess: () => { setShowAddCourse(false); setNewCourseTitle('') } },
                )
              }}
            >
              <input
                autoFocus
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="Nome do curso"
                className="flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <Button type="submit" size="sm" disabled={createCourse.isPending}>Adicionar</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCourse(false)}>Cancelar</Button>
            </form>
          )}

          {courses.isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : courses.isError ? (
            <ErrorState message="Não foi possível carregar os cursos." onRetry={() => courses.refetch()} />
          ) : (courses.data ?? []).length === 0 ? (
            <EmptyState message="Nenhum curso cadastrado ainda." />
          ) : (
            <div className="flex flex-col gap-3">
              {(courses.data ?? []).map((c) => (
                <CursoCard key={c.id} course={c} areas={devAreas.data} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB MÍDIA ──────────────────────────────────────────── */}
      {tab === 'midia' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 flex-wrap">
              {MEDIA_STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setMediaStatus(f.key)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    mediaStatus === f.key
                      ? 'bg-brasa/20 text-brasa'
                      : 'bg-border/50 text-aco-texto hover:bg-border',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <AddMediaButton />
          </div>

          {media.isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : media.isError ? (
            <ErrorState message="Não foi possível carregar a mídia." onRetry={() => media.refetch()} />
          ) : filteredMedia.length === 0 ? (
            <EmptyState message="Nenhuma mídia encontrada." />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMedia.map((m) => (
                <MediaCardItem key={m.id} media={m} areas={devAreas.data} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB HABILIDADES ───────────────────────────────────── */}
      {tab === 'habilidades' && (
        <div className="flex flex-col gap-6">
          {devAreas.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : devAreas.isError ? (
            <ErrorState message="Não foi possível carregar as áreas." onRetry={() => devAreas.refetch()} />
          ) : (devAreas.data ?? []).length === 0 ? (
            <EmptyState message="Nenhuma área de desenvolvimento encontrada." />
          ) : (
            <>
              <div>
                <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-aco-texto">
                  Radar de habilidades
                </h2>
                <SkillsRadarChart areas={devAreas.data ?? []} />
              </div>

              <div>
                <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-aco-texto">
                  Por área
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(devAreas.data ?? []).map((area) => (
                    <SkillLevelCard key={area.id} area={area} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

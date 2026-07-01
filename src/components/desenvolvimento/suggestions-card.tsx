import { Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDevSuggestions, useUpdateDevSuggestion } from '@/hooks/use-dev-suggestions'
import { useCreateReading } from '@/hooks/use-readings'
import { useCreateCourse } from '@/hooks/use-courses'
import { useCreateDevMedia } from '@/hooks/use-dev-media'
import { SUGGESTION_TIPO_EMOJI, AREA_LABEL } from '@/lib/desenvolvimento'
import type { DevMedia, DevSuggestionTipo } from '@/types/database'

type SuggestionsCardProps = {
  tipo?: DevSuggestionTipo | DevSuggestionTipo[]
  semana?: string
}

export function SuggestionsCard({ tipo, semana }: SuggestionsCardProps) {
  const suggestions = useDevSuggestions(semana)
  const updateStatus = useUpdateDevSuggestion()
  const createReading = useCreateReading()
  const createCourse = useCreateCourse()
  const createMedia = useCreateDevMedia()

  const tipos = tipo ? (Array.isArray(tipo) ? tipo : [tipo]) : undefined

  const pendentes = (suggestions.data ?? []).filter(
    (s) => s.status === 'pendente' && (tipos ? tipos.includes(s.tipo as DevSuggestionTipo) : true),
  )

  if (suggestions.isLoading || pendentes.length === 0) return null

  function handleAdicionar(id: string, titulo: string, tipoSug: string | null, autorOuDiretor: string | null, plataforma: string | null) {
    if (tipoSug === 'livro') {
      createReading.mutate({ titulo, autor: autorOuDiretor, status: 'quero_ler' })
    } else if (tipoSug === 'curso') {
      createCourse.mutate({ titulo, provedor: plataforma, plataforma, status: 'quero_ler' })
    } else {
      const mediaTipo = (['filme', 'documentario', 'serie', 'podcast', 'video'] as const).includes(tipoSug as never)
        ? (tipoSug as DevMedia['tipo'])
        : 'video'
      createMedia.mutate({
        titulo,
        tipo: mediaTipo ?? 'video',
        diretor_ou_host: autorOuDiretor,
        plataforma,
        status: 'quero_ver',
      })
    }
    updateStatus.mutate({ id, status: 'adicionado' })
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">💡 Sugestões desta semana</span>
          <span className="text-xs text-aco-texto">Próximas: segunda-feira</span>
        </div>
        <div className="flex flex-col gap-2">
          {pendentes.map((s) => (
            <div key={s.id} className="flex items-start gap-2 rounded-md border border-border bg-card p-2.5">
              <span className="mt-0.5 text-base">{SUGGESTION_TIPO_EMOJI[s.tipo ?? ''] ?? '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{s.titulo}</p>
                {s.autor_ou_diretor && (
                  <p className="text-xs text-aco-texto">{s.autor_ou_diretor}</p>
                )}
                {s.motivo && (
                  <p className="mt-1 text-xs text-aco-texto line-clamp-2">{s.motivo}</p>
                )}
                {s.area && (
                  <span className="mt-1 inline-block rounded-full bg-border/50 px-2 py-0.5 text-xs text-aco-texto">
                    {AREA_LABEL[s.area as keyof typeof AREA_LABEL] ?? s.area}
                  </span>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  disabled={updateStatus.isPending || createReading.isPending || createCourse.isPending || createMedia.isPending}
                  onClick={() => handleAdicionar(s.id, s.titulo, s.tipo, s.autor_ou_diretor, s.plataforma)}
                >
                  <Check className="size-3" />
                  Adicionar
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-aco-texto"
                  onClick={() => updateStatus.mutate({ id: s.id, status: 'ignorado' })}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

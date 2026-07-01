import { useNavigate } from 'react-router-dom'
import { BookOpen, CheckCircle2, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StarRating } from './star-rating'
import { STATUS_LABEL, areaTextColor } from '@/lib/desenvolvimento'
import type { DevArea, Reading } from '@/types/database'

type LivroCardProps = {
  reading: Reading
  areas?: DevArea[]
}

const STATUS_ICON: Record<string, React.ElementType> = {
  quero_ler: Clock,
  lendo: BookOpen,
  lido: CheckCircle2,
}

const STATUS_CLASS: Record<string, string> = {
  quero_ler: 'bg-border/50 text-aco-texto',
  lendo: 'bg-brasa/15 text-brasa',
  lido: 'bg-ok/15 text-ok',
}

export function LivroCard({ reading, areas }: LivroCardProps) {
  const navigate = useNavigate()
  const area = areas?.find((a) => a.id === reading.dev_area_id)
  const StatusIcon = STATUS_ICON[reading.status ?? 'quero_ler'] ?? Clock

  const initials = reading.titulo
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <Card className="cursor-pointer hover:border-brasa/50 transition-colors" onClick={() => navigate(`/biblioteca/livro/${reading.id}`)}>
      <CardContent className="flex items-start gap-3">
        {/* Capa placeholder */}
        <div
          className="size-14 shrink-0 rounded-md flex items-center justify-center text-lg font-bold text-white"
          style={{ backgroundColor: area ? areaTextColor(area.categoria) : '#6B7280' }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{reading.titulo}</p>
              {reading.autor && <p className="text-xs text-aco-texto">{reading.autor}</p>}
              {reading.trilha && <p className="text-xs text-aco-texto/70">{reading.trilha}</p>}
            </div>
            <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[reading.status ?? 'quero_ler']}`}>
              <StatusIcon className="size-3" />
              {STATUS_LABEL[reading.status ?? 'quero_ler']}
            </span>
          </div>

          {(reading.status === 'lendo' || reading.status === 'lido') && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-aco-texto mb-1">
                <span>Progresso</span>
                <span>{reading.progresso ?? 0}%</span>
              </div>
              <Progress value={reading.progresso ?? 0} className="h-1.5" />
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            {area && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: areaTextColor(area.categoria) + '20', color: areaTextColor(area.categoria) }}
              >
                {area.nome}
              </span>
            )}
            {reading.status === 'lido' && reading.nota_geral && (
              <StarRating value={reading.nota_geral} readonly size="sm" />
            )}
          </div>

          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-6 text-xs"
              onClick={(e) => { e.stopPropagation(); navigate(`/biblioteca/livro/${reading.id}`) }}
            >
              {reading.status === 'lido' ? '📝 Ver review' : reading.status === 'lendo' ? '▶ Continuar' : '+ Iniciar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

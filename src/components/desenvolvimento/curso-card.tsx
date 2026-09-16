import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/lib/icons'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StarRating } from './star-rating'
import { STATUS_LABEL, areaTextColor } from '@/lib/desenvolvimento'
import type { Course, DevArea } from '@/types/database'

type CursoCardProps = {
  course: Course
  areas?: DevArea[]
}

const STATUS_ICON: Record<string, IconName> = {
  quero_ler: 'schedule',
  lendo: 'menu_book',
  lido: 'check_circle',
}

const STATUS_CLASS: Record<string, string> = {
  quero_ler: 'bg-border/50 text-aco-texto',
  lendo: 'bg-brasa/15 text-brasa',
  lido: 'bg-ok/15 text-ok',
}

export function CursoCard({ course, areas }: CursoCardProps) {
  const navigate = useNavigate()
  const area = areas?.find((a) => a.id === course.dev_area_id)
  const statusIcon = STATUS_ICON[course.status ?? 'quero_ler'] ?? 'schedule'

  const initials = course.titulo
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <Card className="cursor-pointer hover:border-brasa/50 transition-colors" onClick={() => navigate(`/desenvolvimento/curso/${course.id}`)}>
      <CardContent className="flex items-start gap-3">
        <div
          className="size-14 shrink-0 rounded-md flex items-center justify-center text-lg font-bold text-white"
          style={{ backgroundColor: area ? areaTextColor(area.categoria) : '#6B7280' }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{course.titulo}</p>
              {course.provedor && <p className="text-xs text-aco-texto">{course.provedor}</p>}
              {course.plataforma && <p className="text-xs text-cinza2-texto">{course.plataforma}</p>}
              {course.carga_horaria && <p className="text-xs text-cinza2-texto">{course.carga_horaria}h</p>}
            </div>
            <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[course.status ?? 'quero_ler']}`}>
              <Icon name={statusIcon} size={12} />
              {STATUS_LABEL[course.status ?? 'quero_ler']}
            </span>
          </div>

          {(course.status === 'lendo' || course.status === 'lido') && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-aco-texto mb-1">
                <span>Progresso</span>
                <span>{course.progresso ?? 0}%</span>
              </div>
              <Progress value={course.progresso ?? 0} className="h-1.5" />
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {area && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: areaTextColor(area.categoria) + '20', color: areaTextColor(area.categoria) }}
                >
                  {area.nome}
                </span>
              )}
              {course.status === 'lido' && course.nota_geral && (
                <StarRating value={course.nota_geral} readonly size="sm" />
              )}
            </div>
            <div className="flex gap-1">
              {course.certificado_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-6 gap-1 text-xs text-ok"
                  onClick={(e) => { e.stopPropagation(); window.open(course.certificado_url!, '_blank') }}
                >
                  <Icon name="workspace_premium" size={12} />
                  Certificado
                  <Icon name="open_in_new" size={12} />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-6 text-xs"
                onClick={(e) => { e.stopPropagation(); navigate(`/desenvolvimento/curso/${course.id}`) }}
              >
                {course.status === 'lido' ? (<><Icon name="rate_review" size={16} className="mr-1.5 inline-block align-middle" />Review</>) : course.status === 'lendo' ? (<><Icon name="play_arrow" size={16} className="mr-1.5 inline-block align-middle" />Continuar</>) : (<><Icon name="add" size={16} className="mr-1.5 inline-block align-middle" />Iniciar</>)}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useReadings } from '@/hooks/use-readings'
import { useDevAreas } from '@/hooks/use-dev-areas'
import { areaTextColor } from '@/lib/desenvolvimento'

export function DevSummaryCard() {
  const navigate = useNavigate()
  const readings = useReadings()
  const devAreas = useDevAreas()

  const livroAtual = (readings.data ?? []).find((r) => r.status === 'lendo')
  const ultimaAcao = (readings.data ?? [])
    .filter((r) => r.status === 'lido' && r.acao_1)
    .slice(-1)[0]

  if (devAreas.isLoading || readings.isLoading) return null
  if ((devAreas.data ?? []).length === 0 && !livroAtual) return null

  return (
    <Card
      className="cursor-pointer hover:border-brasa/50 transition-colors"
      onClick={() => navigate('/desenvolvimento')}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-brasa" />
          <span className="font-heading text-sm font-semibold text-foreground">Desenvolvimento</span>
        </div>

        {/* Nivéis por área */}
        {(devAreas.data ?? []).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(devAreas.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center gap-1.5">
                <div className="size-2 rounded-full" style={{ backgroundColor: areaTextColor(a.categoria) }} />
                <span className="text-xs text-aco-texto">{a.nome.split(' ')[0]}</span>
                <span className="text-xs font-medium" style={{ color: areaTextColor(a.categoria) }}>
                  {a.nivel_atual?.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Livro atual */}
        {livroAtual && (
          <div>
            <p className="text-xs text-aco-texto">📚 Lendo agora</p>
            <p className="text-sm font-medium text-foreground line-clamp-1">{livroAtual.titulo}</p>
            <Progress value={livroAtual.progresso ?? 0} className="h-1 mt-1" />
            <p className="text-xs text-aco-texto mt-0.5">{livroAtual.progresso ?? 0}%</p>
          </div>
        )}

        {/* Última ação pendente */}
        {ultimaAcao?.acao_1 && (
          <div className="rounded-md border border-brasa/25 bg-brasa/5 p-2">
            <p className="text-xs text-aco-texto mb-0.5">⚡ Próxima ação</p>
            <p className="text-xs text-foreground line-clamp-2">{ultimaAcao.acao_1}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { AppVersionCard } from '@/components/settings/app-version-card'
import { WebPushCard } from '@/components/settings/web-push-card'
import { GoogleCalendarCard } from '@/components/calendar/google-calendar-card'
import { DailyRhythmCard } from '@/components/settings/daily-rhythm-card'
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { ActivityCalendar } from '@/components/ActivityCalendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DadosPreview } from '@/components/document-vision/dados-preview'
import { HealthCalculatorCard } from '@/components/health/health-calculator-card'
import { FoodDatabaseCard } from '@/components/nutrition/food-database-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentImports } from '@/hooks/use-document-imports'
import type { DadosExtraidos } from '@/hooks/useDocumentVision'
import type { DocumentImport, DocumentImportStatus, DocumentImportTipo } from '@/types/database'

const TIPO_EMOJI: Record<DocumentImportTipo, string> = {
  exame: '🧪',
  treino: '🏋️',
  dieta: '🥗',
  suplemento: '💊',
  outro: '📎',
}

const STATUS_LABEL: Record<DocumentImportStatus, string> = {
  confirmado: 'Confirmado',
  rejeitado: 'Rejeitado',
  erro: 'Erro',
  pendente: 'Pendente',
}

const STATUS_PILL_CLASS: Record<DocumentImportStatus, string> = {
  confirmado: 'bg-ok/15 text-ok',
  rejeitado: 'bg-aco-claro text-aco-texto',
  erro: 'bg-alerta/15 text-alerta-texto',
  pendente: 'bg-atencao/15 text-atencao',
}

export function ConfiguracoesPage() {
  const imports = useDocumentImports()
  const [selecionado, setSelecionado] = useState<DocumentImport | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-aco-texto">Saúde, base de alimentos, importações e atividade.</p>
      </div>

      <section className="flex flex-col gap-2" aria-labelledby="config-app">
        <h2 id="config-app" className="font-heading text-lg font-semibold text-foreground">
          App
        </h2>
        <AppVersionCard />
        <WebPushCard />
      </section>

      <HealthCalculatorCard />
      <GoogleCalendarCard />
      <DailyRhythmCard />

      <FoodDatabaseCard />

      <ActivityCalendar />

      <div>
        <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Importações</h2>

        {imports.isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : imports.isError ? (
          <ErrorState message="Não foi possível carregar as importações." onRetry={() => imports.refetch()} />
        ) : !imports.data || imports.data.length === 0 ? (
          <EmptyState message="Nenhuma importação ainda. Use o botão 📎 para enviar uma foto ou PDF." />
        ) : (
          <div className="flex flex-col gap-2">
            {imports.data.map((item) => (
              <Card key={item.id} size="sm">
                <CardContent className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-lg" aria-hidden="true">
                      {TIPO_EMOJI[item.tipo]}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {format(new Date(item.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className={`w-fit rounded-full px-2 py-0.5 text-xs ${STATUS_PILL_CLASS[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                  </div>
                  {item.dados_confirmados && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelecionado(item)}>
                      Ver dados
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dados confirmados</DialogTitle>
          </DialogHeader>
          {selecionado?.dados_confirmados && (
            <DadosPreview dados={selecionado.dados_confirmados as unknown as DadosExtraidos} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

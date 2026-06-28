import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLastYazioSync, useSyncYazioNow } from '@/hooks/use-yazio-sync'
import { parseDateOnly } from '@/lib/date'

export function YazioSyncFooter() {
  const lastSync = useLastYazioSync()
  const syncNow = useSyncYazioNow()

  const log = lastSync.data

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-aco-texto">
      <span>
        {lastSync.isLoading
          ? 'Carregando status do Yazio…'
          : !log
            ? 'Nenhuma sincronização com o Yazio ainda.'
            : log.status === 'sucesso'
              ? `Último sync Yazio: ${format(parseDateOnly(log.data), "d 'de' MMMM", { locale: ptBR })} às ${format(new Date(log.created_at), 'HH:mm')} · ${log.registros_importados} registro${log.registros_importados === 1 ? '' : 's'}`
              : `Falha no último sync Yazio (${format(new Date(log.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}): ${log.erro ?? 'erro desconhecido'}`}
      </span>
      <Button type="button" variant="outline" size="xs" disabled={syncNow.isPending} onClick={() => syncNow.mutate()}>
        <RefreshCw className={syncNow.isPending ? 'size-3 animate-spin' : 'size-3'} aria-hidden="true" />
        {syncNow.isPending ? 'Sincronizando…' : 'Sincronizar Yazio agora'}
      </Button>
    </div>
  )
}

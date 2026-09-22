import { useState } from 'react'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { usePWAUpdate } from '@/hooks/usePWAUpdate'
import type { ResultadoVerificacao } from '@/lib/pwa-update'

/** Data/hora do build (injetada pelo Vite) em pt-BR, no fuso de São Paulo. */
function dataDoBuild(): string {
  const data = new Date(__BUILD_DATE__)
  if (Number.isNaN(data.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(data)
}

/** Configurações → App: versão, data do build e verificação manual de atualização. */
export function AppVersionCard() {
  const { needRefresh, suportado, updateServiceWorker, verificarAtualizacao } = usePWAUpdate()
  const [verificando, setVerificando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoVerificacao | null>(null)

  async function verificar() {
    setVerificando(true)
    try {
      setResultado(await verificarAtualizacao())
    } finally {
      setVerificando(false)
    }
  }

  const disponivel = needRefresh || resultado === 'disponivel'

  return (
    <GlassCard className="flex flex-col gap-4" aria-labelledby="app-versao-titulo">
      <div className="flex items-center gap-2">
        <Icon name="system_update" size={22} className="text-brasa" />
        <h3 id="app-versao-titulo" className="text-[16px] font-bold text-nevoa">
          Versão do FORJA
        </h3>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="ds-label">Versão</dt>
          <dd className="text-[18px] font-bold tabular-nums text-nevoa [font-family:var(--font-display)]">{__APP_VERSION__}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="ds-label">Último build</dt>
          <dd className="text-[15px] font-semibold tabular-nums text-nevoa [font-family:var(--font-display)]">{dataDoBuild()}</dd>
        </div>
      </dl>

      <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-[14px] font-semibold">
        {!suportado ? (
          <span className="text-cinza">Atualização automática indisponível neste navegador</span>
        ) : resultado === 'sem_conexao' ? (
          <span className="flex items-center gap-1.5 text-atencao">
            <Icon name="info" size={18} />
            Sem conexão — tente novamente quando estiver online
          </span>
        ) : resultado === 'indisponivel' ? (
          <span className="flex items-center gap-1.5 text-cinza">
            <Icon name="info" size={18} />
            Atualização estará disponível após a instalação do app
          </span>
        ) : disponivel ? (
          <span className="flex items-center gap-1.5 text-brasa">
            <Icon name="system_update" size={18} filled />
            Atualização disponível
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-ok">
            <Icon name="check_circle" size={18} filled />
            App atualizado
          </span>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={verificar} disabled={!suportado || verificando} className="ds-btn-ghost min-h-11 px-4 disabled:opacity-50">
          <Icon name="refresh" size={18} className={verificando ? 'animate-spin' : undefined} />
          {verificando ? 'Verificando…' : 'Verificar atualização'}
        </button>
        {disponivel && (
          <button type="button" onClick={() => void updateServiceWorker(true)} className="ds-btn-primary min-h-11 px-4">
            Atualizar agora
          </button>
        )}
      </div>
    </GlassCard>
  )
}

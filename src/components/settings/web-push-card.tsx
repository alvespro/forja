import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Icon } from '@/components/Icon'
import { GlassCard } from '@/components/GlassCard'
import { ativarWebPush, desativarWebPush, webPushAtivo, webPushStatus } from '@/lib/web-push'

export function WebPushCard() {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const status = webPushStatus()

  useEffect(() => {
    void webPushAtivo().then(setActive).catch(() => setActive(false)).finally(() => setLoading(false))
  }, [])

  async function toggle() {
    setLoading(true)
    try {
      if (active) {
        await desativarWebPush()
        setActive(false)
        toast.success('Notificações neste dispositivo foram desativadas.')
      } else {
        await ativarWebPush()
        setActive(true)
        toast.success('Notificações ativadas. Você receberá alertas mesmo com o FORJA fechado.')
      }
    } catch (error) {
      toast.error(error instanceof Error && error.message === 'permissao_negada'
        ? 'Permissão bloqueada. Ative as notificações do FORJA nas configurações do navegador.'
        : 'Não foi possível ativar as notificações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const unavailable = status !== 'supported'
  const detail = status === 'unsupported'
    ? 'Este navegador não oferece notificações em segundo plano.'
    : 'Receba alertas de treino, refeições, agenda e prioridades mesmo com o app fechado.'

  return (
    <GlassCard className="flex flex-col gap-3" aria-labelledby="push-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2.5">
          <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${active ? 'bg-brasa/15 text-brasa' : 'bg-cinza/15 text-cinza'}`}>
            <Icon name="notifications" size={20} filled={active} />
          </span>
          <div>
            <h3 id="push-title" className="text-[16px] font-bold text-nevoa">Notificações do dispositivo</h3>
            <p className="mt-0.5 text-sm leading-5 text-aco-texto">{detail}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Ativar notificações neste dispositivo"
          aria-checked={active}
          disabled={unavailable || loading}
          onClick={() => void toggle()}
          className={`mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${active ? 'justify-end bg-brasa' : 'justify-start bg-cinza/40'}`}
        >
          <span className="size-5 rounded-full bg-white" />
        </button>
      </div>
      <p className="text-xs text-cinza">Ative em cada celular ou computador que desejar usar. Você pode desativar quando quiser.</p>
    </GlassCard>
  )
}

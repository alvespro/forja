import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { Icon } from '@/components/Icon'
import { haptic } from '@/lib/haptics'
import type { IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

import { MoreSheet } from './more-sheet'
import { isItemActive, isPrimaryPath, primaryNavItems } from './nav-items'

const itemCls =
  'relative flex min-h-[var(--tabbar-h)] flex-1 flex-col items-center justify-center gap-1 px-3 pt-2 pb-1.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

/**
 * Tab bar mobile estilo Liquid Glass: vidro escuro com blur pesado, 4 destinos +
 * "Mais". Ativo: ícone preenchido e rótulo em brasa, com a linha indicadora
 * crescendo (spring) acima do ícone. Respeita a safe area do iPhone.
 */
export function TabBar() {
  const location = useLocation()
  const [maisAberto, setMaisAberto] = useState(false)
  const maisAtivo = maisAberto || !isPrimaryPath(location.pathname)

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)] backdrop-blur-[30px] backdrop-saturate-[200%] md:hidden [html[data-immersive]_&]:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => haptic('light')}
            className={itemCls}
          >
            <TabContent icon={item.icon} label={item.label} ativo={isItemActive(item, location.pathname)} />
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setMaisAberto(true)}
          aria-haspopup="dialog"
          aria-expanded={maisAberto}
          className={itemCls}
        >
          <TabContent icon="grid_view" label="Mais" ativo={maisAtivo} />
        </button>
      </nav>

      <MoreSheet open={maisAberto} onClose={() => setMaisAberto(false)} />
    </>
  )
}

function TabContent({ icon, label, ativo }: { icon: IconName; label: string; ativo: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-0 h-0.5 w-5 rounded-[1px] bg-brasa"
        style={{
          transform: ativo ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform var(--dur-normal) var(--spring-bounce)',
        }}
      />
      <Icon name={icon} size={24} filled={ativo} className={ativo ? 'text-brasa' : 'text-cinza2'} />
      <span className={cn('text-[11px] font-semibold leading-none', ativo ? 'text-brasa' : 'text-aco-texto')}>{label}</span>
    </>
  )
}

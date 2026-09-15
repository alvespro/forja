import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'

import { cn } from '@/lib/utils'

import { MoreSheet } from './more-sheet'
import { isItemActive, isPrimaryPath, primaryNavItems } from './nav-items'

const itemCls =
  'relative flex min-h-[var(--tabbar-h)] flex-1 flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

/**
 * Tab bar mobile: 4 destinos + "Mais". Ativo: ícone e rótulo dot-matrix em brasa
 * com ponto indicador abaixo; inativo: só o ícone em cinza2. Preto com blur,
 * borda superior linha, respeita a safe area do iPhone.
 */
export function TabBar() {
  const location = useLocation()
  const [maisAberto, setMaisAberto] = useState(false)
  const maisAtivo = maisAberto || !isPrimaryPath(location.pathname)

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-linha pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] md:hidden [html[data-immersive]_&]:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
      >
        {primaryNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} aria-label={item.label} className={itemCls}>
            <TabContent Icon={item.icon} label={item.label} ativo={isItemActive(item, location.pathname)} />
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setMaisAberto(true)}
          aria-label="Mais"
          aria-haspopup="dialog"
          aria-expanded={maisAberto}
          className={itemCls}
        >
          <TabContent Icon={LayoutGrid} label="Mais" ativo={maisAtivo} />
        </button>
      </nav>

      <MoreSheet open={maisAberto} onClose={() => setMaisAberto(false)} />
    </>
  )
}

function TabContent({ Icon, label, ativo }: { Icon: typeof LayoutGrid; label: string; ativo: boolean }) {
  return (
    <>
      <Icon
        className={cn('size-[22px] transition-colors', ativo ? 'text-brasa' : 'text-cinza2')}
        strokeWidth={ativo ? 2.25 : 1.75}
        aria-hidden="true"
      />
      <span className={cn('ds-terminal-xs leading-none', ativo ? 'text-brasa' : 'sr-only')}>{label}</span>
      <span
        className={cn('size-1 rounded-full bg-brasa transition-opacity', ativo ? 'opacity-100' : 'opacity-0')}
        aria-hidden="true"
      />
    </>
  )
}

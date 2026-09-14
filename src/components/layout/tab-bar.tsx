import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'

import { cn } from '@/lib/utils'

import { MoreSheet } from './more-sheet'
import { isPrimaryPath, primaryNavItems } from './nav-items'

const itemCls =
  'relative flex min-h-[var(--tabbar-h)] flex-1 flex-col items-center justify-center gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

/**
 * Tab bar mobile: 4 destinos + "Mais". Ativo: ícone e rótulo em brasa com ponto
 * indicador; inativo: só o ícone. Fundo meia-noite com blur, respeita a safe area.
 */
export function TabBar() {
  const location = useLocation()
  const [maisAberto, setMaisAberto] = useState(false)
  const maisAtivo = maisAberto || !isPrimaryPath(location.pathname)

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-linha pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden [html[data-immersive]_&]:hidden"
        style={{ backgroundColor: 'rgba(11,18,32,0.88)' }}
      >
        {primaryNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} aria-label={label} className={itemCls}>
            {({ isActive }) => <TabContent Icon={Icon} label={label} ativo={isActive} />}
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
        className={cn('size-6 transition-transform', ativo ? 'text-brasa' : 'text-aco-texto')}
        strokeWidth={ativo ? 2.25 : 1.75}
        aria-hidden="true"
      />
      <span
        className={cn(
          'text-[10px] font-semibold leading-none',
          ativo ? 'text-brasa' : 'sr-only',
        )}
      >
        {label}
      </span>
      <span
        className={cn('absolute top-1.5 size-1 rounded-full bg-brasa transition-opacity', ativo ? 'opacity-100' : 'opacity-0')}
        aria-hidden="true"
      />
    </>
  )
}

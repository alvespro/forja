import { NavLink, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { StatusDot } from '@/components/ds/status-dot'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

import { isItemActive, primaryNavItems, secondaryNavGroups, type NavItem } from './nav-items'

/** Sidebar desktop (≥768px): 220px, logo, destinos agrupados e perfil no rodapé. */
export function Sidebar() {
  const { user } = useAuth()
  const profile = useProfile()
  const nome = profile.data?.nome?.trim() || user?.email?.split('@')[0] || 'Você'

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-linha bg-fundo md:flex">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <span className="ds-terminal-2xl leading-none tracking-[0.12em] text-nevoa">FORJA</span>
        <StatusDot color="brasa" pulse />
      </div>

      <nav aria-label="Navegação principal" className="ds-scroll flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {primaryNavItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </ul>

        {secondaryNavGroups.map((grupo) => (
          <div key={grupo.titulo} className="flex flex-col gap-1">
            <span className="ds-label px-3">{grupo.titulo}</span>
            <ul className="flex flex-col gap-0.5">
              {grupo.itens.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3 border-t border-linha px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-aco-claro ds-body-md font-bold text-brasa" aria-hidden="true">
          {nome[0]?.toUpperCase()}
        </span>
        <span className="ds-body-sm min-w-0 flex-1 truncate font-medium text-foreground">{nome}</span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          aria-label="Sair da conta"
          className="flex size-9 items-center justify-center rounded-full text-aco-texto outline-none hover:text-alerta-texto focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const { to, label, icon: Icon } = item
  const isActive = isItemActive(item, useLocation().pathname)
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        className={cn(
          'relative flex min-h-11 items-center gap-3 rounded-r-[var(--r-sm)] border-l-2 px-3 text-[14px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
          isActive ? 'border-brasa bg-aco text-nevoa' : 'border-transparent text-cinza hover:bg-aco hover:text-nevoa',
        )}
      >
        <Icon className={cn('size-[18px] shrink-0', isActive && 'text-brasa')} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </NavLink>
    </li>
  )
}

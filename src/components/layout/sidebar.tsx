import { NavLink, useLocation } from 'react-router-dom'

import { Icon } from '@/components/Icon'
import { StatusDot } from '@/components/ds/status-dot'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

import { isItemActive, primaryNavItems, secondaryNavGroups, type NavItem } from './nav-items'

// Rótulos só aparecem com a sidebar expandida (hover ou foco de teclado dentro dela).
const revela = 'opacity-0 transition-opacity duration-150 group-hover/side:opacity-100 group-focus-within/side:opacity-100'

/**
 * Sidebar desktop (≥768px) estilo Aaru: ocupa 64px (só ícones) e expande para
 * 220px por cima do conteúdo no hover/foco — o layout da página não se mexe.
 */
export function Sidebar() {
  const { user } = useAuth()
  const profile = useProfile()
  const nome = profile.data?.nome?.trim() || user?.email?.split('@')[0] || 'Você'
  const iniciais = nome
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-16 shrink-0 md:block">
      <div
        className="group/side absolute inset-y-0 left-0 flex w-16 flex-col overflow-hidden border-r border-white/[0.06] backdrop-blur-[20px] transition-[width] duration-[var(--dur-normal)] ease-[var(--spring-smooth)] hover:w-[220px] focus-within:w-[220px]"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 pl-[22px]">
          <span className="relative flex h-6 w-5 shrink-0 items-center" aria-hidden="true">
            <span className="text-[24px] font-extrabold leading-none text-brasa transition-opacity duration-150 group-hover/side:opacity-0 group-focus-within/side:opacity-0">
              F
            </span>
          </span>
          <span className={cn('-ml-7 flex items-center gap-2 whitespace-nowrap text-[18px] font-bold tracking-[-0.01em] text-nevoa', revela)}>
            FORJA
            <StatusDot color="brasa" pulse />
          </span>
          <span className="sr-only">FORJA</span>
        </div>

        <nav aria-label="Navegação principal" className="ds-scroll flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden py-2">
          <ul className="flex flex-col gap-0.5">
            {primaryNavItems.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </ul>

          {secondaryNavGroups.map((grupo) => (
            <div key={grupo.titulo} className="flex flex-col gap-1">
              <span className="relative flex h-4 items-center px-5">
                <span className="absolute inset-x-5 h-px bg-white/[0.06] transition-opacity group-hover/side:opacity-0 group-focus-within/side:opacity-0" aria-hidden="true" />
                <span className={cn('ds-label whitespace-nowrap', revela)}>{grupo.titulo}</span>
              </span>
              <ul className="flex flex-col gap-0.5">
                {grupo.itens.map((item) => (
                  <SidebarLink key={item.to} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 border-t border-white/[0.06] py-3 pl-3.5 pr-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brasa text-[13px] font-bold text-fundo" aria-hidden="true">
            {iniciais}
          </span>
          <span className={cn('min-w-0 flex-1 truncate whitespace-nowrap text-[13px] font-medium text-nevoa', revela)}>{nome}</span>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            aria-label="Sair da conta"
            className={cn('flex size-9 shrink-0 items-center justify-center rounded-full text-cinza outline-none hover:text-alerta-texto focus-visible:ring-2 focus-visible:ring-ring', revela)}
          >
            <Icon name="logout" size={20} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const { to, label, icon } = item
  const isActive = isItemActive(item, useLocation().pathname)
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        aria-label={label}
        className={cn(
          'relative flex min-h-11 items-center gap-3 border-l-2 pl-[19px] pr-3 text-[14px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          isActive
            ? 'border-brasa bg-[rgba(252,76,19,0.08)] text-brasa'
            : 'border-transparent text-cinza2-texto hover:bg-white/[0.04] hover:text-cinza',
        )}
      >
        <Icon name={icon} size={22} filled={isActive} />
        <span className={cn('truncate whitespace-nowrap', revela)}>{label}</span>
      </NavLink>
    </li>
  )
}

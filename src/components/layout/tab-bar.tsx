import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { navItems } from './nav-items'

export function TabBar() {
  return (
    <nav
      aria-label="Navegação principal"
      className="no-scrollbar fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex min-w-[72px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-muted-foreground',
              isActive && 'text-primary',
            )
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

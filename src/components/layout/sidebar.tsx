import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { navItems } from './nav-items'

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="size-2 rounded-full bg-brasa" aria-hidden="true" />
        <span className="font-heading text-lg font-bold tracking-wide text-sidebar-foreground">
          FORJA
        </span>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-primary',
              )
            }
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

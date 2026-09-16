import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Modal } from '@/components/ui/modal'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

import { secondaryNavGroups } from './nav-items'

/** Folha "Mais" da tab bar: as telas secundárias em grade, agrupadas, e sair da conta. */
export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Mais" maxWidth="md">
      <div className="flex flex-col gap-5 pb-2">
        {secondaryNavGroups.map((grupo) => (
          <section key={grupo.titulo} className="flex flex-col gap-2">
            <span className="ds-label">{grupo.titulo}</span>
            <div className="grid grid-cols-3 gap-2">
              {grupo.itens.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'ds-pressable-card flex min-h-20 flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border px-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive ? 'border-brasa/60 bg-brasa/10 text-brasa' : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-nevoa',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon name={icon} size={24} filled={isActive} />
                      <span className="line-clamp-2 w-full break-words leading-tight ds-body-sm font-medium [hyphens:auto]">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() => {
            onClose()
            void supabase.auth.signOut()
          }}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-linha ds-body-md font-semibold text-aco-texto outline-none hover:text-alerta-texto focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="logout" size={18} />
          Sair da conta
        </button>
      </div>
    </Modal>
  )
}

import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Modal } from '@/components/ui/modal'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { abrirMenuDocumentUpload } from '@/lib/document-upload-store'
import { launchForjaChat } from '@/lib/forja-chat-store'

import { secondaryNavGroups } from './nav-items'

/** Folha "Mais" da tab bar: as telas secundárias em grade, agrupadas, e sair da conta. */
export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Mais" maxWidth="md">
      <div className="flex flex-col gap-5 pb-2">
        <section className="flex flex-col gap-2" aria-label="Acessos rápidos">
          <span className="ds-label">Acessos rápidos</span>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to="/agenda"
              onClick={onClose}
              className="ds-pressable-card flex min-h-16 items-center gap-3 rounded-[var(--radius-md)] border border-linha bg-aco px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brasa/15 text-brasa"><Icon name="calendar_today" size={19} /></span>
              <span className="text-sm font-semibold text-nevoa">Agenda</span>
            </NavLink>
            <NavLink
              to="/tarefas"
              onClick={onClose}
              className="ds-pressable-card flex min-h-16 items-center gap-3 rounded-[var(--radius-md)] border border-linha bg-aco px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brasa/15 text-brasa"><Icon name="checklist" size={19} /></span>
              <span className="text-sm font-semibold text-nevoa">Tarefas</span>
            </NavLink>
          </div>
        </section>
        <button
          type="button"
          onClick={() => {
            onClose()
            launchForjaChat({ agente: 'coach' })
          }}
          className="flex min-h-12 items-center gap-3 rounded-[var(--r-md)] border border-brasa/45 bg-brasa/10 px-4 text-left text-sm font-semibold text-nevoa outline-none transition-colors hover:bg-brasa/15 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="psychology" size={20} className="text-brasa" />
          Falar com a IA FORJA
        </button>
        <button
          type="button"
          onClick={() => {
            onClose()
            abrirMenuDocumentUpload()
          }}
          className="flex min-h-12 items-center gap-3 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 text-left text-sm font-semibold text-nevoa outline-none transition-colors hover:border-brasa/60 hover:bg-brasa/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="attach_file" size={20} className="text-brasa" />
          Importar documento
        </button>
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

import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

type ModalProps = {
  open: boolean
  onClose: () => void
  /** Título exibido no header e anunciado por leitores de tela. */
  title: ReactNode
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

const MAX_WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' } as const

/**
 * Modal padrão do app sobre Radix Dialog: foco preso dentro do modal,
 * Esc e clique no backdrop fecham, `aria-modal` e título anunciados.
 * Substitui os shells de <div fixed inset-0> copiados entre as páginas
 * (ver docs/REFATORACAO.md, etapa 5).
 */
export function Modal({ open, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full flex-col gap-4 overflow-y-auto',
            'rounded-t-2xl border border-border bg-card p-5 shadow-2xl outline-none',
            'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
            MAX_WIDTH[maxWidth],
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="font-heading text-base font-bold text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="text-aco-texto transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

import { useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

type ModalProps = {
  open: boolean
  onClose: () => void
  /** Título exibido no header e anunciado por leitores de tela. */
  title: ReactNode
  /** Linha de apoio opcional abaixo do título. */
  description?: ReactNode
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

const MAX_WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' } as const

const SWIPE_CLOSE_THRESHOLD = 100

/**
 * Modal padrão do app sobre Radix Dialog: bottom-sheet no mobile (com handle de
 * arraste e gesto de swipe-down para fechar) e diálogo centralizado no desktop.
 * Entrada animada (slide-up 280ms) desligada automaticamente sob prefers-reduced-motion
 * pela regra global em index.css. Foco preso, Esc e clique no backdrop fecham.
 */
export function Modal({ open, onClose, title, description, children, maxWidth = 'md' }: ModalProps) {
  const [dragY, setDragY] = useState(0)
  const startY = useRef<number | null>(null)

  function handleTouchStart(event: TouchEvent) {
    startY.current = event.touches[0]?.clientY ?? null
  }
  function handleTouchMove(event: TouchEvent) {
    if (startY.current === null) return
    const delta = (event.touches[0]?.clientY ?? 0) - startY.current
    setDragY(Math.max(0, delta))
  }
  function handleTouchEnd() {
    if (dragY > SWIPE_CLOSE_THRESHOLD) onClose()
    startY.current = null
    setDragY(0)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full flex-col gap-3 overflow-y-auto',
            'rounded-t-[20px] border border-border bg-card p-5 outline-none',
            'shadow-[0_-4px_32px_rgba(0,0,0,0.4)]',
            'ease-[cubic-bezier(0.32,0.72,0,1)] duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:shadow-2xl',
            'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
            MAX_WIDTH[maxWidth],
          )}
        >
          {/* Handle de arraste (mobile) — swipe para baixo fecha */}
          <div
            className="mx-auto -mt-1 mb-1 h-1 w-10 shrink-0 cursor-grab rounded-full bg-aco-texto/40 sm:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-hidden="true"
          />

          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <DialogPrimitive.Title className="font-heading text-base font-bold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-xs text-aco-texto">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="shrink-0 text-aco-texto transition-colors hover:text-foreground"
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

import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: ReactNode
  htmlFor: string
  /** Mensagem de validação: deixa o campo vermelho (via aria-invalid no controle) e aparece logo abaixo. */
  erro?: string | null
  dica?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Label + controle + erro inline. O controle filho deve receber
 * `aria-invalid={!!erro}` e `aria-describedby={idErro(htmlFor)}` (ver `propsDeErro`).
 */
export function FormField({ label, htmlFor, erro, dica, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {erro ? (
        <p id={idErro(htmlFor)} role="alert" className="text-[12px] font-medium text-alerta-texto">
          {erro}
        </p>
      ) : dica ? (
        <p className="text-[12px] text-cinza2-texto">{dica}</p>
      ) : null}
    </div>
  )
}

export const idErro = (htmlFor: string) => `${htmlFor}-erro`

/** Atributos de acessibilidade do controle ligado a um FormField. */
export function propsDeErro(htmlFor: string, erro?: string | null) {
  return { id: htmlFor, 'aria-invalid': !!erro || undefined, 'aria-describedby': erro ? idErro(htmlFor) : undefined }
}

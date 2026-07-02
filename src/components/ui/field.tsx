import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Campos de formulário padrão do app (label pequena + controle estilizado).
 * Extraídos porque a mesma string de classes estava repetida ~25× —
 * ver docs/REFATORACAO.md, etapa 5.
 */

const controlCls =
  'mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring'

type FieldInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode
  /** Classe extra no wrapper (ex.: col-span em grids). */
  wrapperClassName?: string
}

export function FieldInput({ label, wrapperClassName, className, ...props }: FieldInputProps) {
  return (
    <div className={wrapperClassName}>
      <Label className="text-xs text-aco-texto">{label}</Label>
      <input className={cn(controlCls, className)} {...props} />
    </div>
  )
}

type FieldSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode
  wrapperClassName?: string
}

export function FieldSelect({ label, wrapperClassName, className, children, ...props }: FieldSelectProps) {
  return (
    <div className={wrapperClassName}>
      <Label className="text-xs text-aco-texto">{label}</Label>
      <select className={cn(controlCls, className)} {...props}>
        {children}
      </select>
    </div>
  )
}

type FieldTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode
  wrapperClassName?: string
}

export function FieldTextarea({ label, wrapperClassName, className, ...props }: FieldTextareaProps) {
  return (
    <div className={wrapperClassName}>
      <Label className="text-xs text-aco-texto">{label}</Label>
      <textarea
        className={cn(
          'mt-1 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring',
          className,
        )}
        {...props}
      />
    </div>
  )
}

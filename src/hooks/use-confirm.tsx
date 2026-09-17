import { useCallback, useRef, useState } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /**
   * Dado crítico (exame, pesagem, composto, refeição): confirmar exige digitar
   * CONFIRMAR ou tocar duas vezes no botão vermelho.
   */
  critico?: boolean
}

const PALAVRA = 'CONFIRMAR'

/**
 * Substitui window.confirm() por um diálogo acessível (foco preso, Esc fecha,
 * anunciado por leitores de tela). Uso: `if (!(await confirm({ title }))) return`,
 * e renderize `{dialog}` uma vez na árvore do componente.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [texto, setTexto] = useState('')
  const [armado, setArmado] = useState(false)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setTexto('')
    setArmado(false)
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function settle(value: boolean) {
    resolveRef.current?.(value)
    resolveRef.current = null
    setOptions(null)
  }

  function handleConfirmar() {
    if (!options?.critico || texto.trim().toUpperCase() === PALAVRA || armado) {
      settle(true)
      return
    }
    // Primeiro toque só arma; o segundo confirma.
    setArmado(true)
  }

  const label = options?.confirmLabel ?? 'Excluir'

  const dialog = (
    <AlertDialog
      open={options !== null}
      onOpenChange={(open) => {
        if (!open) settle(false)
      }}
    >
      {options && (
        <AlertDialogContent className="rounded-[20px] border-[var(--glass-border)] bg-[rgba(16,16,16,0.86)] backdrop-blur-[30px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
          </AlertDialogHeader>

          {options.critico && (
            <label className="flex flex-col gap-1.5 text-[13px] text-cinza">
              Digite {PALAVRA} ou toque duas vezes no botão vermelho
              <Input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={PALAVRA}
                autoCapitalize="characters"
                autoComplete="off"
                aria-label={`Digite ${PALAVRA} para confirmar`}
              />
            </label>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>{options.cancelLabel ?? 'Cancelar'}</AlertDialogCancel>
            {/* Button comum (não AlertDialogAction): o primeiro toque do modo crítico não pode fechar o diálogo. */}
            <Button type="button" variant="destructive" onClick={handleConfirmar} aria-live="polite">
              {options.critico && armado && texto.trim().toUpperCase() !== PALAVRA ? `Toque de novo para ${label.toLowerCase()}` : label}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )

  return { confirm, dialog }
}

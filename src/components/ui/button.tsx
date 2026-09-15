import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-[var(--r-md)] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primário: vermilion com texto preto (6,2:1, AA) e brilho brasa.
        default: "bg-brasa text-fundo shadow-[var(--shadow-brasa)] hover:bg-brasa2 hover:-translate-y-px",
        // Neutro (ghost do design system): aço, borda linha, texto cinza.
        outline:
          "border-linha bg-aco text-cinza hover:border-cinza hover:text-nevoa aria-expanded:border-cinza aria-expanded:text-nevoa",
        // Secundário: contorno vermilion.
        secondary: "border-brasa bg-transparent text-brasa hover:bg-brasa/10 aria-expanded:bg-brasa/10",
        ghost: "text-cinza hover:bg-aco hover:text-nevoa aria-expanded:bg-aco aria-expanded:text-nevoa",
        destructive:
          "bg-alerta/15 text-alerta-texto hover:bg-alerta/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Toque mínimo 44px: default já tem 44; sm/xs expandem a área clicável com after:.
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-[var(--r-sm)] px-2 text-xs after:absolute after:-inset-2 after:content-[''] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[var(--r-sm)] px-3 text-[0.85rem] after:absolute after:-inset-1 after:content-[''] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        // Toque mínimo de 44px (Seção 8 do SPEC): after:-inset-* expande a área clicável
        // sem aumentar o tamanho visual do botão.
        icon: "size-8 after:absolute after:-inset-1.5 after:content-['']",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3 after:absolute after:-inset-2.5 after:content-['']",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg after:absolute after:-inset-2 after:content-['']",
        "icon-lg": "size-9 after:absolute after:-inset-1 after:content-['']",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

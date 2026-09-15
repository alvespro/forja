import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Números (type=number / inputmode decimal|numeric) em Space Mono.
        "h-11 w-full min-w-0 rounded-[var(--r-sm)] border border-linha bg-aco px-3 py-1 text-base text-nevoa transition-[color,border-color,box-shadow] outline-none focus:border-brasa focus:shadow-[0_0_0_3px_rgba(252,76,19,0.15)] [&[type=number]]:[font-family:var(--font-data)] [&[inputmode=decimal]]:[font-family:var(--font-data)] [&[inputmode=numeric]]:[font-family:var(--font-data)] file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-cinza2 focus-visible:border-brasa disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-alerta aria-invalid:ring-3 aria-invalid:ring-alerta/25 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-11 w-full min-w-0 appearance-none rounded-[var(--r-sm)] border border-linha bg-aco text-nevoa px-2.5 py-1 pr-7 text-base transition-colors outline-none focus-visible:border-brasa focus-visible:shadow-[0_0_0_3px_rgba(252,76,19,0.15)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}

export { Select }

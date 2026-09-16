import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { haptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/Icon"

/** Checkbox do design system: aço desmarcado, vermilion marcado, vibração leve (10ms) ao alternar. */
function Checkbox({
  className,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-linha bg-aco transition-colors duration-150 outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-3 focus-visible:border-brasa focus-visible:ring-3 focus-visible:ring-brasa/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-alerta aria-invalid:ring-3 aria-invalid:ring-alerta/25 data-checked:border-brasa data-checked:bg-brasa data-checked:text-nevoa",
        className
      )}
      onCheckedChange={(checked) => {
        haptic("light")
        onCheckedChange?.(checked)
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none "
      >
        <Icon name="check" size={14} filled />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

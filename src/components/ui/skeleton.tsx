import { cn } from "@/lib/utils"

/** Loading com shimmer (gradiente percorrendo da esquerda para a direita). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("ds-shimmer rounded-[var(--radius-md)]", className)}
      {...props}
    />
  )
}

export { Skeleton }

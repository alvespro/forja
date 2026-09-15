import { cn } from "@/lib/utils"

type SkeletonShape = "card" | "line" | "circle" | "text"

const SHAPE: Record<SkeletonShape, string> = {
  card: "h-28 w-full rounded-[var(--r-md)]",
  line: "h-3 w-full rounded-full",
  circle: "size-12 rounded-full",
  text: "h-4 w-2/3 rounded-[var(--r-sm)]",
}

/** Loading com shimmer (#1D1D1D → #2D2D2D). `shape` dá o formato padrão; className ajusta. */
function Skeleton({
  className,
  shape,
  ...props
}: React.ComponentProps<"div"> & { shape?: SkeletonShape }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("ds-shimmer rounded-[var(--radius-md)]", shape && SHAPE[shape], className)}
      {...props}
    />
  )
}

export { Skeleton }

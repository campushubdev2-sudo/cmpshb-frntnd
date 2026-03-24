import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"

function Spinner({ className, size = "default", ...props }: Omit<React.ComponentProps<"svg">, "strokeWidth"> & { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "size-3",
    default: "size-4",
    lg: "size-6",
  }
  return (
    <HugeiconsIcon icon={Loading03Icon} role="status" aria-label="Loading" className={cn("animate-spin", sizeClasses[size], className)} {...props} />
  )
}

export { Spinner }

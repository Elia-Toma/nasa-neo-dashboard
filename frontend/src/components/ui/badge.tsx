import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 gap-1 transition-colors [&>svg]:h-3 [&>svg]:w-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline: "text-foreground",
        nominal:
          "border-[color:var(--nasa-cyan)]/35 bg-[color:var(--nasa-cyan)]/10 text-[color:var(--nasa-dark-blue)] dark:text-[color:var(--nasa-cyan)]",
        hazard:
          "border-[color:var(--nasa-red)]/40 bg-[color:var(--nasa-red)]/12 text-[color:var(--nasa-red)] dark:text-[#ffb3a7]",
        success:
          "border-[color:var(--nasa-cyan)]/35 bg-[color:var(--nasa-cyan)]/10 text-[color:var(--nasa-dark-blue)] dark:text-[color:var(--nasa-cyan)]",
        warning:
          "border-[color:var(--nasa-red)]/40 bg-[color:var(--nasa-red)]/12 text-[color:var(--nasa-red)] dark:text-[#ffb3a7]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }

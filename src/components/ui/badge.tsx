import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[14px] px-3 py-1 text-sm font-inter font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 max-w-full truncate",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        accent: "border-transparent bg-accent/20 text-accent-foreground",
        premium: "border-transparent bg-primary/10 text-primary",
        luxury: "border-transparent bg-accent/20 text-accent-foreground",
        outline: "border border-input text-foreground bg-background",
        soft: "border-transparent bg-muted text-muted-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-[12px]",
        default: "px-3 py-1 text-sm rounded-[14px]",
        lg: "px-4 py-1.5 text-base rounded-[16px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

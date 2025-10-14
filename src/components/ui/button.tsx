import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "pliiz-btn",
  {
    variants: {
      variant: {
        default: "",
        secondary: "pliiz-btn--secondary",
        outline: "pliiz-btn--secondary",
        tertiary: "!bg-transparent !border-0 underline-offset-4 hover:underline",
        ghost: "pliiz-btn--ghost",
        destructive: "!bg-red-500 hover:!bg-red-600",
        gradient: "",
        kit: "",
        auth: "",
      },
      size: {
        default: "",
        sm: "!h-10 !px-4 text-sm",
        lg: "!h-14 !px-8 text-base",
        icon: "!h-12 !w-12 !p-0",
        compact: "!h-8 !px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

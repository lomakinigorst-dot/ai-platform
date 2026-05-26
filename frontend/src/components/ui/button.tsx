import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b5fd4] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#6b5fd4] text-white hover:bg-[#5a4fc3] shadow-sm",
        destructive: "bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        outline: "border border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#f4f3f8]",
        secondary: "bg-[#f4f3f8] text-[#111827] hover:bg-[#ede9ff]",
        ghost: "text-[#6b7280] hover:bg-[#f4f3f8] hover:text-[#111827]",
        link: "text-[#6b5fd4] underline-offset-4 hover:underline",
        accent: "bg-[#f97316] text-white hover:bg-[#ea6c0a] shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

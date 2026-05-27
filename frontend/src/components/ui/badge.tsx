import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#ede9ff] text-[#6b5fd4]",
        secondary: "bg-[#f4f3f8] text-[#6b7280]",
        success: "bg-[#dcfce7] text-[#16a34a]",
        warning: "bg-[#fef3c7] text-[#d97706]",
        destructive: "bg-[#fee2e2] text-[#dc2626]",
        accent: "bg-[#fff3e8] text-[#f97316]",
        outline: "border border-[#e5e7eb] text-[#6b7280]",
        pro: "bg-[#6b5fd4] text-white",
        lite: "bg-[#f4f3f8] text-[#6b7280] border border-[#e5e7eb]",
        trial: "bg-[#fff3e8] text-[#f97316] border border-[#fed7aa]",
        locked: "bg-[#f4f3f8] text-[#9ca3af]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

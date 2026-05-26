import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-[8px] bg-[#f4f3f8]", className)} {...props} />
  )
}

export { Skeleton }

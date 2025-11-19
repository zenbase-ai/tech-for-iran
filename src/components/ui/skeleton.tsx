import { Box, type BoxProps } from "@/components/layout/box"
import { cn } from "@/lib/utils"

export const Skeleton: React.FC<BoxProps> = ({ className, ...props }) => (
  <Box
    className={cn("bg-muted animate-pulse rounded-lg", className)}
    data-slot="skeleton"
    {...props}
  />
)

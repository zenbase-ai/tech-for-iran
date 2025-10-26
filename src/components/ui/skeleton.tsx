import { Box, type BoxProps } from "@/components/layout/box"
import { cn } from "@/lib/utils"

export const Skeleton: React.FC<BoxProps> = ({ className, ...props }) => (
  <Box
    data-slot="skeleton"
    className={cn("bg-muted animate-pulse rounded-lg", className)}
    {...props}
  />
)

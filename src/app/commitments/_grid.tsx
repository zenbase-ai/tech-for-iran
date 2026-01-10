import { Grid, type GridProps } from "@/components/layout/grid"
import { cn } from "@/lib/utils"

export type CommitmentsGridProps = GridProps

/**
 * CommitmentsGrid - Responsive grid layout for commitment cards.
 *
 * Layout:
 * - Mobile: 1 column
 * - Tablet (md): 2 columns
 * - Desktop (lg): 3 columns
 */
export const CommitmentsGrid: React.FC<CommitmentsGridProps> = ({ className, ...props }) => (
  <Grid
    className={cn(
      "w-full max-w-5xl mx-auto gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      className
    )}
    {...props}
  />
)

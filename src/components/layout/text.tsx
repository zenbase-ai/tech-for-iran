import { cn } from "@/lib/utils"

export const PageTitle: React.FC<React.ComponentProps<"h1">> = ({ className, ...props }) => (
  <h1
    className={cn("text-3xl font-lighter font-serif italic leading-none!", className)}
    {...props}
  />
)

export const PageDescription: React.FC<React.ComponentProps<"p">> = ({ className, ...props }) => (
  <p className={cn("text-muted-foreground text-balance", className)} {...props} />
)

export const SectionTitle: React.FC<React.ComponentProps<"h2">> = ({ className, ...props }) => (
  <h2 className={cn("text-xl font-medium font-serif", className)} {...props} />
)

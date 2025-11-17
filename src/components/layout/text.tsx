import { cn } from "@/lib/utils"

export const PageTitle: React.FC<React.ComponentProps<"h1">> = ({ className, ...props }) => (
  <h1
    className={cn("text-xl md:text-2xl font-bold mb-2 font-serif italic", className)}
    {...props}
  />
)

export const PageDescription: React.FC<React.ComponentProps<"p">> = ({ className, ...props }) => (
  <p className={cn("text-muted-foreground", className)} {...props} />
)

export const SectionTitle: React.FC<React.ComponentProps<"h2">> = ({ className, ...props }) => (
  <h2 className={cn("text-base md:text-lg font-semibold", className)} {...props} />
)

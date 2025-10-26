import { cn } from "@/lib/utils"

export type ContainerProps = React.ComponentProps<"section">

export const Container: React.FC<ContainerProps> = ({ children, className, ...props }) => (
  <section className={cn("container mx-auto px-4 md:px-8 lg:px-10", className)} {...props}>
    {children}
  </section>
)

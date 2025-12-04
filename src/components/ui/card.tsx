import { cn } from "@/lib/utils"

export const Card: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn(
      "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
      className
    )}
    data-slot="card"
    {...props}
  />
)

export const CardHeader: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn(
      "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
      className
    )}
    data-slot="card-header"
    {...props}
  />
)

export const CardTitle: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div className={cn("leading-none font-semibold", className)} data-slot="card-title" {...props} />
)

export const CardDescription: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn("text-muted-foreground text-sm", className)}
    data-slot="card-description"
    {...props}
  />
)

export const CardAction: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
    data-slot="card-action"
    {...props}
  />
)

export const CardContent: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div className={cn("px-6", className)} data-slot="card-content" {...props} />
)

export const CardFooter: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
    data-slot="card-footer"
    {...props}
  />
)

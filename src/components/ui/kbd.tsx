import { cn } from "@/lib/utils"

export const Kbd: React.FC<React.ComponentProps<"kbd">> = ({ className, ...props }) => (
  <kbd
    className={cn(
      "bg-muted text-foreground/80 pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-mono text-sm font-bold select-none",
      "[&_svg:not([class*='size-'])]:size-3",
      "in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10",
      className
    )}
    data-slot="kbd"
    {...props}
  />
)

export const KbdGroup: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <kbd
    className={cn("inline-flex items-center gap-1", className)}
    data-slot="kbd-group"
    {...props}
  />
)

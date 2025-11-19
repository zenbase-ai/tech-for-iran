import { cn } from "@/lib/utils"

export const Textarea: React.FC<React.ComponentProps<"textarea">> = ({ className, ...props }) => (
  <textarea
    className={cn(
      "flex field-sizing-content min-h-16 w-full px-3 py-2",
      "rounded-lg border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
      "text-base md:text-sm",
      "placeholder:text-muted-foreground",
      "dark:bg-input/30",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      className
    )}
    data-slot="textarea"
    {...props}
  />
)

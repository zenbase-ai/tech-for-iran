import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<"input">

export const Input: React.FC<InputProps> = ({ className, type, ...props }) => (
  <input
    type={type}
    data-slot="input"
    className={cn(
      "h-9 w-full min-w-0 px-3 py-1",
      "rounded-lg border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
      "text-base md:text-sm",
      "placeholder:text-muted-foreground",
      "dark:bg-input/30",
      "selection:bg-primary selection:text-primary-foreground",
      "file:text-foreground file:inline-flex file:h-9 file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      className,
    )}
    {...props}
  />
)

import { cn } from "@/lib/utils"

export type ErrorAlertProps = React.ComponentProps<"div">

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive",
      className
    )}
    data-slot="error-alert"
    role="alert"
    {...props}
  />
)

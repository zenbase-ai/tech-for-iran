import { cn } from "@/lib/utils"

export type InlineFieldProps = React.ComponentProps<"div"> & {
  error?: { message?: string }
  errorId?: string
}

export const InlineField: React.FC<InlineFieldProps> = ({
  className,
  children,
  error,
  errorId,
  ...props
}) => (
  // biome-ignore lint/a11y/useSemanticElements: inline field styling
  <div
    className={cn("inline-flex w-auto", className)}
    data-invalid={!!error}
    data-slot="inline-field"
    role="group"
    {...props}
  >
    {children}
  </div>
)

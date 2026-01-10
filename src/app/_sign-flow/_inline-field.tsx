import type { ControllerFieldState, ControllerRenderProps } from "react-hook-form"
import { cn } from "@/lib/utils"

// =================================================================
// Types
// =================================================================

export type InlineFieldProps = {
  field: ControllerRenderProps<Record<string, string>, string>
  fieldState: ControllerFieldState
  placeholder: string
  maxLength: number
  disabled?: boolean
  autoComplete?: string
  minWidth?: string
  inputRef?: React.Ref<HTMLInputElement>
  className?: string
}

// =================================================================
// Component
// =================================================================

export const InlineField: React.FC<InlineFieldProps> = ({
  field,
  fieldState,
  placeholder,
  maxLength,
  disabled = false,
  autoComplete,
  minWidth = "min-w-36",
  inputRef,
  className,
}) => {
  const errorId = fieldState.error ? `${field.name}-error` : undefined

  return (
    <span className="inline-flex flex-col">
      <input
        {...field}
        aria-describedby={errorId}
        aria-invalid={fieldState.invalid}
        autoComplete={autoComplete}
        className={cn(
          "inline-block border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
          "border-input placeholder:text-muted-foreground/50",
          "focus:border-primary",
          fieldState.invalid && "border-destructive",
          minWidth,
          className
        )}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        ref={(el) => {
          field.ref(el)
          if (inputRef && typeof inputRef === "function") {
            inputRef(el)
          } else if (inputRef && typeof inputRef === "object") {
            ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
          }
        }}
        type="text"
      />
      {fieldState.error && (
        <span className="mt-1 text-sm text-destructive" id={errorId}>
          {fieldState.error.message}
        </span>
      )}
    </span>
  )
}

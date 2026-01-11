import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const letterInputVariants = cva(
  "inline-block border-b-2 bg-transparent px-1 py-0 text-foreground outline-none transition-colors field-sizing-content border-input placeholder:text-muted-foreground/50 focus:border-primary aria-invalid:border-destructive leading-tight",
  {
    variants: {
      width: {
        sm: "min-w-36",
        md: "min-w-44",
        lg: "min-w-64",
      },
    },
    defaultVariants: {
      width: "md",
    },
  }
)

export type LetterInputProps = React.ComponentProps<"input"> &
  VariantProps<typeof letterInputVariants>

export const LetterInput: React.FC<LetterInputProps> = ({ className, width, ...props }) => (
  <input
    className={cn(letterInputVariants({ width }), className)}
    data-slot="letter-input"
    {...props}
  />
)

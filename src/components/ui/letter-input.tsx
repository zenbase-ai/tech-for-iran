import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const letterInputVariants = cva(
  "inline-block border-b-2 bg-transparent p-0 text-foreground outline-none transition-colors field-sizing-content border-input placeholder:text-muted-foreground/50 focus:border-primary aria-invalid:border-destructive leading-tight"
)

export type LetterInputProps = React.ComponentProps<"input"> &
  VariantProps<typeof letterInputVariants>

export const LetterInput: React.FC<LetterInputProps> = ({ className, ...props }) => (
  <input className={cn(letterInputVariants(), className)} data-slot="letter-input" {...props} />
)

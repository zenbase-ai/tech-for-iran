"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useEffectEvent, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { type Commitment, CommitmentSchema, signFlowConfig } from "../schema"

export type CommitmentStepProps = {
  initialData?: Partial<Commitment>
  onComplete: (data: Commitment) => boolean
  onSkip: () => void
  className?: string
}

const EXAMPLE_COMMITMENTS = [
  "Investing $10M in Iranian startups",
  "Hiring 50 engineers from Tehran",
  "Opening our first Middle East office in Iran",
  "Mentoring 10 first-time founders",
]

/**
 * CommitmentStep - Optional step for users to make specific commitments.
 *
 * Frames commitments in the context of "In the first 100 days of a free Iran..."
 * to inspire concrete, actionable pledges.
 */
export const CommitmentStep: React.FC<CommitmentStepProps> = ({
  initialData,
  onComplete,
  onSkip,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const form = useForm<Commitment>({
    resolver: zodResolver(CommitmentSchema),
    defaultValues: {
      commitment: initialData?.commitment ?? signFlowConfig.defaultValues.commitment,
    },
    mode: "onChange",
  })

  // Auto-focus textarea on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = useEffectEvent((data: Commitment) => {
    onComplete(data)
  })

  const commitment = form.watch("commitment") ?? ""
  const charCount = commitment.length
  const hasContent = charCount > 0

  return (
    <VStack as="form" className={cn("gap-6", className)} onSubmit={form.handleSubmit(handleSubmit)}>
      <Controller
        control={form.control}
        name="commitment"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base font-medium">
              In the first 100 days of a free Iran, I commit to: (optional)
            </FieldLabel>
            <FieldContent>
              <Textarea
                {...field}
                aria-describedby="commitment-description commitment-examples"
                aria-invalid={fieldState.invalid}
                className="min-h-32 resize-none"
                maxLength={signFlowConfig.max.commitment}
                placeholder="Describe your commitment..."
                ref={(el) => {
                  field.ref(el)
                  ;(textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
                }}
                rows={5}
              />
            </FieldContent>
            <VStack className="gap-2">
              <FieldDescription id="commitment-description">
                Make a concrete commitment that others can hold you to.
              </FieldDescription>
              <FieldDescription className="text-muted-foreground/70" id="commitment-examples">
                <span className="font-medium">Examples:</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {EXAMPLE_COMMITMENTS.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </FieldDescription>
            </VStack>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <HStack className="gap-3" justify="end">
        <Button onClick={onSkip} type="button" variant="ghost">
          Skip
        </Button>
        {hasContent && (
          <Button size="lg" type="submit">
            Continue
          </Button>
        )}
      </HStack>
    </VStack>
  )
}

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
import { signFlowConfig, type WhySigned, WhySignedSchema } from "../schema"

export type WhyStepProps = {
  initialData?: Partial<WhySigned>
  onComplete: (data: WhySigned) => boolean
  onSkip: () => void
  className?: string
}

/**
 * WhyStep - Optional step for users to share why they're signing.
 *
 * Limited to 280 characters (Twitter-length) to encourage concise,
 * impactful statements.
 */
export const WhyStep: React.FC<WhyStepProps> = ({ initialData, onComplete, onSkip, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const form = useForm<WhySigned>({
    resolver: zodResolver(WhySignedSchema),
    defaultValues: {
      whySigned: initialData?.whySigned ?? signFlowConfig.defaultValues.whySigned,
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

  const handleSubmit = useEffectEvent((data: WhySigned) => {
    onComplete(data)
  })

  const whySigned = form.watch("whySigned") ?? ""
  const charCount = whySigned.length
  const hasContent = charCount > 0

  return (
    <VStack as="form" className={cn("gap-6", className)} onSubmit={form.handleSubmit(handleSubmit)}>
      <Controller
        control={form.control}
        name="whySigned"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base font-medium">Why I'm signing (optional)</FieldLabel>
            <FieldContent>
              <Textarea
                {...field}
                aria-describedby="why-description why-char-count"
                aria-invalid={fieldState.invalid}
                className="min-h-28 resize-none"
                maxLength={signFlowConfig.max.whySigned}
                placeholder="Share why this matters to you..."
                ref={(el) => {
                  field.ref(el)
                  ;(textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
                }}
                rows={4}
              />
            </FieldContent>
            <HStack className="gap-2" items="start" justify="between">
              <FieldDescription id="why-description">
                A personal statement about why you support this cause.
              </FieldDescription>
              <FieldDescription
                className={cn(
                  "shrink-0 tabular-nums",
                  charCount > signFlowConfig.max.whySigned * 0.9 && "text-warning"
                )}
                id="why-char-count"
              >
                {charCount} / {signFlowConfig.max.whySigned}
              </FieldDescription>
            </HStack>
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

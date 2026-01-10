"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useEffectEvent, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { type Identity, IdentitySchema, signFlowConfig } from "../schema"

export type IdentityStepProps = {
  initialData?: Partial<Identity>
  onComplete: (data: Identity) => boolean
  className?: string
}

/**
 * IdentityStep - The first step of the sign flow.
 *
 * Uses an inline sentence format: "I, [name], [title] at [company], sign this letter."
 * This creates a document-like ceremonial feel.
 */
export const IdentityStep: React.FC<IdentityStepProps> = ({
  initialData,
  onComplete,
  className,
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<Identity>({
    resolver: zodResolver(IdentitySchema),
    defaultValues: {
      name: initialData?.name ?? signFlowConfig.defaultValues.name,
      title: initialData?.title ?? signFlowConfig.defaultValues.title,
      company: initialData?.company ?? signFlowConfig.defaultValues.company,
    },
    mode: "onBlur",
  })

  // Auto-focus name input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = useEffectEvent((data: Identity) => {
    onComplete(data)
  })

  const { name, title, company } = form.watch()
  const isComplete = name.length > 0 && title.length > 0 && company.length > 0

  return (
    <VStack as="form" className={cn("gap-8", className)} onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Desktop: Inline sentence layout */}
      <div className="hidden md:block">
        <p className="text-lg leading-relaxed">
          <span className="text-muted-foreground">I, </span>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <span className="inline-flex flex-col">
                <input
                  {...field}
                  aria-describedby={fieldState.error ? "name-error" : undefined}
                  aria-invalid={fieldState.invalid}
                  autoComplete="name"
                  className={cn(
                    "inline-block w-56 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  maxLength={signFlowConfig.max.name}
                  placeholder="Your full name"
                  ref={(el) => {
                    field.ref(el)
                    ;(nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
                  }}
                  type="text"
                />
                {fieldState.error && (
                  <span className="mt-1 text-xs text-destructive" id="name-error">
                    {fieldState.error.message}
                  </span>
                )}
              </span>
            )}
          />
          <span className="text-muted-foreground">, </span>
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <span className="inline-flex flex-col">
                <input
                  {...field}
                  aria-describedby={fieldState.error ? "title-error" : undefined}
                  aria-invalid={fieldState.invalid}
                  autoComplete="organization-title"
                  className={cn(
                    "inline-block w-44 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  maxLength={signFlowConfig.max.title}
                  placeholder="Your title"
                  type="text"
                />
                {fieldState.error && (
                  <span className="mt-1 text-xs text-destructive" id="title-error">
                    {fieldState.error.message}
                  </span>
                )}
              </span>
            )}
          />
          <span className="text-muted-foreground"> at </span>
          <Controller
            control={form.control}
            name="company"
            render={({ field, fieldState }) => (
              <span className="inline-flex flex-col">
                <input
                  {...field}
                  aria-describedby={fieldState.error ? "company-error" : undefined}
                  aria-invalid={fieldState.invalid}
                  autoComplete="organization"
                  className={cn(
                    "inline-block w-44 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  maxLength={signFlowConfig.max.company}
                  placeholder="Your company"
                  type="text"
                />
                {fieldState.error && (
                  <span className="mt-1 text-xs text-destructive" id="company-error">
                    {fieldState.error.message}
                  </span>
                )}
              </span>
            )}
          />
          <span className="text-muted-foreground">, sign this letter.</span>
        </p>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        <VStack className="gap-4">
          <p className="text-lg text-muted-foreground">I,</p>

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <VStack className="gap-1">
                <input
                  {...field}
                  aria-describedby={fieldState.error ? "name-error-mobile" : undefined}
                  aria-invalid={fieldState.invalid}
                  autoComplete="name"
                  className={cn(
                    "w-full border-b-2 bg-transparent px-1 py-2 text-lg outline-none transition-colors",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  maxLength={signFlowConfig.max.name}
                  placeholder="Your full name"
                  ref={(el) => {
                    field.ref(el)
                    ;(nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
                  }}
                  type="text"
                />
                <span className="text-xs text-muted-foreground">Your full name</span>
                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} id="name-error-mobile" />
                )}
              </VStack>
            )}
          />

          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <VStack className="gap-1">
                <input
                  {...field}
                  aria-describedby={fieldState.error ? "title-error-mobile" : undefined}
                  aria-invalid={fieldState.invalid}
                  autoComplete="organization-title"
                  className={cn(
                    "w-full border-b-2 bg-transparent px-1 py-2 text-lg outline-none transition-colors",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  maxLength={signFlowConfig.max.title}
                  placeholder="Your title"
                  type="text"
                />
                <span className="text-xs text-muted-foreground">Your title</span>
                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} id="title-error-mobile" />
                )}
              </VStack>
            )}
          />

          <p className="text-lg text-muted-foreground">at</p>

          <Controller
            control={form.control}
            name="company"
            render={({ field, fieldState }) => (
              <VStack className="gap-1">
                <input
                  {...field}
                  aria-describedby={fieldState.error ? "company-error-mobile" : undefined}
                  aria-invalid={fieldState.invalid}
                  autoComplete="organization"
                  className={cn(
                    "w-full border-b-2 bg-transparent px-1 py-2 text-lg outline-none transition-colors",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  maxLength={signFlowConfig.max.company}
                  placeholder="Your company"
                  type="text"
                />
                <span className="text-xs text-muted-foreground">Your company</span>
                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} id="company-error-mobile" />
                )}
              </VStack>
            )}
          />

          <p className="text-lg text-muted-foreground">sign this letter.</p>
        </VStack>
      </div>

      {/* Continue button - appears when fields are filled */}
      <div
        className={cn(
          "flex justify-end transition-opacity duration-300",
          isComplete ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <Button disabled={!isComplete} size="lg" type="submit">
          Continue
        </Button>
      </div>
    </VStack>
  )
}

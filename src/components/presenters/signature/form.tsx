"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import type React from "react"
import { useEffect, useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { FaXTwitter } from "react-icons/fa6"
import { useBoolean } from "usehooks-ts"
import { HStack, VStack } from "@/components/layout/stack"
import { Button, type ButtonProps } from "@/components/ui/button"
import { HoverButton } from "@/components/ui/hover-button"
import { InlineField } from "@/components/ui/inline-field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Item, ItemContent, ItemFooter } from "@/components/ui/item"
import { LetterInput } from "@/components/ui/letter-input"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { clearReferredBy, getReferredBy } from "@/lib/cookies"
import { cn } from "@/lib/utils"
import { CreateSignature, createSignature } from "@/schemas/signature"
import { useSignatureContext } from "./context"

// =================================================================
// Sub-components
// =================================================================

export type SignatureFormProps = {
  className?: string
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this is mega
export const SignatureForm: React.FC<SignatureFormProps> = ({ className }) => {
  // Context
  const { setXUsername } = useSignatureContext()

  // Convex
  const create = useAsyncFn(useMutation(api.signatures.mutate.create))

  // Derived state from mutation result
  const signatureId = create.data?.data?.signatureId

  // Form setup with signature schema
  const form = useForm({
    resolver: zodResolver(CreateSignature),
    mode: "onBlur",
    defaultValues: {
      ...createSignature.defaultValues,
      referredBy: getReferredBy(),
    },
  })

  // Form destructuring
  const { formState } = form
  const { name, title, company, because, commitment } = form.watch()

  // Local state for skipped sections
  const skipBecause = useBoolean(false)
  const skipCommitment = useBoolean(false)

  useEffect(() => {
    if (skipBecause.value) {
      form.clearErrors("because")
    }
    if (skipCommitment.value) {
      form.clearErrors("commitment")
    }
  }, [form.clearErrors, skipBecause.value, skipCommitment.value])

  // Section visibility logic
  const showWhy = (name?.length ?? 0) > 0 && (title?.length ?? 0) > 0 && (company?.length ?? 0) > 0
  const showCommitment = showWhy && ((because?.length ?? 0) > 0 || skipBecause.value)
  const showXUsername = showCommitment && ((commitment?.length ?? 0) > 0 || skipCommitment.value)

  // =================================================================
  // Handlers
  // =================================================================

  const handleSign = useEffectEvent(async (data: CreateSignature) => {
    setXUsername(data.xUsername)
    await create.execute(data)
  })

  useEffect(() => {
    if (signatureId) {
      clearReferredBy()
    }
  }, [signatureId])

  // =================================================================
  // Render
  // =================================================================

  return (
    <VStack as="form" className={cn("gap-4", className)} onSubmit={form.handleSubmit(handleSign)}>
      <input type="hidden" {...form.register("referredBy")} />

      <Item className="flex-col items-start" variant="outline">
        <ItemContent className="text-base text-muted-foreground leading-relaxed">
          <HStack className="gap-y-0.5" items="baseline" wrap>
            I,&nbsp;
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <InlineField>
                  <LetterInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                    disabled={formState.isSubmitted}
                    maxLength={createSignature.max.name}
                    placeholder="Full Name"
                  />
                </InlineField>
              )}
            />
            ,&nbsp;
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <InlineField>
                  <LetterInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    maxLength={createSignature.max.title}
                    placeholder="Title"
                  />
                </InlineField>
              )}
            />
            &nbsp;at&nbsp;
            <Controller
              control={form.control}
              name="company"
              render={({ field, fieldState }) => (
                <InlineField>
                  <LetterInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="organization"
                    maxLength={createSignature.max.company}
                    placeholder="Company"
                  />
                </InlineField>
              )}
            />
            &nbsp;,
            {showWhy && !skipBecause.value && (
              <span className="inline-flex items-center whitespace-nowrap">
                sign this letter&nbsp;because&nbsp;
                <Controller
                  control={form.control}
                  name="because"
                  render={({ field, fieldState }) => (
                    <InlineField className="gap-2">
                      <LetterInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        maxLength={createSignature.max.because}
                        placeholder="this matters to me..."
                      />
                      {!because && <SkipButton onClick={skipBecause.setTrue} />}
                    </InlineField>
                  )}
                />
                {because && "."}
              </span>
            )}
            {/* Commitment Section */}
            {showCommitment && !skipCommitment.value && (
              <div>
                In the first 100 days of a free Iran, I commit to{" "}
                <Controller
                  control={form.control}
                  name="commitment"
                  render={({ field, fieldState }) => (
                    <InlineField className="gap-2">
                      <LetterInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        maxLength={createSignature.max.commitment}
                        placeholder="building something great..."
                      />
                      {!commitment && <SkipButton onClick={skipCommitment.setTrue} />}
                    </InlineField>
                  )}
                />
                {commitment && "."}
              </div>
            )}
          </HStack>
        </ItemContent>
        {/* X Username Section */}
        {showXUsername && (
          <ItemFooter className="justify-between w-full">
            <Controller
              control={form.control}
              name="xUsername"
              render={({ field, fieldState }) => (
                <InputGroup className="w-fit">
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>@</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    maxLength={createSignature.max.xUsername}
                    placeholder="username"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      <FaXTwitter />
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              )}
            />
            <HoverButton
              className="min-w-28 h-8.5 p-0 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              disabled={!formState.isValid || formState.isSubmitting}
              type="submit"
            >
              {formState.isSubmitting ? "Signing..." : "Sign"}
            </HoverButton>
          </ItemFooter>
        )}
      </Item>
    </VStack>
  )
}

const SkipButton: React.FC<ButtonProps> = (props) => (
  <Button size="sm" type="button" variant="outline" {...props}>
    Skip
  </Button>
)

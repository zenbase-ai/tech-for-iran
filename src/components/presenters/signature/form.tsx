"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import type React from "react"
import { useEffect, useEffectEvent, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { FaXTwitter } from "react-icons/fa6"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
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
// Types
// =================================================================

export type SignatureFormProps = {
  className?: string
}

// =================================================================
// Sub-components
// =================================================================

type SkipButtonProps = {
  setState: React.Dispatch<React.SetStateAction<boolean>>
}

const SkipButton: React.FC<SkipButtonProps> = ({ setState }) => (
  <Button onClick={() => setState(true)} size="sm" type="button" variant="outline">
    Skip
  </Button>
)

// =================================================================
// Component
// =================================================================

export const SignatureForm: React.FC<SignatureFormProps> = ({ className }) => {
  // Context
  const { setXUsername } = useSignatureContext()

  // Local state for skipped sections
  const [skippedBecause, setSkippedBecause] = useState(false)
  const [skippedCommitment, setSkippedCommitment] = useState(false)

  // Convex
  const create = useAsyncFn(useMutation(api.signatures.mutate.create))

  // Derived state from mutation result
  const signatureId = create.data?.data?.signatureId

  // Form setup with signature schema
  const form = useForm({
    resolver: zodResolver(CreateSignature),
    defaultValues: {
      ...createSignature.defaultValues,
      referredBy: getReferredBy(),
    },
    mode: "onBlur",
  })

  // Form destructuring
  const { formState } = form
  const { name, title, company, because, commitment } = form.watch()

  // Section visibility logic
  const showWhy = name?.length > 0 && title?.length > 0 && company?.length > 0
  const showCommitment = showWhy && (because?.length > 0 || skippedBecause)
  const showXUsername = showCommitment && (commitment?.length > 0 || skippedCommitment)

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
                    disabled={formState.isSubmitted}
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
                    disabled={formState.isSubmitted}
                    maxLength={createSignature.max.company}
                    placeholder="Company"
                  />
                </InlineField>
              )}
            />
            &nbsp;,
            {showWhy && !skippedBecause && (
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
                        disabled={formState.isSubmitted}
                        maxLength={createSignature.max.because}
                        placeholder="this matters to me..."
                      />
                      {!because && <SkipButton setState={setSkippedBecause} />}
                    </InlineField>
                  )}
                />
                {because && "."}
              </span>
            )}
            {/* Commitment Section */}
            {showCommitment && !skippedCommitment && (
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
                        disabled={formState.isSubmitted}
                        maxLength={createSignature.max.commitment}
                        placeholder="building something great..."
                      />
                      {!commitment && <SkipButton setState={setSkippedCommitment} />}
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
              className="min-w-28 h-8.5 p-0"
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

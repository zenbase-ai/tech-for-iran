"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useEffectEvent, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight, LuCheck, LuCopy } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { SignInForm } from "@/components/presenters/sign-in/form"
import { SocialShareButtons } from "@/components/social-share-buttons"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { InlineField } from "@/components/ui/inline-field"
import { LetterInput } from "@/components/ui/letter-input"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import useAsyncFn from "@/hooks/use-async-fn"
import { env } from "@/lib/env.mjs"
import { hashPhoneNumber } from "@/lib/phone"
import { clearReferralId, getReferralId } from "@/lib/referral"
import { cn, url } from "@/lib/utils"
import { Signature, signature as signatureConfig } from "@/schemas/signature"

// =================================================================
// Types
// =================================================================

export type SignatureFormProps = {
  className?: string
}

type SignatureFormData = Signature

// =================================================================
// Constants
// =================================================================

const CONVEX_ID_REGEX = /^[a-z0-9]{32}$/i
const URL_PROTOCOL_REGEX = /^https?:\/\//

const revealAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: "easeOut" },
} as const

// =================================================================
// Sub-components
// =================================================================

type SkipButtonProps = {
  onClick: () => void
}

const SkipButton: React.FC<SkipButtonProps> = ({ onClick }) => (
  <Button
    className="text-muted-foreground hover:text-foreground"
    onClick={onClick}
    size="sm"
    variant="ghost"
  >
    skip
  </Button>
)

type SuccessSectionProps = {
  shareURL: string
  totalCount: number | undefined
  isLoading: boolean
}

const SuccessSection: React.FC<SuccessSectionProps> = ({ shareURL, totalCount, isLoading }) => {
  if (isLoading) {
    return (
      <VStack className="gap-8 items-center text-center">
        <Skeleton className="size-16 rounded-full" />
        <VStack className="gap-2 items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </VStack>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </VStack>
    )
  }

  return (
    <VStack className="gap-8 items-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
        <LuCheck className="size-8 text-green-500" strokeWidth={3} />
      </div>

      <VStack className="gap-2 items-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">You've signed the letter.</h2>
        <p className="text-muted-foreground">
          Join <NumberTicker className="font-medium tabular-nums" value={totalCount ?? 0} />{" "}
          founders ready for a free Iran.
        </p>
      </VStack>

      <VStack className="gap-3">
        <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Share your pledge
        </span>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
          <code className="flex-1 truncate font-mono text-sm">
            {shareURL.replace(URL_PROTOCOL_REGEX, "")}
          </code>
          <CopyButton content={shareURL} leftIcon={LuCopy} size="sm" variant="ghost">
            Copy Link
          </CopyButton>
        </div>
      </VStack>

      <SocialShareButtons className="w-full" url={shareURL} />

      <Separator className="max-w-md opacity-30" />

      <Button asChild variant="link">
        <Link href="/">
          See all commitments
          <LuArrowRight className="size-4" />
        </Link>
      </Button>
    </VStack>
  )
}

// =================================================================
// Component
// =================================================================

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Form with many sections
export const SignatureForm: React.FC<SignatureFormProps> = ({ className }) => {
  const isDev = env.NEXT_PUBLIC_NODE_ENV === "development"

  // Local state for skipped sections
  const [skippedWhy, setSkippedWhy] = useState(false)
  const [skippedCommitment, setSkippedCommitment] = useState(isDev)

  // Phone verification state
  const [fullPhoneNumber, setFullPhoneNumber] = useState<string | null>(null)
  const isVerified = fullPhoneNumber !== null

  // Convex
  const createSignatureMutation = useMutation(api.signatures.mutate.create)
  const createSignature = useAsyncFn(createSignatureMutation)

  // Derived state from mutation result
  const signatureId = createSignature.data?.signatureId
  const isSubmitted = signatureId != null

  const signature = useQuery(api.signatures.query.get, signatureId ? { signatureId } : "skip")
  const totalCount = useQuery(api.signatures.query.count, isSubmitted ? {} : "skip")

  // Form setup with signature schema (no phone fields)
  const form = useForm<SignatureFormData>({
    resolver: zodResolver(Signature),
    defaultValues: isDev ? signatureConfig.testValues : signatureConfig.defaultValues,
    mode: "onBlur",
  })

  // Form destructuring
  const { control, handleSubmit } = form
  const { name, title, company, because, commitment } = form.watch()
  const { max } = signatureConfig

  // Section visibility logic
  const showWhy = name.length > 0 && title.length > 0 && company.length > 0
  const showCommitment = showWhy && (because.length > 0 || skippedWhy)
  const showVerify = showCommitment && (commitment.length > 0 || skippedCommitment)

  // =================================================================
  // Handlers
  // =================================================================

  const handleSignInSuccess = useEffectEvent((phoneNumber: string) => {
    setFullPhoneNumber(phoneNumber)
  })

  const handleSign = useEffectEvent(async () => {
    if (!isVerified || isSubmitted || !fullPhoneNumber) {
      return
    }

    await handleSubmit(async (formData) => {
      // Hash the phone number
      const phoneHash = await hashPhoneNumber(fullPhoneNumber)

      // Get referral ID if valid
      const referredByRaw = getReferralId()
      const referredBy =
        referredByRaw && CONVEX_ID_REGEX.test(referredByRaw)
          ? (referredByRaw as Id<"signatures">)
          : undefined

      // Create signature with validated form data
      const createResult = await createSignature.execute({
        name: formData.name,
        title: formData.title,
        company: formData.company,
        phoneHash,
        because: formData.because || undefined,
        commitment: formData.commitment || undefined,
        referredBy,
      })

      if (createResult.signatureId) {
        clearReferralId()
      }
    })()
  })

  // =================================================================
  // Render
  // =================================================================

  const shareURL = signatureId ? url(`/sig/${signatureId}`) : ""

  return (
    <VStack
      className={cn("gap-8 text-lg leading-loose text-muted-foreground", className)}
      data-slot="sign-letter"
    >
      {/* Identity Section */}
      <HStack items="stretch" wrap>
        I,&nbsp;
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <InlineField error={fieldState.error} errorId="name-error">
              <LetterInput
                {...field}
                aria-describedby={fieldState.error ? "name-error" : undefined}
                aria-invalid={fieldState.invalid}
                autoComplete="name"
                disabled={isSubmitted}
                maxLength={max.name}
                placeholder="Full Name"
              />
            </InlineField>
          )}
        />
        ,&nbsp;
        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <InlineField error={fieldState.error} errorId="title-error">
              <LetterInput
                {...field}
                aria-describedby={fieldState.error ? "title-error" : undefined}
                aria-invalid={fieldState.invalid}
                disabled={isSubmitted}
                maxLength={max.title}
                placeholder="Title"
                width="sm"
              />
            </InlineField>
          )}
        />
        &nbsp;at&nbsp;
        <Controller
          control={control}
          name="company"
          render={({ field, fieldState }) => (
            <InlineField error={fieldState.error} errorId="company-error">
              <LetterInput
                {...field}
                aria-describedby={fieldState.error ? "company-error" : undefined}
                aria-invalid={fieldState.invalid}
                autoComplete="organization"
                disabled={isSubmitted}
                maxLength={max.company}
                placeholder="Company"
                width="sm"
              />
            </InlineField>
          )}
        />
        ,&nbsp;sign this letter
        {/* Why Section */}
        <AnimatePresence>
          {showWhy && !isSubmitted && !skippedWhy && (
            <motion.span {...revealAnimation} className="inline-flex items-center">
              &nbsp;because&nbsp;
              <Controller
                control={control}
                name="because"
                render={({ field, fieldState }) => (
                  <InlineField error={fieldState.error}>
                    <span className="inline-flex items-center gap-2">
                      <LetterInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        maxLength={max.because}
                        placeholder="this matters to me..."
                        width="lg"
                      />
                      {!because && <SkipButton onClick={() => setSkippedWhy(true)} />}
                    </span>
                  </InlineField>
                )}
              />
              .
            </motion.span>
          )}
        </AnimatePresence>
        {/* Commitment Section */}
        <AnimatePresence>
          {showCommitment && !isSubmitted && !skippedCommitment && (
            <motion.span {...revealAnimation} className="inline-flex items-center">
              <span className="whitespace-nowrap">
                .&nbsp;In the first 100 days of a free Iran, I commit to&nbsp;
              </span>
              <Controller
                control={control}
                name="commitment"
                render={({ field, fieldState }) => (
                  <InlineField error={fieldState.error}>
                    <span className="inline-flex items-center gap-2">
                      <LetterInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        maxLength={max.commitment}
                        placeholder="building something great..."
                        width="lg"
                      />
                      {!commitment && <SkipButton onClick={() => setSkippedCommitment(true)} />}
                    </span>
                  </InlineField>
                )}
              />
              .
            </motion.span>
          )}
        </AnimatePresence>
      </HStack>

      {/* Verify Section */}
      <AnimatePresence>
        {showVerify && !isSubmitted && !isVerified && (
          <motion.div {...revealAnimation}>
            <SignInForm disabled={isSubmitted} onSuccess={handleSignInSuccess} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Button */}
      {!isSubmitted && (
        <HStack justify="end">
          <Button
            disabled={!isVerified || createSignature.pending}
            onClick={handleSign}
            size="lg"
            type="button"
          >
            {createSignature.pending ? (
              <>
                <Spinner className="size-4" />
                Signing...
              </>
            ) : (
              "Sign Letter"
            )}
          </Button>
        </HStack>
      )}

      {/* Success Section */}
      <AnimatePresence>
        {isSubmitted && signatureId && (
          <motion.div {...revealAnimation}>
            <Separator className="opacity-30 mb-8" />
            <SuccessSection
              isLoading={signature === undefined || totalCount === undefined}
              shareURL={shareURL}
              totalCount={totalCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </VStack>
  )
}

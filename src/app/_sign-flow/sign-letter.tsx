"use client"

import { useClerk, useSignUp } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight, LuCheck, LuCopy } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { SocialShareButtons } from "@/components/social-share-buttons"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { FieldDescription, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import useAsyncFn from "@/hooks/use-async-fn"
import { env } from "@/lib/env.mjs"
import { formatPhoneForDisplay, hashPhoneNumber } from "@/lib/phone"
import { clearReferralId, getReferralId } from "@/lib/referral"
import { cn } from "@/lib/utils"
import { countryCodes, type SignFlowData, SignFlowSchema, signFlowConfig } from "./schema"

// =================================================================
// Types
// =================================================================

export type SignLetterProps = {
  className?: string
}

type VerificationState = "idle" | "sending" | "sent" | "verifying"

// =================================================================
// Constants
// =================================================================

const CONVEX_ID_REGEX = /^[a-z0-9]{32}$/i
const OTP_LENGTH = 6
const URL_PROTOCOL_REGEX = /^https?:\/\//

const revealAnimation = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.4, ease: "easeOut" as const },
}

// =================================================================
// Clerk Error Helpers
// =================================================================

const getClerkErrorMessage = (errorCode: string | undefined): string => {
  switch (errorCode) {
    case "form_identifier_exists":
      return "This phone number has already signed the letter. If this is you and you need to update your information, contact us at hello@techforiran.com"
    case "form_code_incorrect":
      return "That code didn't work. Please try again or request a new code."
    case "too_many_requests":
      return "Too many attempts. Please wait a few minutes."
    default:
      return "Something went wrong. Please try again."
  }
}

// =================================================================
// Success Section Component
// =================================================================

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
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-12 w-full max-w-md" />
      </VStack>
    )
  }

  return (
    <VStack className="gap-8 items-center text-center">
      {/* Success checkmark */}
      <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
        <LuCheck className="size-8 text-green-500" strokeWidth={3} />
      </div>

      {/* Success message */}
      <VStack className="gap-2 items-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">You've signed the letter.</h2>
        <p className="text-muted-foreground">
          Join <NumberTicker className="font-medium tabular-nums" value={totalCount ?? 0} />{" "}
          founders ready for a free Iran.
        </p>
      </VStack>

      {/* Share URL card */}
      <VStack className="w-full max-w-md gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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

      {/* Social share buttons */}
      <SocialShareButtons className="w-full max-w-md" url={shareURL} />

      {/* Separator */}
      <Separator className="max-w-md opacity-30" />

      {/* See all commitments CTA */}
      <Button asChild variant="link">
        <Link href="/commitments">
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
export const SignLetter: React.FC<SignLetterProps> = ({ className }) => {
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Clerk hooks
  const { signUp, isLoaded } = useSignUp()
  const { setActive } = useClerk()

  // Local state for skipped sections
  const [skippedWhy, setSkippedWhy] = useState(false)
  const [skippedCommitment, setSkippedCommitment] = useState(false)

  // Phone verification state
  const [verificationState, setVerificationState] = useState<VerificationState>("idle")
  const [phoneDisplayNumber, setPhoneDisplayNumber] = useState<string | null>(null)
  const [fullPhoneNumber, setFullPhoneNumber] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [otpValue, setOtpValue] = useState("")

  // Derived state
  const isOtpComplete = otpValue.length === OTP_LENGTH

  // Submission state
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [signatoryId, setSignatoryId] = useState<Id<"signatories"> | null>(null)

  // Convex
  const createSignatoryMutation = useMutation(api.signatories.mutate.create)
  const createSignatory = useAsyncFn(createSignatoryMutation)
  const signatory = useQuery(api.signatories.query.get, signatoryId ? { signatoryId } : "skip")
  const totalCount = useQuery(api.signatories.query.count, isSubmitted ? {} : "skip")

  // Form setup
  const form = useForm<SignFlowData>({
    resolver: zodResolver(SignFlowSchema),
    defaultValues: {
      name: signFlowConfig.defaultValues.name,
      title: signFlowConfig.defaultValues.title,
      company: signFlowConfig.defaultValues.company,
      whySigned: signFlowConfig.defaultValues.whySigned,
      commitment: signFlowConfig.defaultValues.commitment,
      xUsername: signFlowConfig.defaultValues.xUsername,
      countryCode: signFlowConfig.defaultValues.countryCode,
      phoneNumber: signFlowConfig.defaultValues.phoneNumber,
      verificationCode: signFlowConfig.defaultValues.verificationCode,
    },
    mode: "onBlur",
  })

  // Watch form values for progressive disclosure
  const { name, title, company, whySigned, commitment, phoneNumber } = form.watch()

  // Section visibility logic
  const showWhy = name.length > 0 && title.length > 0 && company.length > 0
  const showCommitment = showWhy && (whySigned.length > 0 || skippedWhy)
  const showVerify = showCommitment && (commitment.length > 0 || skippedCommitment)
  const showOtp = verificationState === "sent" || verificationState === "verifying"
  const isPhoneValid = phoneNumber.replace(/\D/g, "").length >= 7

  // Auto-focus name input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCountdown])

  // =================================================================
  // Phone Verification Handlers
  // =================================================================

  const handleSendCode = useEffectEvent(async () => {
    if (!(isLoaded && signUp && isPhoneValid)) {
      return
    }

    setVerificationState("sending")
    setVerificationError(null)

    try {
      const countryCode = form.getValues("countryCode")
      const phone = form.getValues("phoneNumber")
      const fullPhone = `${countryCode}${phone.replace(/\D/g, "")}`
      const displayNumber = formatPhoneForDisplay(phone, countryCode)

      await signUp.create({ phoneNumber: fullPhone })
      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" })

      setFullPhoneNumber(fullPhone)
      setPhoneDisplayNumber(displayNumber)
      setVerificationState("sent")
      setResendCountdown(signFlowConfig.resendCooldown)
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string }> }
      const errorCode = clerkError.errors?.[0]?.code
      setVerificationError(getClerkErrorMessage(errorCode))
      setVerificationState("idle")
    }
  })

  const handleVerificationSuccess = useEffectEvent(async (sessionId: string | null) => {
    await setActive({ session: sessionId })

    // Hash the phone number (fullPhoneNumber is always set before OTP verification)
    if (!fullPhoneNumber) {
      throw new Error("Phone number not set")
    }
    const phoneHash = await hashPhoneNumber(fullPhoneNumber)

    // Get referral ID if valid
    const referredByRaw = getReferralId()
    const referredBy =
      referredByRaw && CONVEX_ID_REGEX.test(referredByRaw)
        ? (referredByRaw as Id<"signatories">)
        : undefined

    // Create signatory
    const createResult = await createSignatory.execute({
      name: form.getValues("name"),
      title: form.getValues("title"),
      company: form.getValues("company"),
      phoneHash,
      whySigned: form.getValues("whySigned") || undefined,
      commitmentText: form.getValues("commitment") || undefined,
      xUsername: form.getValues("xUsername") || undefined,
      referredBy,
    })

    if (createResult.signatoryId) {
      clearReferralId()
      setSignatoryId(createResult.signatoryId)
      setIsSubmitted(true)
    }
  })

  const handleVerifyCode = useEffectEvent(async () => {
    if (!isOtpComplete || verificationState === "verifying" || !isLoaded || !signUp) {
      return
    }

    setVerificationState("verifying")
    setVerificationError(null)

    try {
      const result = await signUp.attemptPhoneNumberVerification({ code: otpValue })

      if (result.status === "complete") {
        await handleVerificationSuccess(result.createdSessionId)
      } else {
        setVerificationError("Verification incomplete. Please try again.")
        setVerificationState("sent")
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string }> }
      const errorCode = clerkError.errors?.[0]?.code
      setVerificationError(getClerkErrorMessage(errorCode))
      setVerificationState("sent")
    }
  })

  const handleResend = useEffectEvent(async () => {
    if (resendCountdown > 0 || !isLoaded || !signUp) {
      return
    }

    setVerificationError(null)

    try {
      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" })
      setResendCountdown(signFlowConfig.resendCooldown)
      setOtpValue("")
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string }> }
      const errorCode = clerkError.errors?.[0]?.code
      setVerificationError(getClerkErrorMessage(errorCode))
    }
  })

  const handleOtpChange = useCallback((value: string) => {
    setVerificationError(null)
    setOtpValue(value)
  }, [])

  // =================================================================
  // Render
  // =================================================================

  const shareURL = signatoryId ? `${env.NEXT_PUBLIC_APP_URL}/s/${signatoryId}` : ""
  const canResend = resendCountdown === 0

  return (
    <VStack className={cn("gap-8", className)} data-slot="sign-letter">
      {/* Identity Section - Always visible */}
      <div>
        {/* Desktop: Inline sentence layout */}
        <HStack className="hidden md:flex text-lg leading-relaxed" items="center" wrap>
          <span className="text-muted-foreground">I,&nbsp;</span>
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
                    "inline-block min-w-44 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  disabled={isSubmitted}
                  maxLength={signFlowConfig.max.name}
                  placeholder="Full Name"
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
          <span className="text-muted-foreground">,&nbsp;</span>
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
                    "inline-block min-w-36 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  disabled={isSubmitted}
                  maxLength={signFlowConfig.max.title}
                  placeholder="Title"
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
          <span className="text-muted-foreground">&nbsp;at&nbsp;</span>
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
                    "inline-block min-w-36 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
                    "border-input placeholder:text-muted-foreground/50",
                    "focus:border-primary",
                    fieldState.invalid && "border-destructive"
                  )}
                  disabled={isSubmitted}
                  maxLength={signFlowConfig.max.company}
                  placeholder="Company"
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
          <span className="text-muted-foreground">,&nbsp;sign this letter</span>

          {/* Why Section - inline */}
          <AnimatePresence>
            {showWhy && !isSubmitted && (
              <motion.span {...revealAnimation} className="inline-flex items-center">
                <span className="text-muted-foreground">&nbsp;because&nbsp;</span>
                <Controller
                  control={form.control}
                  name="whySigned"
                  render={({ field, fieldState }) => (
                    <span className="inline-flex flex-col">
                      <span className="inline-flex items-center gap-2">
                        <input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            "inline-block min-w-64 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
                            "border-input placeholder:text-muted-foreground/50",
                            "focus:border-primary",
                            fieldState.invalid && "border-destructive",
                            skippedWhy && "text-muted-foreground"
                          )}
                          disabled={skippedWhy}
                          maxLength={signFlowConfig.max.whySigned}
                          placeholder="this matters to me..."
                          type="text"
                        />
                        {!(skippedWhy || whySigned) && (
                          <button
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setSkippedWhy(true)}
                            type="button"
                          >
                            skip
                          </button>
                        )}
                      </span>
                      {fieldState.error && (
                        <span className="mt-1 text-xs text-destructive">
                          {fieldState.error.message}
                        </span>
                      )}
                    </span>
                  )}
                />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Commitment Section - inline */}
          <AnimatePresence>
            {showCommitment && !isSubmitted && (
              <motion.span {...revealAnimation} className="inline-flex items-center">
                <span className="text-muted-foreground whitespace-nowrap">
                  .&nbsp;In the first 100 days of a free Iran, I commit to&nbsp;
                </span>
                <Controller
                  control={form.control}
                  name="commitment"
                  render={({ field, fieldState }) => (
                    <span className="inline-flex flex-col">
                      <span className="inline-flex items-center gap-2">
                        <input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            "inline-block min-w-64 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
                            "border-input placeholder:text-muted-foreground/50",
                            "focus:border-primary",
                            fieldState.invalid && "border-destructive",
                            skippedCommitment && "text-muted-foreground"
                          )}
                          disabled={skippedCommitment}
                          maxLength={signFlowConfig.max.commitment}
                          placeholder="building something great..."
                          type="text"
                        />
                        {!(skippedCommitment || commitment) && (
                          <button
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setSkippedCommitment(true)}
                            type="button"
                          >
                            skip
                          </button>
                        )}
                      </span>
                      {fieldState.error && (
                        <span className="mt-1 text-xs text-destructive">
                          {fieldState.error.message}
                        </span>
                      )}
                    </span>
                  )}
                />
                <span className="text-muted-foreground">.</span>
              </motion.span>
            )}
          </AnimatePresence>
        </HStack>

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
                    disabled={isSubmitted}
                    maxLength={signFlowConfig.max.name}
                    placeholder="Full Name"
                    ref={(el) => {
                      field.ref(el)
                      ;(nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current =
                        el
                    }}
                    type="text"
                  />
                  <span className="text-xs text-muted-foreground">Full Name</span>
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
                    disabled={isSubmitted}
                    maxLength={signFlowConfig.max.title}
                    placeholder="Title"
                    type="text"
                  />
                  <span className="text-xs text-muted-foreground">Title</span>
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
                    disabled={isSubmitted}
                    maxLength={signFlowConfig.max.company}
                    placeholder="Company"
                    type="text"
                  />
                  <span className="text-xs text-muted-foreground">Company</span>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} id="company-error-mobile" />
                  )}
                </VStack>
              )}
            />

            <p className="text-lg text-muted-foreground">sign this letter.</p>
          </VStack>
        </div>
      </div>

      {/* Why Section - Mobile only (desktop is inline above) */}
      <AnimatePresence>
        {showWhy && !isSubmitted && (
          <motion.p {...revealAnimation} className="md:hidden text-lg leading-relaxed">
            <span className="text-muted-foreground">because </span>
            <Controller
              control={form.control}
              name="whySigned"
              render={({ field, fieldState }) => (
                <span className="inline-flex flex-col">
                  <span className="inline-flex items-center gap-2">
                    <input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className={cn(
                        "inline-block min-w-64 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
                        "border-input placeholder:text-muted-foreground/50",
                        "focus:border-primary",
                        fieldState.invalid && "border-destructive",
                        skippedWhy && "text-muted-foreground"
                      )}
                      disabled={skippedWhy}
                      maxLength={signFlowConfig.max.whySigned}
                      placeholder="this matters to me..."
                      type="text"
                    />
                    {!(skippedWhy || whySigned) && (
                      <button
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setSkippedWhy(true)}
                        type="button"
                      >
                        skip
                      </button>
                    )}
                  </span>
                  {fieldState.error && (
                    <span className="mt-1 text-xs text-destructive">
                      {fieldState.error.message}
                    </span>
                  )}
                </span>
              )}
            />
          </motion.p>
        )}
      </AnimatePresence>

      {/* Commitment Section - Mobile only (desktop is inline above) */}
      <AnimatePresence>
        {showCommitment && !isSubmitted && (
          <motion.p {...revealAnimation} className="md:hidden text-lg leading-relaxed">
            <span className="text-muted-foreground">
              In the first 100 days of a free Iran, I commit to{" "}
            </span>
            <Controller
              control={form.control}
              name="commitment"
              render={({ field, fieldState }) => (
                <span className="inline-flex flex-col">
                  <span className="inline-flex items-center gap-2">
                    <input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className={cn(
                        "inline-block min-w-64 border-b-2 bg-transparent px-1 py-0.5 text-lg outline-none transition-colors field-sizing-content",
                        "border-input placeholder:text-muted-foreground/50",
                        "focus:border-primary",
                        fieldState.invalid && "border-destructive",
                        skippedCommitment && "text-muted-foreground"
                      )}
                      disabled={skippedCommitment}
                      maxLength={signFlowConfig.max.commitment}
                      placeholder="building something great..."
                      type="text"
                    />
                    {!(skippedCommitment || commitment) && (
                      <button
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setSkippedCommitment(true)}
                        type="button"
                      >
                        skip
                      </button>
                    )}
                  </span>
                  {fieldState.error && (
                    <span className="mt-1 text-xs text-destructive">
                      {fieldState.error.message}
                    </span>
                  )}
                </span>
              )}
            />
            <span className="text-muted-foreground">.</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Verify Section - Reveals after commitment */}
      <AnimatePresence>
        {showVerify && !isSubmitted && (
          <motion.div {...revealAnimation}>
            <VStack className="gap-6">
              {/* Optional X username field */}
              {!showOtp && (
                <Controller
                  control={form.control}
                  name="xUsername"
                  render={({ field, fieldState }) => (
                    <VStack className="gap-2">
                      <span className="text-base font-medium">
                        Share your X profile{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </span>
                      <HStack className="gap-2" items="center">
                        <span className="text-muted-foreground">@</span>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                          className="max-w-xs"
                          maxLength={signFlowConfig.max.xUsername}
                          placeholder="username"
                          type="text"
                        />
                      </HStack>
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </VStack>
                  )}
                />
              )}

              <VStack className="gap-4">
                <VStack className="gap-1">
                  <span className="text-base font-medium">Verify you're human</span>
                  <span className="text-sm text-muted-foreground">
                    We'll text you a 6-digit code to verify.
                  </span>
                </VStack>

                {/* Phone input */}
                {!showOtp && (
                  <VStack className="gap-3">
                    <HStack className="gap-2">
                      <Controller
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <NativeSelect
                            {...field}
                            aria-label="Country code"
                            className="w-28 shrink-0"
                          >
                            {countryCodes.map(({ code, label }) => (
                              <NativeSelectOption key={code} value={code}>
                                {label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        )}
                      />
                      <Controller
                        control={form.control}
                        name="phoneNumber"
                        render={({ field, fieldState }) => (
                          <VStack className="flex-1 gap-1">
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              autoComplete="tel-national"
                              inputMode="tel"
                              placeholder="(555) 123-4567"
                              type="tel"
                            />
                            {fieldState.error && <FieldError errors={[fieldState.error]} />}
                          </VStack>
                        )}
                      />
                    </HStack>
                    <FieldDescription className="text-xs">
                      Your number is never displayed or shared.
                    </FieldDescription>

                    {verificationError && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {verificationError}
                      </div>
                    )}

                    <HStack justify="end">
                      <Button
                        disabled={!isPhoneValid || verificationState === "sending"}
                        onClick={handleSendCode}
                        size="lg"
                        type="button"
                      >
                        {verificationState === "sending" ? (
                          <>
                            <Spinner className="size-4" />
                            Sending...
                          </>
                        ) : (
                          "Send Code"
                        )}
                      </Button>
                    </HStack>
                  </VStack>
                )}

                {/* OTP input */}
                {showOtp && (
                  <motion.div {...revealAnimation}>
                    <VStack className="gap-4">
                      <span className="text-sm text-muted-foreground">
                        Enter the code we sent to {phoneDisplayNumber}
                      </span>

                      <HStack className="justify-center">
                        <InputOTP
                          autoFocus
                          disabled={verificationState === "verifying"}
                          maxLength={OTP_LENGTH}
                          onChange={handleOtpChange}
                          onComplete={handleVerifyCode}
                          value={otpValue}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                          </InputOTPGroup>
                          <InputOTPSeparator />
                          <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </HStack>

                      {verificationError && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                          {verificationError}
                        </div>
                      )}

                      <p className="text-center text-sm text-muted-foreground">
                        Didn't get it?{" "}
                        {canResend ? (
                          <button
                            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                            onClick={handleResend}
                            type="button"
                          >
                            Resend
                          </button>
                        ) : (
                          <span className="tabular-nums">Resend ({resendCountdown}s)</span>
                        )}
                      </p>

                      <HStack justify="center">
                        <Button
                          disabled={!isOtpComplete || verificationState === "verifying"}
                          onClick={handleVerifyCode}
                          size="lg"
                          type="button"
                        >
                          {verificationState === "verifying" ? (
                            <>
                              <Spinner className="size-4" />
                              Verifying...
                            </>
                          ) : (
                            "Verify & Sign"
                          )}
                        </Button>
                      </HStack>
                    </VStack>
                  </motion.div>
                )}
              </VStack>
            </VStack>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Section - Reveals after submission */}
      <AnimatePresence>
        {isSubmitted && signatoryId && (
          <motion.div {...revealAnimation}>
            <Separator className="opacity-30 mb-8" />
            <SuccessSection
              isLoading={signatory === undefined || totalCount === undefined}
              shareURL={shareURL}
              totalCount={totalCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </VStack>
  )
}

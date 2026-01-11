"use client"

import { useClerk, useSignUp } from "@clerk/nextjs"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { useCallback, useEffect, useEffectEvent, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { FieldDescription, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { env } from "@/lib/env.mjs"
import { countryCodes, formatPhoneForDisplay, RESEND_COOLDOWN } from "@/lib/phone"
import { cn } from "@/lib/utils"

// =================================================================
// Types
// =================================================================

export type SignInFormProps = {
  className?: string
  onSuccess?: (phoneNumber: string) => void
  disabled?: boolean
}

type VerificationState = "idle" | "sending" | "sent" | "verifying"

type PhoneFormData = {
  countryCode: string
  phoneNumber: string
}

// =================================================================
// Constants
// =================================================================

const OTP_LENGTH = 6

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

const extractClerkErrorCode = (err: unknown): string | undefined => {
  if (isClerkAPIResponseError(err)) {
    return err.errors[0]?.code
  }
  return undefined
}

// =================================================================
// Component
// =================================================================

export const SignInForm: React.FC<SignInFormProps> = ({
  className,
  onSuccess,
  disabled = false,
}) => {
  const isDev = env.NEXT_PUBLIC_NODE_ENV === "development"

  // Clerk hooks
  const { signUp, isLoaded } = useSignUp()
  const { setActive } = useClerk()

  // Phone verification state
  const [verificationState, setVerificationState] = useState<VerificationState>("idle")
  const [phoneDisplayNumber, setPhoneDisplayNumber] = useState<string | null>(null)
  const [fullPhoneNumber, setFullPhoneNumber] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [otpValue, setOtpValue] = useState(isDev ? "424242" : "")
  const [error, setError] = useState<string | null>(null)

  // Derived state
  const isOtpComplete = otpValue.length === OTP_LENGTH
  const showOTP = verificationState === "sent" || verificationState === "verifying"

  // Form setup
  const form = useForm<PhoneFormData>({
    defaultValues: {
      countryCode: "+1",
      phoneNumber: isDev ? "9175550100" : "",
    },
  })

  const { control, watch, clearErrors } = form
  const phoneNumber = watch("phoneNumber")
  const isPhoneValid = phoneNumber.replace(/\D/g, "").length >= 7

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
    setError(null)
    clearErrors("phoneNumber")

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
      setResendCountdown(RESEND_COOLDOWN)
    } catch (err) {
      setError(getClerkErrorMessage(extractClerkErrorCode(err)))
      setVerificationState("idle")
    }
  })

  const handleVerifyCode = useEffectEvent(async () => {
    if (!isOtpComplete || verificationState === "verifying" || !isLoaded || !signUp) {
      return
    }

    setVerificationState("verifying")
    setError(null)

    try {
      const result = await signUp.attemptPhoneNumberVerification({ code: otpValue })

      if (result.status === "complete" && fullPhoneNumber) {
        await setActive({ session: result.createdSessionId })
        onSuccess?.(fullPhoneNumber)
      } else if (result.status !== "complete") {
        setError("Verification incomplete. Please try again.")
        setVerificationState("sent")
      }
    } catch (err) {
      setError(getClerkErrorMessage(extractClerkErrorCode(err)))
      setVerificationState("sent")
    }
  })

  const handleResend = useEffectEvent(async () => {
    if (resendCountdown > 0 || !isLoaded || !signUp) {
      return
    }

    setError(null)

    try {
      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" })
      setResendCountdown(RESEND_COOLDOWN)
      setOtpValue("")
    } catch (err) {
      setError(getClerkErrorMessage(extractClerkErrorCode(err)))
    }
  })

  const handleOtpChange = useCallback((value: string) => {
    setError(null)
    setOtpValue(value)
  }, [])

  // =================================================================
  // Render
  // =================================================================

  const canResend = resendCountdown === 0

  return (
    <VStack className={cn("gap-6", className)}>
      <VStack className="gap-4">
        <VStack className="gap-1">
          <span className="text-base font-medium">Verify you're human</span>
          <span className="text-sm text-muted-foreground">
            We'll text you a 6-digit code to verify.
          </span>
        </VStack>

        {/* Phone input */}
        {!showOTP && (
          <VStack className="gap-3">
            <HStack className="gap-2">
              <Controller
                control={control}
                name="countryCode"
                render={({ field }) => (
                  <NativeSelect
                    {...field}
                    aria-label="Country code"
                    className="w-28 shrink-0"
                    disabled={disabled}
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
                control={control}
                name="phoneNumber"
                render={({ field, fieldState }) => (
                  <VStack className="flex-1 gap-1">
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="tel-national"
                      disabled={disabled}
                      inputMode="tel"
                      placeholder="(555) 123-4567"
                      type="tel"
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </VStack>
                )}
              />
            </HStack>
            <FieldDescription className="text-sm">
              Your number is never displayed or shared.
            </FieldDescription>

            {error && <ErrorAlert>{error}</ErrorAlert>}

            <HStack justify="end">
              <Button
                disabled={disabled || !isPhoneValid || verificationState === "sending"}
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
        {showOTP && (
          <VStack className="gap-4">
            <span className="text-sm text-muted-foreground">
              Enter the code we sent to {phoneDisplayNumber}
            </span>

            <HStack className="justify-center">
              <InputOTP
                autoFocus
                disabled={disabled || verificationState === "verifying"}
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

            {error && <ErrorAlert className="text-center">{error}</ErrorAlert>}

            <p className="text-center text-sm text-muted-foreground">
              Didn't get it?{" "}
              {canResend ? (
                <Button className="h-auto p-0" onClick={handleResend} variant="link">
                  Resend
                </Button>
              ) : (
                <span className="tabular-nums">Resend ({resendCountdown}s)</span>
              )}
            </p>

            <HStack justify="center">
              <Button
                disabled={disabled || !isOtpComplete || verificationState === "verifying"}
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
                  "Verify"
                )}
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </VStack>
  )
}

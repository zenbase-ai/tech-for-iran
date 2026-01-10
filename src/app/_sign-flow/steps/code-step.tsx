"use client"

import { useClerk, useSignUp } from "@clerk/nextjs"
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { hashPhoneNumber } from "@/lib/phone"
import { cn } from "@/lib/utils"
import { type Code, signFlowConfig } from "../schema"

export type CodeStepProps = {
  phoneNumber: string
  fullPhoneNumber: string
  onComplete: (data: Code, phoneHash: string) => boolean
  className?: string
}

const CODE_LENGTH = 6
const DIGIT_REGEX = /^\d$/

/**
 * Map Clerk error codes to user-friendly messages.
 */
const getClerkErrorMessage = (errorCode: string | undefined): string => {
  switch (errorCode) {
    case "form_code_incorrect":
      return "That code didn't work. Please try again or request a new code."
    case "too_many_requests":
      return "Too many attempts. Please wait a few minutes."
    default:
      return "Something went wrong. Please try again."
  }
}

/**
 * CodeStep - 6-digit OTP verification step.
 *
 * Features auto-advancing between digit boxes, paste support,
 * and a resend countdown timer. Uses Clerk for verification.
 */
export const CodeStep: React.FC<CodeStepProps> = ({
  phoneNumber,
  fullPhoneNumber,
  onComplete,
  className,
}) => {
  const { signUp, isLoaded } = useSignUp()
  const { setActive } = useClerk()
  const [digits, setDigits] = useState<string[]>(new Array(CODE_LENGTH).fill(""))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(signFlowConfig.resendCooldown)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus()
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

  // Auto-submit when all digits are filled
  const code = digits.join("")
  const isComplete = code.length === CODE_LENGTH && digits.every((d) => DIGIT_REGEX.test(d))

  useEffect(() => {
    if (isComplete && !isVerifying) {
      handleVerify()
    }
  }, [isComplete, isVerifying])

  const handleVerify = useEffectEvent(async () => {
    if (!isComplete || isVerifying || !isLoaded || !signUp) {
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // Attempt to verify the code with Clerk
      const result = await signUp.attemptPhoneNumberVerification({ code })

      if (result.status === "complete") {
        // Set the active session
        await setActive({ session: result.createdSessionId })

        // Hash the phone number
        const phoneHash = await hashPhoneNumber(fullPhoneNumber)

        // Success - transition to completion
        onComplete({ verificationCode: code }, phoneHash)
      } else {
        // Verification not complete (shouldn't happen with phone-only flow)
        setError("Verification incomplete. Please try again.")
      }
    } catch (err: unknown) {
      // Extract Clerk error code
      const clerkError = err as { errors?: Array<{ code?: string }> }
      const errorCode = clerkError.errors?.[0]?.code
      setError(getClerkErrorMessage(errorCode))

      // Don't clear digits on error - let user correct
      // Focus first input for correction
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  })

  const handleResend = useEffectEvent(async () => {
    if (resendCountdown > 0 || isResending || !isLoaded || !signUp) {
      return
    }

    setIsResending(true)
    setError(null)

    try {
      // Resend verification code via Clerk
      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" })

      // Reset countdown and clear digits
      setResendCountdown(signFlowConfig.resendCooldown)
      setDigits(new Array(CODE_LENGTH).fill(""))
      inputRefs.current[0]?.focus()
    } catch (err: unknown) {
      // Extract Clerk error code
      const clerkError = err as { errors?: Array<{ code?: string }> }
      const errorCode = clerkError.errors?.[0]?.code
      setError(getClerkErrorMessage(errorCode))
    } finally {
      setIsResending(false)
    }
  })

  const handleDigitChange = useCallback((index: number, value: string) => {
    // Only allow single digits
    const digit = value.replace(/\D/g, "").slice(-1)

    setDigits((prev) => {
      const newDigits = [...prev]
      newDigits[index] = digit
      return newDigits
    })

    setError(null)

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!digits[index] && index > 0) {
          // If current is empty, move to previous
          inputRefs.current[index - 1]?.focus()
          setDigits((prev) => {
            const newDigits = [...prev]
            newDigits[index - 1] = ""
            return newDigits
          })
        } else {
          // Clear current
          setDigits((prev) => {
            const newDigits = [...prev]
            newDigits[index] = ""
            return newDigits
          })
        }
        e.preventDefault()
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus()
        e.preventDefault()
      } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
        e.preventDefault()
      }
    },
    [digits]
  )

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)

    if (pastedText.length > 0) {
      const newDigits = new Array(CODE_LENGTH).fill("")
      for (let i = 0; i < pastedText.length; i++) {
        newDigits[i] = pastedText[i]
      }
      setDigits(newDigits)

      // Focus the next empty input or the last one
      const nextEmptyIndex = newDigits.findIndex((d) => !d)
      const focusIndex = nextEmptyIndex === -1 ? CODE_LENGTH - 1 : nextEmptyIndex
      inputRefs.current[focusIndex]?.focus()
    }
  }, [])

  const canResend = resendCountdown === 0 && !isResending

  return (
    <VStack className={cn("gap-6", className)}>
      <VStack className="gap-2">
        <h3 className="text-base font-medium">Enter the code we sent to {phoneNumber}</h3>
      </VStack>

      {/* OTP Input boxes */}
      <HStack className="gap-2 justify-center" items="center">
        {/* First 3 digits */}
        <HStack className="gap-2">
          {[0, 1, 2].map((index) => (
            <input
              aria-label={`Digit ${index + 1}`}
              autoComplete="one-time-code"
              className={cn(
                "h-14 w-12 rounded-lg border-2 bg-transparent text-center text-2xl font-mono outline-none transition-all",
                "border-input",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                error && "border-destructive",
                digits[index] && "border-primary/50"
              )}
              disabled={isVerifying}
              inputMode="numeric"
              key={index}
              maxLength={1}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              pattern="[0-9]"
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              value={digits[index]}
            />
          ))}
        </HStack>

        {/* Separator */}
        <span className="text-muted-foreground text-2xl">-</span>

        {/* Last 3 digits */}
        <HStack className="gap-2">
          {[3, 4, 5].map((index) => (
            <input
              aria-label={`Digit ${index + 1}`}
              autoComplete="one-time-code"
              className={cn(
                "h-14 w-12 rounded-lg border-2 bg-transparent text-center text-2xl font-mono outline-none transition-all",
                "border-input",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                error && "border-destructive",
                digits[index] && "border-primary/50"
              )}
              disabled={isVerifying}
              inputMode="numeric"
              key={index}
              maxLength={1}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              pattern="[0-9]"
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              value={digits[index]}
            />
          ))}
        </HStack>
      </HStack>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* Resend link */}
      <p className="text-center text-sm text-muted-foreground">
        Didn't get it?{" "}
        {canResend ? (
          <button
            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            disabled={isResending}
            onClick={handleResend}
            type="button"
          >
            {isResending ? "Resending..." : "Resend"}
          </button>
        ) : (
          <span className="tabular-nums">Resend ({resendCountdown}s)</span>
        )}
      </p>

      {/* Verify button */}
      <HStack justify="center">
        <Button
          disabled={!isComplete || isVerifying}
          onClick={handleVerify}
          size="lg"
          type="button"
        >
          {isVerifying ? (
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
  )
}

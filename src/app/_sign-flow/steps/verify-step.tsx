"use client"

import { useSignUp } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useEffectEvent, useRef, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { formatPhoneForDisplay } from "@/lib/phone"
import { cn } from "@/lib/utils"
import { countryCodes, signFlowConfig, type Verify, VerifySchema } from "../schema"

export type VerifyStepProps = {
  initialData?: Partial<Verify>
  onComplete: (data: Verify, displayNumber: string) => boolean
  className?: string
}

/**
 * Map Clerk error codes to user-friendly messages.
 */
const getClerkErrorMessage = (errorCode: string | undefined): string => {
  switch (errorCode) {
    case "form_identifier_exists":
      return "This phone number has already signed the letter. If this is you and you need to update your information, contact us at hello@techforiran.com"
    case "too_many_requests":
      return "Too many attempts. Please wait a few minutes."
    default:
      return "Something went wrong. Please try again."
  }
}

/**
 * VerifyStep - Phone verification step.
 *
 * Collects phone number with country code selector and sends verification code via Clerk.
 */
export const VerifyStep: React.FC<VerifyStepProps> = ({ initialData, onComplete, className }) => {
  const { signUp, isLoaded } = useSignUp()
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const form = useForm<Verify>({
    resolver: zodResolver(VerifySchema),
    defaultValues: {
      countryCode: initialData?.countryCode ?? signFlowConfig.defaultValues.countryCode,
      phoneNumber: initialData?.phoneNumber ?? signFlowConfig.defaultValues.phoneNumber,
    },
    mode: "onBlur",
  })

  // Auto-focus phone input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      phoneInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = useEffectEvent(async (data: Verify) => {
    if (!(isLoaded && signUp)) {
      setSendError("Phone verification is not available. Please try again later.")
      return
    }

    setIsSending(true)
    setSendError(null)

    try {
      const fullPhoneNumber = `${data.countryCode}${data.phoneNumber.replace(/\D/g, "")}`
      const displayNumber = formatPhoneForDisplay(data.phoneNumber, data.countryCode)

      // Create the signup with phone number
      await signUp.create({ phoneNumber: fullPhoneNumber })

      // Trigger SMS verification
      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" })

      // Success - transition to code step
      onComplete(data, displayNumber)
    } catch (err: unknown) {
      // Extract Clerk error code
      const clerkError = err as { errors?: Array<{ code?: string }> }
      const errorCode = clerkError.errors?.[0]?.code
      setSendError(getClerkErrorMessage(errorCode))
    } finally {
      setIsSending(false)
    }
  })

  const phoneNumber = form.watch("phoneNumber")
  const isValid = phoneNumber.replace(/\D/g, "").length >= 7

  return (
    <VStack as="form" className={cn("gap-6", className)} onSubmit={form.handleSubmit(handleSubmit)}>
      <VStack className="gap-2">
        <h3 className="text-base font-medium">Verify you're human</h3>
        <p className="text-sm text-muted-foreground">We'll text you a 6-digit code to verify.</p>
      </VStack>

      <Field>
        <FieldLabel className="sr-only">Phone number</FieldLabel>
        <FieldContent>
          <HStack className="gap-2">
            <Controller
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <NativeSelect {...field} aria-label="Country code" className="w-28 shrink-0">
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
                    aria-describedby={fieldState.error ? "phone-error" : undefined}
                    aria-invalid={fieldState.invalid}
                    autoComplete="tel-national"
                    inputMode="tel"
                    placeholder="(555) 123-4567"
                    ref={(el) => {
                      field.ref(el)
                      ;(phoneInputRef as React.MutableRefObject<HTMLInputElement | null>).current =
                        el
                    }}
                    type="tel"
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} id="phone-error" />}
                </VStack>
              )}
            />
          </HStack>
        </FieldContent>
        <FieldDescription className="text-xs">
          Your number is never displayed or shared.
        </FieldDescription>
      </Field>

      {sendError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {sendError}
        </div>
      )}

      <HStack justify="end">
        <Button disabled={!isValid || isSending} size="lg" type="submit">
          {isSending ? (
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
  )
}

"use client"

import { useCallback, useEffect, useRef } from "react"
import { VStack } from "@/components/layout/stack"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useSignFlow } from "./hooks/use-sign-flow"
import type { Code, Commitment, Identity, SignFlowData, Verify, WhySigned } from "./schema"
import { CodeStep } from "./steps/code-step"
import { CommitmentStep } from "./steps/commitment-step"
import { CompletedSteps } from "./steps/completed-steps"
import { IdentityStep } from "./steps/identity-step"
import { VerifyStep } from "./steps/verify-step"
import { WhyStep } from "./steps/why-step"

export type SignFlowProps = {
  onSuccess?: (data: SignFlowData) => void
  className?: string
}

/**
 * SignFlow - Progressive disclosure sign flow component.
 *
 * Guides users through the signing process with a ceremonial feel:
 * 1. IDENTITY - Name, title, company (required)
 * 2. WHY_SIGNED - Why I'm signing (optional)
 * 3. COMMITMENT - 100 days commitment (optional)
 * 4. VERIFY - Phone number input
 * 5. CODE - 6-digit OTP verification
 * 6. SUCCESS - Confirmation (handled by parent)
 */
export const SignFlow: React.FC<SignFlowProps> = ({ onSuccess, className }) => {
  const signFlow = useSignFlow()
  const stepContainerRef = useRef<HTMLDivElement>(null)

  const {
    currentStep,
    data,
    completedSteps,
    skippedSteps,
    phoneNumberForDisplay,
    completeIdentity,
    completeWhy,
    skipWhy,
    completeCommitment,
    skipCommitment,
    completeVerify,
    completeCode,
  } = signFlow

  // Scroll to new step when it changes
  useEffect(() => {
    if (stepContainerRef.current && currentStep !== "IDENTITY") {
      // Small delay to allow animation to start
      const timer = setTimeout(() => {
        stepContainerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  // Notify parent when flow completes successfully
  useEffect(() => {
    if (currentStep === "SUCCESS" && onSuccess) {
      onSuccess(data as SignFlowData)
    }
  }, [currentStep, data, onSuccess])

  // =================================================================
  // Step Handlers
  // =================================================================

  const handleIdentityComplete = useCallback(
    (identityData: Identity) => completeIdentity(identityData),
    [completeIdentity]
  )

  const handleWhyComplete = useCallback((whyData: WhySigned) => completeWhy(whyData), [completeWhy])

  const handleCommitmentComplete = useCallback(
    (commitmentData: Commitment) => completeCommitment(commitmentData),
    [completeCommitment]
  )

  const handleVerifyComplete = useCallback(
    (verifyData: Verify, displayNumber: string) => completeVerify(verifyData, displayNumber),
    [completeVerify]
  )

  const handleCodeComplete = useCallback((codeData: Code) => completeCode(codeData), [completeCode])

  // =================================================================
  // Mock API Handlers (to be replaced with real API in Wave 3)
  // =================================================================

  const handleSendCode = useCallback(async (fullPhoneNumber: string): Promise<boolean> => {
    // Mock: simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    // Mock: always succeed for now
    console.log("[Mock] Sending verification code to:", fullPhoneNumber)
    return true
  }, [])

  const handleVerifyCode = useCallback(async (code: string): Promise<boolean> => {
    // Mock: simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Mock: accept any 6-digit code for now
    console.log("[Mock] Verifying code:", code)
    return code.length === 6
  }, [])

  const handleResendCode = useCallback(async (): Promise<boolean> => {
    // Mock: simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("[Mock] Resending verification code")
    return true
  }, [])

  // =================================================================
  // Render
  // =================================================================

  // Success state is handled by parent component
  if (currentStep === "SUCCESS") {
    return null
  }

  return (
    <VStack className={cn("gap-8", className)} data-slot="sign-flow">
      {/* Completed steps summary */}
      {completedSteps.length > 0 && (
        <CompletedSteps completedSteps={completedSteps} data={data} skippedSteps={skippedSteps} />
      )}

      {/* Separator between completed and active step */}
      {completedSteps.length > 0 && <Separator className="opacity-30" />}

      {/* Active step container with animation */}
      <div
        className={cn(
          "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both",
          currentStep === "IDENTITY" && "animate-none"
        )}
        data-step={currentStep}
        ref={stepContainerRef}
      >
        {/* Identity Step */}
        {currentStep === "IDENTITY" && (
          <IdentityStep
            initialData={{
              name: data.name,
              title: data.title,
              company: data.company,
            }}
            onComplete={handleIdentityComplete}
          />
        )}

        {/* Why Step */}
        {currentStep === "WHY_SIGNED" && (
          <WhyStep
            initialData={{ whySigned: data.whySigned }}
            onComplete={handleWhyComplete}
            onSkip={skipWhy}
          />
        )}

        {/* Commitment Step */}
        {currentStep === "COMMITMENT" && (
          <CommitmentStep
            initialData={{ commitment: data.commitment }}
            onComplete={handleCommitmentComplete}
            onSkip={skipCommitment}
          />
        )}

        {/* Verify Step */}
        {currentStep === "VERIFY" && (
          <VerifyStep
            initialData={{
              countryCode: data.countryCode,
              phoneNumber: data.phoneNumber,
            }}
            onComplete={handleVerifyComplete}
            onSendCode={handleSendCode}
          />
        )}

        {/* Code Step */}
        {currentStep === "CODE" && phoneNumberForDisplay && (
          <CodeStep
            onComplete={handleCodeComplete}
            onResend={handleResendCode}
            onVerify={handleVerifyCode}
            phoneNumber={phoneNumberForDisplay}
          />
        )}
      </div>
    </VStack>
  )
}

// Re-export types for convenience
export type { SignFlowData, SignFlowStep } from "./schema"

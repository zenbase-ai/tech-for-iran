"use client"

import { useMutation } from "convex/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { VStack } from "@/components/layout/stack"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import useAsyncFn from "@/hooks/use-async-fn"
import { clearReferralId, getReferralId } from "@/lib/referral"
import { cn } from "@/lib/utils"
import { useSignFlow } from "./hooks/use-sign-flow"
import type { Code, Commitment, Identity, SignFlowData, Verify, WhySigned } from "./schema"
import { CodeStep } from "./steps/code-step"
import { CommitmentStep } from "./steps/commitment-step"
import { CompletedSteps } from "./steps/completed-steps"
import { IdentityStep } from "./steps/identity-step"
import { SuccessStep } from "./steps/success-step"
import { VerifyStep } from "./steps/verify-step"
import { WhyStep } from "./steps/why-step"

export type SignFlowResult = SignFlowData & {
  phoneHash: string
  signatoryId: Id<"signatories">
  isUpdate: boolean
}

export type SignFlowProps = {
  onSuccess?: (result: SignFlowResult) => void
  className?: string
}

// Regex patterns moved to top level for performance
const CONVEX_ID_REGEX = /^[a-z0-9]{32}$/i

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
  const [signatoryResult, setSignatoryResult] = useState<{
    signatoryId: Id<"signatories">
    isUpdate: boolean
  } | null>(null)

  // Convex mutation for creating signatory
  const createSignatoryMutation = useMutation(api.signatories.mutate.create)
  const createSignatory = useAsyncFn(createSignatoryMutation)

  const {
    currentStep,
    data,
    completedSteps,
    skippedSteps,
    phoneNumberForDisplay,
    fullPhoneNumber,
    phoneHash,
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

  // Create signatory when verification succeeds
  useEffect(() => {
    if (currentStep === "SUCCESS" && phoneHash && !signatoryResult && !createSignatory.pending) {
      const createRecord = async () => {
        // Get referral ID if present
        const referredByRaw = getReferralId()
        // Only pass referredBy if it looks like a valid Convex ID
        const referredBy =
          referredByRaw && CONVEX_ID_REGEX.test(referredByRaw)
            ? (referredByRaw as Id<"signatories">)
            : undefined

        const result = await createSignatory.execute({
          name: data.name || "",
          title: data.title || "",
          company: data.company || "",
          phoneHash,
          whySigned: data.whySigned || undefined,
          commitmentText: data.commitment || undefined,
          referredBy,
        })

        if (result.signatoryId) {
          // Clear referral cookie after successful creation
          clearReferralId()
          setSignatoryResult({
            signatoryId: result.signatoryId,
            isUpdate: result.isUpdate,
          })
        }
      }

      createRecord()
    }
  }, [currentStep, phoneHash, signatoryResult, createSignatory, data])

  // Notify parent when signatory is created
  useEffect(() => {
    if (currentStep === "SUCCESS" && onSuccess && phoneHash && signatoryResult) {
      onSuccess({
        ...(data as SignFlowData),
        phoneHash,
        signatoryId: signatoryResult.signatoryId,
        isUpdate: signatoryResult.isUpdate,
      })
    }
  }, [currentStep, data, phoneHash, signatoryResult, onSuccess])

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
    (verifyData: Verify, displayNumber: string) => {
      // Build full phone number from country code and phone number
      const fullPhone = `${verifyData.countryCode}${verifyData.phoneNumber.replace(/\D/g, "")}`
      return completeVerify(verifyData, displayNumber, fullPhone)
    },
    [completeVerify]
  )

  const handleCodeComplete = useCallback(
    (codeData: Code, hash: string) => completeCode(codeData, hash),
    [completeCode]
  )

  // =================================================================
  // Render
  // =================================================================

  // Success state - show the success step with share functionality
  if (currentStep === "SUCCESS" && signatoryResult) {
    return <SuccessStep className={className} signatoryId={signatoryResult.signatoryId} />
  }

  // Success state - still creating signatory, show loading placeholder
  if (currentStep === "SUCCESS") {
    return <SuccessStep className={className} signatoryId={"" as Id<"signatories">} />
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
          />
        )}

        {/* Code Step */}
        {currentStep === "CODE" && phoneNumberForDisplay && fullPhoneNumber && (
          <CodeStep
            fullPhoneNumber={fullPhoneNumber}
            onComplete={handleCodeComplete}
            phoneNumber={phoneNumberForDisplay}
          />
        )}
      </div>
    </VStack>
  )
}

// Re-export types for convenience
export type { SignFlowData, SignFlowStep } from "./schema"

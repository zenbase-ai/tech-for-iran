"use client"

import { useCallback, useMemo, useReducer } from "react"
import {
  type Code,
  CodeSchema,
  type Commitment,
  CommitmentSchema,
  type Identity,
  IdentitySchema,
  SIGN_FLOW_STEPS,
  type SignFlowData,
  type SignFlowStep,
  signFlowConfig,
  type Verify,
  VerifySchema,
  type WhySigned,
  WhySignedSchema,
} from "../schema"

// =================================================================
// State Types
// =================================================================

export type SignFlowState = {
  currentStep: SignFlowStep
  data: Partial<SignFlowData>
  completedSteps: SignFlowStep[]
  skippedSteps: SignFlowStep[]
  phoneNumberForDisplay: string | null
  fullPhoneNumber: string | null
  phoneHash: string | null
  errors: Partial<Record<keyof SignFlowData, string>>
}

// =================================================================
// Action Types
// =================================================================

type SignFlowAction =
  | { type: "COMPLETE_IDENTITY"; payload: Identity }
  | { type: "COMPLETE_WHY"; payload: WhySigned }
  | { type: "SKIP_WHY" }
  | { type: "COMPLETE_COMMITMENT"; payload: Commitment }
  | { type: "SKIP_COMMITMENT" }
  | {
      type: "COMPLETE_VERIFY"
      payload: Verify & { displayNumber: string; fullPhoneNumber: string }
    }
  | { type: "COMPLETE_CODE"; payload: Code & { phoneHash: string } }
  | { type: "SET_ERROR"; payload: { field: keyof SignFlowData; message: string } }
  | { type: "CLEAR_ERROR"; payload: keyof SignFlowData }
  | { type: "RESET" }
  | { type: "GO_BACK" }

// =================================================================
// Initial State
// =================================================================

const initialState: SignFlowState = {
  currentStep: "IDENTITY",
  data: {
    name: signFlowConfig.defaultValues.name,
    title: signFlowConfig.defaultValues.title,
    company: signFlowConfig.defaultValues.company,
    whySigned: signFlowConfig.defaultValues.whySigned,
    commitment: signFlowConfig.defaultValues.commitment,
    countryCode: signFlowConfig.defaultValues.countryCode,
    phoneNumber: signFlowConfig.defaultValues.phoneNumber,
    verificationCode: signFlowConfig.defaultValues.verificationCode,
  },
  completedSteps: [],
  skippedSteps: [],
  phoneNumberForDisplay: null,
  fullPhoneNumber: null,
  phoneHash: null,
  errors: {},
}

// =================================================================
// Step Navigation Helpers
// =================================================================

const getPreviousStep = (currentStep: SignFlowStep): SignFlowStep => {
  const currentIndex = SIGN_FLOW_STEPS.indexOf(currentStep)
  if (currentIndex <= 0) {
    return currentStep
  }
  return SIGN_FLOW_STEPS[currentIndex - 1]
}

// =================================================================
// Reducer
// =================================================================

function signFlowReducer(state: SignFlowState, action: SignFlowAction): SignFlowState {
  switch (action.type) {
    case "COMPLETE_IDENTITY": {
      return {
        ...state,
        currentStep: "WHY_SIGNED",
        data: { ...state.data, ...action.payload },
        completedSteps: [...state.completedSteps, "IDENTITY"],
        errors: {},
      }
    }

    case "COMPLETE_WHY": {
      return {
        ...state,
        currentStep: "COMMITMENT",
        data: { ...state.data, ...action.payload },
        completedSteps: [...state.completedSteps, "WHY_SIGNED"],
        errors: {},
      }
    }

    case "SKIP_WHY": {
      return {
        ...state,
        currentStep: "COMMITMENT",
        data: { ...state.data, whySigned: "" },
        completedSteps: [...state.completedSteps, "WHY_SIGNED"],
        skippedSteps: [...state.skippedSteps, "WHY_SIGNED"],
        errors: {},
      }
    }

    case "COMPLETE_COMMITMENT": {
      return {
        ...state,
        currentStep: "VERIFY",
        data: { ...state.data, ...action.payload },
        completedSteps: [...state.completedSteps, "COMMITMENT"],
        errors: {},
      }
    }

    case "SKIP_COMMITMENT": {
      return {
        ...state,
        currentStep: "VERIFY",
        data: { ...state.data, commitment: "" },
        completedSteps: [...state.completedSteps, "COMMITMENT"],
        skippedSteps: [...state.skippedSteps, "COMMITMENT"],
        errors: {},
      }
    }

    case "COMPLETE_VERIFY": {
      const { displayNumber, fullPhoneNumber, ...verifyData } = action.payload
      return {
        ...state,
        currentStep: "CODE",
        data: { ...state.data, ...verifyData },
        completedSteps: [...state.completedSteps, "VERIFY"],
        phoneNumberForDisplay: displayNumber,
        fullPhoneNumber,
        errors: {},
      }
    }

    case "COMPLETE_CODE": {
      const { phoneHash, ...codeData } = action.payload
      return {
        ...state,
        currentStep: "SUCCESS",
        data: { ...state.data, ...codeData },
        completedSteps: [...state.completedSteps, "CODE"],
        phoneHash,
        errors: {},
      }
    }

    case "SET_ERROR": {
      return {
        ...state,
        errors: { ...state.errors, [action.payload.field]: action.payload.message },
      }
    }

    case "CLEAR_ERROR": {
      const newErrors = { ...state.errors }
      delete newErrors[action.payload]
      return {
        ...state,
        errors: newErrors,
      }
    }

    case "GO_BACK": {
      const prevStep = getPreviousStep(state.currentStep)
      if (prevStep === state.currentStep) {
        return state
      }

      return {
        ...state,
        currentStep: prevStep,
        completedSteps: state.completedSteps.filter((s) => s !== prevStep),
        skippedSteps: state.skippedSteps.filter((s) => s !== prevStep),
        errors: {},
      }
    }

    case "RESET": {
      return initialState
    }

    default:
      return state
  }
}

// =================================================================
// Hook
// =================================================================

export type UseSignFlowReturn = {
  state: SignFlowState
  currentStep: SignFlowStep
  data: Partial<SignFlowData>
  completedSteps: SignFlowStep[]
  skippedSteps: SignFlowStep[]
  phoneNumberForDisplay: string | null
  fullPhoneNumber: string | null
  phoneHash: string | null
  errors: Partial<Record<keyof SignFlowData, string>>

  // Step completion actions
  completeIdentity: (data: Identity) => boolean
  completeWhy: (data: WhySigned) => boolean
  skipWhy: () => void
  completeCommitment: (data: Commitment) => boolean
  skipCommitment: () => void
  completeVerify: (data: Verify, displayNumber: string, fullPhoneNumber: string) => boolean
  completeCode: (data: Code, phoneHash: string) => boolean

  // Navigation
  goBack: () => void
  reset: () => void

  // Error handling
  setError: (field: keyof SignFlowData, message: string) => void
  clearError: (field: keyof SignFlowData) => void

  // Helper checks
  isStepCompleted: (step: SignFlowStep) => boolean
  isStepSkipped: (step: SignFlowStep) => boolean
  isStepActive: (step: SignFlowStep) => boolean
  canGoBack: boolean
}

export function useSignFlow(): UseSignFlowReturn {
  const [state, dispatch] = useReducer(signFlowReducer, initialState)

  // Step completion actions with validation
  const completeIdentity = useCallback((data: Identity): boolean => {
    const result = IdentitySchema.safeParse(data)
    if (!result.success) {
      const firstError = result.error.issues[0]
      if (firstError) {
        dispatch({
          type: "SET_ERROR",
          payload: { field: firstError.path[0] as keyof SignFlowData, message: firstError.message },
        })
      }
      return false
    }
    dispatch({ type: "COMPLETE_IDENTITY", payload: result.data })
    return true
  }, [])

  const completeWhy = useCallback((data: WhySigned): boolean => {
    const result = WhySignedSchema.safeParse(data)
    if (!result.success) {
      const firstError = result.error.issues[0]
      if (firstError) {
        dispatch({
          type: "SET_ERROR",
          payload: { field: firstError.path[0] as keyof SignFlowData, message: firstError.message },
        })
      }
      return false
    }
    dispatch({ type: "COMPLETE_WHY", payload: result.data })
    return true
  }, [])

  const skipWhy = useCallback(() => {
    dispatch({ type: "SKIP_WHY" })
  }, [])

  const completeCommitment = useCallback((data: Commitment): boolean => {
    const result = CommitmentSchema.safeParse(data)
    if (!result.success) {
      const firstError = result.error.issues[0]
      if (firstError) {
        dispatch({
          type: "SET_ERROR",
          payload: { field: firstError.path[0] as keyof SignFlowData, message: firstError.message },
        })
      }
      return false
    }
    dispatch({ type: "COMPLETE_COMMITMENT", payload: result.data })
    return true
  }, [])

  const skipCommitment = useCallback(() => {
    dispatch({ type: "SKIP_COMMITMENT" })
  }, [])

  const completeVerify = useCallback(
    (data: Verify, displayNumber: string, fullPhoneNumber: string): boolean => {
      const result = VerifySchema.safeParse(data)
      if (!result.success) {
        const firstError = result.error.issues[0]
        if (firstError) {
          dispatch({
            type: "SET_ERROR",
            payload: {
              field: firstError.path[0] as keyof SignFlowData,
              message: firstError.message,
            },
          })
        }
        return false
      }
      dispatch({
        type: "COMPLETE_VERIFY",
        payload: { ...result.data, displayNumber, fullPhoneNumber },
      })
      return true
    },
    []
  )

  const completeCode = useCallback((data: Code, phoneHash: string): boolean => {
    const result = CodeSchema.safeParse(data)
    if (!result.success) {
      const firstError = result.error.issues[0]
      if (firstError) {
        dispatch({
          type: "SET_ERROR",
          payload: { field: firstError.path[0] as keyof SignFlowData, message: firstError.message },
        })
      }
      return false
    }
    dispatch({ type: "COMPLETE_CODE", payload: { ...result.data, phoneHash } })
    return true
  }, [])

  // Navigation
  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: "RESET" })
  }, [])

  // Error handling
  const setError = useCallback((field: keyof SignFlowData, message: string) => {
    dispatch({ type: "SET_ERROR", payload: { field, message } })
  }, [])

  const clearError = useCallback((field: keyof SignFlowData) => {
    dispatch({ type: "CLEAR_ERROR", payload: field })
  }, [])

  // Helper checks
  const isStepCompleted = useCallback(
    (step: SignFlowStep) => state.completedSteps.includes(step),
    [state.completedSteps]
  )

  const isStepSkipped = useCallback(
    (step: SignFlowStep) => state.skippedSteps.includes(step),
    [state.skippedSteps]
  )

  const isStepActive = useCallback(
    (step: SignFlowStep) => state.currentStep === step,
    [state.currentStep]
  )

  const canGoBack = useMemo(
    () => state.currentStep !== "IDENTITY" && state.currentStep !== "SUCCESS",
    [state.currentStep]
  )

  return {
    state,
    currentStep: state.currentStep,
    data: state.data,
    completedSteps: state.completedSteps,
    skippedSteps: state.skippedSteps,
    phoneNumberForDisplay: state.phoneNumberForDisplay,
    fullPhoneNumber: state.fullPhoneNumber,
    phoneHash: state.phoneHash,
    errors: state.errors,

    completeIdentity,
    completeWhy,
    skipWhy,
    completeCommitment,
    skipCommitment,
    completeVerify,
    completeCode,

    goBack,
    reset,

    setError,
    clearError,

    isStepCompleted,
    isStepSkipped,
    isStepActive,
    canGoBack,
  }
}

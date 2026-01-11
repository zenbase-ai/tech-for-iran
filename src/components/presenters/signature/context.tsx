"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"
import type { Id } from "@/convex/_generated/dataModel"
import useCookie from "@/hooks/use-cookies"
import { ANON_ID_COOKIE, REFERRAL_COOKIE, X_USERNAME_COOKIE } from "@/lib/cookies"

type SignatureContextValue = {
  xUsername: string | undefined
  anonId: string | undefined
  setXUsername: (username: string) => void
  setAnonId: (anonId: string) => void
  referredBy: Id<"signatures"> | undefined
  setReferredBy: (referredBy: Id<"signatures"> | undefined) => void
}

const SignatureContext = createContext<SignatureContextValue | null>(null)

export type SignatureProviderProps = {
  children: ReactNode
}

export const SignatureProvider: React.FC<SignatureProviderProps> = ({ children }) => {
  const [xUsername, setXUsername] = useCookie(X_USERNAME_COOKIE)
  const [anonId, setAnonId] = useCookie(ANON_ID_COOKIE)
  const [referredBy, setReferredBy] = useCookie<Id<"signatures">>(REFERRAL_COOKIE)

  const contextValue = useMemo(
    () => ({ xUsername, anonId, setXUsername, setAnonId, referredBy, setReferredBy }),
    [xUsername, anonId, referredBy, setXUsername, setAnonId, setReferredBy]
  )

  return <SignatureContext.Provider value={contextValue}>{children}</SignatureContext.Provider>
}

export const useSignatureContext = () => {
  const context = useContext(SignatureContext)
  if (!context) {
    throw new Error("useSignatureContext must be used within SignatureProvider")
  }
  return context
}

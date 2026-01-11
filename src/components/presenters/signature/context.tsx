"use client"

import { createContext, type ReactNode, useContext, useState } from "react"
import { getAnonId, getXUsername, setXUsername as setCookieXUsername } from "@/lib/cookies"

type SignatureContextValue = {
  xUsername: string | undefined
  anonId: string | undefined
  setXUsername: (username: string) => void
}

const SignatureContext = createContext<SignatureContextValue | null>(null)

export type SignatureProviderProps = {
  children: ReactNode
}

export const SignatureProvider: React.FC<SignatureProviderProps> = ({ children }) => {
  const [xUsername, setXUsernameState] = useState<string | undefined>(() => getXUsername())
  const [anonId] = useState<string | undefined>(() => getAnonId())

  const setXUsername = (username: string) => {
    setCookieXUsername(username)
    setXUsernameState(username.toLowerCase())
  }

  return (
    <SignatureContext.Provider value={{ xUsername, anonId, setXUsername }}>
      {children}
    </SignatureContext.Provider>
  )
}

export const useSignatureContext = () => {
  const context = useContext(SignatureContext)
  if (!context) {
    throw new Error("useSignatureContext must be used within SignatureProvider")
  }
  return context
}

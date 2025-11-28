"use client"

import { AutumnProvider as ReactAutumnProvider } from "autumn-js/react"
import { useConvex } from "convex/react"
import { api } from "@/convex/_generated/api"

export const AutumnProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const convex = useConvex()

  return (
    <ReactAutumnProvider convex={convex} convexApi={api.autumn}>
      {children}
    </ReactAutumnProvider>
  )
}

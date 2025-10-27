"use client"

import { useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { env } from "@/lib/env.mjs"

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL)

export const ConvexClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    {children}
  </ConvexProviderWithClerk>
)

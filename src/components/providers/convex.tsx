"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { env } from "@/lib/env.mjs"

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL)

export const ConvexClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ConvexProvider client={convex}>{children}</ConvexProvider>
)

"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/themes"
import { env } from "@/lib/env.mjs"

export const ClerkClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ClerkProvider
    appearance={{
      theme: shadcn,
      variables: {
        colorShadow: "#fff",
      },
      elements: {
        button: {
          borderRadius: "calc(infinity * 1px)",
        },
      },
    }}
    publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  >
    {children}
  </ClerkProvider>
)

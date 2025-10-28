import { ClerkProvider } from "@clerk/nextjs"
import { env } from "@/lib/env.mjs"

export const ClerkClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>{children}</ClerkProvider>
)

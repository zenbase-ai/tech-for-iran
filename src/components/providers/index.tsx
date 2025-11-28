import { NuqsAdapter } from "nuqs/adapters/next/app"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AutumnProvider } from "./autumn"
import { ClerkClientProvider } from "./clerk"
import { ConvexClientProvider } from "./convex"
import { NextThemeProvider } from "./theme"

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => (
  <NextThemeProvider>
    <TooltipProvider>
      <ClerkClientProvider>
        <ConvexClientProvider>
          <AutumnProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </AutumnProvider>
        </ConvexClientProvider>
      </ClerkClientProvider>
    </TooltipProvider>
  </NextThemeProvider>
)

import { TooltipProvider } from "@/components/ui/tooltip"
import { ClerkClientProvider } from "./clerk"
import { ConvexClientProvider } from "./convex"
import { NextThemeProvider } from "./theme"

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => (
  <NextThemeProvider>
    <TooltipProvider>
      <ClerkClientProvider>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </ClerkClientProvider>
    </TooltipProvider>
  </NextThemeProvider>
)

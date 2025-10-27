import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "@/components/providers/convex"
import { ThemeProvider } from "@/components/providers/theme"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ClerkProvider>
    <ConvexClientProvider>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </ConvexClientProvider>
  </ClerkProvider>
)

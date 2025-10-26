import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/providers/theme"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ClerkProvider>
    <ThemeProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  </ClerkProvider>
)

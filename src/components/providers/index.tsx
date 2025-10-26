import { ThemeProvider } from "@/components/providers/theme"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ThemeProvider>
    <TooltipProvider>{children}</TooltipProvider>
  </ThemeProvider>
)

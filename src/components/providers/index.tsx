"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConvexClientProvider } from "./convex"
import { NextThemeProvider } from "./theme"

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => (
  <NextThemeProvider>
    <TooltipProvider>
      <ConvexClientProvider>
        <NuqsAdapter>{children}</NuqsAdapter>
      </ConvexClientProvider>
    </TooltipProvider>
  </NextThemeProvider>
)

import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Suspense } from "react"
import { crimsonPro, geistMono, inter } from "@/components/assets/fonts"
import { FlashToasts } from "@/components/effects/flash-toasts"
import { InitPosthog } from "@/components/effects/init-posthog"
import { InitReferrer } from "@/components/effects/init-referrer"
import { Box } from "@/components/layout/box"
import { Nav } from "@/components/layout/nav"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: {
    default: "Tech for Iran",
    template: "%s | Tech for Iran",
  },
  description:
    "An open letter from founders, investors, and operators pledging to do business with a free Iran.",
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  initialScale: 1.0,
  maximumScale: 1.0,
  themeColor: "#000000",
  viewportFit: "cover",
  width: "device-width",
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <script
            async
            crossOrigin="anonymous"
            src="https://unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
      </head>
      <body
        className={cn(
          "antialiased w-screen min-h-screen",
          inter.variable,
          crimsonPro.variable,
          geistMono.variable
        )}
      >
        <Providers>
          <Toaster position="top-center" />
          <Suspense fallback={null}>
            <FlashToasts />
            <InitPosthog />
            <InitReferrer />
          </Suspense>

          <Nav
            className="fixed left-4 lg:left-8 xl:left-16 top-4 lg:top-8 xl:top-16 z-42"
            initial={{ opacity: 0, y: -16 }}
          />

          <Box className="w-full p-4 lg:p-8 xl:p-16">{children}</Box>
        </Providers>
      </body>
    </html>
  )
}

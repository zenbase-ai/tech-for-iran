import type { Viewport } from "next"
import "./globals.css"
import { Suspense } from "react"
import { crimsonPro, geistMono, inter } from "@/components/assets/fonts"
import { FlashToasts } from "@/components/effects/flash-toasts"
import { InitPosthog } from "@/components/effects/init-posthog"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export const viewport: Viewport = {
  colorScheme: "light dark",
  initialScale: 1.0,
  maximumScale: 1.0,
  themeColor: "#74abae",
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
          </Suspense>

          <section className="container min-w-[320px] w-full mx-auto px-4 py-8 sm:py-12 md:py-16">
            {children}
          </section>
        </Providers>
      </body>
    </html>
  )
}

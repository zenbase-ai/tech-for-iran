import type { Viewport } from "next"
import { Suspense } from "react"
import "./globals.css"
import { crimsonPro, geistMono, inter } from "@/components/assets/fonts"
import { Flash } from "@/components/layout/flash"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"

export const viewport: Viewport = {
  themeColor: "#74abae",
  initialScale: 1.0,
  width: "device-width",
  viewportFit: "cover",
  colorScheme: "light dark",
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
          <Suspense fallback={null}>
            <Flash position="top-center" />
          </Suspense>
          <section className="container min-w-[320px] w-fit mx-auto px-4 py-21 md:py-28">
            {children}
          </section>
        </Providers>
      </body>
    </html>
  )
}

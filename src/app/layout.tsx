import type { Viewport } from "next"
import "./globals.css"
import { crimsonPro, inter } from "@/components/assets/fonts"
import { Container } from "@/components/layout/container"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { cn } from "@/lib/utils"

export const viewport: Viewport = {
  themeColor: "#74abae",
  initialScale: 1.0,
  width: "device-width",
  viewportFit: "cover",
  colorScheme: "light dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />
        )}
      </head>
      <body
        className={cn("antialiased w-screen min-h-screen", inter.variable, crimsonPro.variable)}
      >
        <Providers>
          <Container className="my-8 md:my-10 lg:my-12">{children}</Container>
          <Toaster position="top-right" />
          <ThemeToggler className="fixed bottom-4 right-4" duration={0.3} />
        </Providers>
      </body>
    </html>
  )
}

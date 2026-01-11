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

const title = "Tech for Iran"
const description =
  "Founders, investors, and operators pledging to do business with a free Iran. Day one. This is not hope. This is a commitment."
const url = "https://techforiran.com"

export const metadata = {
  title: {
    default: "Tech for Iran",
    template: `%s | ${title}`,
  },
  description,
  keywords: [
    "Iran",
    "tech",
    "founders",
    "investors",
    "operators",
    "startups",
    "commitment",
    "free Iran",
    "open letter",
    "pledge",
  ],
  authors: [{ name: "Tech for Iran" }],
  creator: "Tech for Iran",
  publisher: "Tech for Iran",
  metadataBase: new URL(url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url,
    siteName: title,
    title: "Tech for Iran — When Iran opens, we're in.",
    description,
    images: [
      { url: "/opengraph.gif", width: 1200, height: 630 },
      { url: "/opengraph.png", width: 1200, height: 630 },
    ],
    videos: [{ url: "/opengraph.mp4", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech for Iran — When Iran opens, we're in.",
    description,
    creator: "@cyrusnewday",
    images: ["/opengraph.gif", "/opengraph.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
} as const satisfies Metadata

export const viewport: Viewport = {
  colorScheme: "light dark",
  initialScale: 1.0,
  maximumScale: 1.0,
  themeColor: "#f5bf4a",
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

          <Nav />

          <Box className="w-full p-4 lg:p-8 xl:p-16">{children}</Box>
        </Providers>
      </body>
    </html>
  )
}

"use client" // Error boundaries must be Client Components

import Image from "next/image"
import { crimsonPro, geistMono, inter } from "@/components/assets/fonts"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { PageDescription, PageTitle } from "@/components/layout/text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import NotFound from "@/public/not-found.png"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

// global-error must include html and body tags
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        className={cn(
          "antialiased w-screen min-h-screen",
          inter.variable,
          crimsonPro.variable,
          geistMono.variable
        )}
      >
        <section className="container min-w-[320px] w-fit mx-auto px-4 py-8 sm:py-12 md:py-16">
          <VStack
            as="main"
            className="text-center size-full gap-4 md:gap-6 lg:gap-8"
            items="center"
            justify="center"
          >
            <VStack className="gap-2" items="center">
              <Badge className="font-mono" variant="secondary">
                GLOBAL ERROR
              </Badge>

              <PageTitle>Something went terribly wrong.</PageTitle>
              <PageDescription>An error occured, please refresh the page.</PageDescription>

              <Button className="mt-6" onClick={reset}>
                Refresh
              </Button>
            </VStack>

            <Box className="object-contain w-full max-w-[360px]">
              <Image alt="Error" className="dark:invert" height={662} src={NotFound} width={624} />
            </Box>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 max-w-lg">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-left bg-muted p-2 rounded overflow-auto">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
          </VStack>
        </section>
      </body>
    </html>
  )
}

"use client" // Error boundaries must be Client Components

import Image from "next/image"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { PageDescription, PageTitle } from "@/components/layout/text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NotFound from "@/public/not-found.png"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

// global-error must include html and body tags
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <VStack
          as="main"
          className="text-center size-full gap-4 md:gap-6 lg:gap-8"
          items="center"
          justify="center"
        >
          <VStack className="gap-2" items="center">
            <PageTitle>Something went terribly wrong.</PageTitle>
            <PageDescription>An error occured, please refresh the page.</PageDescription>
            <Button onClick={reset}>Refresh</Button>
          </VStack>

          <Box className="object-contain w-full max-w-[360px]">
            <Image alt="Error" className="dark:invert" height={662} src={NotFound} width={624} />
          </Box>

          <Badge className="text-base" variant="secondary">
            GLOBAL ERROR
          </Badge>

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
      </body>
    </html>
  )
}

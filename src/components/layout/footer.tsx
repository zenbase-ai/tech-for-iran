"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { MountainIcon } from "@/components/assets/mountain-icon"
import { Wordmark } from "@/components/assets/wordmark"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { LinkedInLink, XTwitterLink } from "@/components/marketing/social-link"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const patterncn = "h-[30vh] min-h-[128px] w-screen"
const DotPattern = dynamic(() => import("@/components/assets/dot-pattern"), {
  ssr: false,
  loading: () => <Skeleton className={patterncn} />,
})

export const Footer: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <Box className={cn("relative overflow-hidden", className)} {...props}>
    <Box className="absolute bottom-0 left-0 right-0 text-muted px-8 -z-1">
      <MountainIcon className="translate-y-1/3 max-w-[768px] max-h-[512px] mx-auto" />
    </Box>

    <DotPattern className={patterncn} />

    <VStack
      as="footer"
      items="center"
      justify="center"
      className="gap-0 p-6 pb-8 lg:p-12 lg:pb-16 text-center text-muted-foreground"
    >
      <Link href="/thesis" prefetch>
        <Wordmark shimmer className="scale-125" />
      </Link>

      <HStack items="center" justify="center" className="gap-4 w-full mt-8 mb-4">
        <LinkedInLink path="company/synthesisco" aria-label="LinkedIn" />
        <XTwitterLink path="SynthesisCoCA" aria-label="X" />
      </HStack>

      <h6 className="font-mono text-xs text-center uppercase">
        Copyright © {new Date().getFullYear()}
      </h6>
    </VStack>
  </Box>
)

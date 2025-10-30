import Image from "next/image"
import Link from "next/link"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { Badge } from "@/components/ui/badge"
import { HoverButton } from "@/components/ui/hover-button"

export default function NotFoundPage() {
  "use memo"

  return (
    <VStack
      items="center"
      justify="center"
      className="size-full text-center gap-4 md:gap-6 lg:gap-8"
    >
      <VStack items="center" className="gap-2">
        <h1 className="text-xl md:text-2xl font-serif italic">You found a secret hallway.</h1>
        <Badge variant="secondary" className="text-base">
          CODE 404
        </Badge>
      </VStack>
      <Box className="w-full max-w-[360px]">
        <Image
          src="/not-found.png"
          loading="eager"
          alt="Not Found"
          width={624}
          height={662}
          className="object-contain grayscale dark:invert"
        />
      </Box>
      <Link href="/">
        <HoverButton variant="primary" hoverChildren="Go home">
          Take me home
        </HoverButton>
      </Link>
    </VStack>
  )
}

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
      className="size-full text-center gap-4 md:gap-6 lg:gap-8"
      items="center"
      justify="center"
    >
      <VStack className="gap-2" items="center">
        <h1 className="text-xl md:text-2xl font-serif italic">You found a secret hallway.</h1>
        <Badge className="text-base" variant="secondary">
          CODE 404
        </Badge>
      </VStack>
      <Box className="w-full max-w-[360px]">
        <Image
          alt="Not Found"
          className="object-contain grayscale dark:invert"
          height={662}
          loading="eager"
          src="/not-found.png"
          width={624}
        />
      </Box>
      <Link href="/">
        <HoverButton hoverChildren="Go home" variant="primary">
          Take me home
        </HoverButton>
      </Link>
    </VStack>
  )
}

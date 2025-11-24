import Image from "next/image"
import Link from "next/link"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { PageDescription, PageTitle } from "@/components/layout/text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NotFound from "@/public/not-found.png"

export default function NotFoundPage() {
  "use memo"

  return (
    <VStack
      className="size-full text-center gap-4 md:gap-6 lg:gap-8"
      items="center"
      justify="center"
    >
      <VStack className="gap-2" items="center">
        <PageTitle>You found a secret hallway.</PageTitle>
        <PageDescription>The page you are looking for does not exist.</PageDescription>
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
          src={NotFound}
          width={624}
        />
      </Box>

      <Button asChild>
        <Link href="/">Take me home</Link>
      </Button>
    </VStack>
  )
}

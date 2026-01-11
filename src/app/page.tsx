import type { Metadata } from "next"
import { RisingLion } from "@/components/assets/rising-lion"
import { Prose } from "@/components/layout/prose"
import { Stack, VStack } from "@/components/layout/stack"
import Manifesto from "@/components/presenters/manifesto.mdx"
import { SignatureSection } from "@/components/presenters/signature/section"
import { SignatureWall } from "@/components/presenters/signature/wall"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Tech for Iran",
  description: "An open letter from founders, investors, and operators.",
}

export default function HomePage() {
  "use memo"

  return (
    <Stack as="main" className={cn("flex-col md:flex-row", "gap-12 lg:gap-16 xl:gap-24")}>
      <VStack className="gap-4 flex-1 lg:flex-2/5 xl:flex-1/3 max-w-xl mt-14 lg:mt-16 xl:mt-20">
        <RisingLion className="w-full" />

        <Prose>
          <Manifesto />
        </Prose>

        <SignatureSection />
      </VStack>

      <SignatureWall
        className="flex-1 lg:flex-3/5 xl:flex-2/3"
        gridClassName="grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
      />
    </Stack>
  )
}

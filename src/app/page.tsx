import type React from "react"
import { RisingLion } from "@/components/assets/rising-lion"
import { Prose } from "@/components/layout/prose"
import { Stack, type StackProps, VStack } from "@/components/layout/stack"
import Manifesto from "@/components/presenters/manifesto.mdx"
import { SignatureProvider } from "@/components/presenters/signature/context"
import { SignatureSection } from "@/components/presenters/signature/section"
import { SignatureWall } from "@/components/presenters/signature/wall"
import { cn } from "@/lib/utils"

const Column: React.FC<StackProps> = ({ children, className, ...props }) => (
  <VStack className={cn("flex-1 top-0", className)} {...props}>
    {children}
  </VStack>
)

export default function HomePage() {
  "use memo"

  return (
    <Stack
      as="main"
      className={cn("flex-col md:flex-row", "px-4 lg:px-8 xl:px-16", "gap-12 lg:gap-16 xl:gap-24")}
    >
      <Column className="gap-4 flex-1 lg:flex-2/5 xl:flex-1/3 max-w-xl mt-19 lg:mt-23 xl:mt-31">
        <RisingLion className="w-full" />

        <Prose>
          <Manifesto />
        </Prose>

        <SignatureProvider>
          <SignatureSection />
        </SignatureProvider>
      </Column>

      <Column className="lg:flex-3/5 xl:flex-2/3 h-screen">
        <SignatureProvider>
          <SignatureWall
            className="pt-4 lg:pt-8 xl:pt-16"
            gridClassName="grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
          />
        </SignatureProvider>
      </Column>
    </Stack>
  )
}

import { RisingLion } from "@/components/assets/rising-lion"
import { HStack, VStack } from "@/components/layout/stack"

export const OpenGraph: React.FC<React.PropsWithChildren> = ({ children }) => (
  <VStack className="w-[1200] h-[630] border p-12 overflow-hidden gap-16" justify="center">
    <HStack className="gap-12" items="center">
      {children}
      <RisingLion className="flex-1" />
    </HStack>
    <HStack className="text-muted-foreground text-3xl" justify="between">
      <span>⁂ Founders</span>
      <span>⁂ Investors</span>
      <span>⁂ Operators</span>
    </HStack>
  </VStack>
)

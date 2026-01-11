import { RisingLion } from "@/components/assets/rising-lion"
import { HStack, Stack, VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"

export default function OpenGraphPage() {
  return (
    <Stack className="mt-[20vh]" items="center" justify="center">
      <VStack className="w-[1200] h-[630] border p-12 overflow-hidden gap-16" justify="center">
        <HStack className="gap-12" items="center">
          <VStack className="gap-4">
            <span className="font-sans text-2xl font-medium border-b">Tech for Iran</span>
            <PageTitle className="flex-1 text-4xl not-italic">
              When Iran opens,
              <br />
              <span className="text-[8rem] font-bold italic">we&rsquo;re in.</span>
            </PageTitle>
          </VStack>
          <RisingLion className="flex-1" />
        </HStack>
        <HStack className="text-muted-foreground text-3xl" justify="between">
          <span>⁂ Founders</span>
          <span>⁂ Investors</span>
          <span>⁂ Operators</span>
        </HStack>
      </VStack>
    </Stack>
  )
}

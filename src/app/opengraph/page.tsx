import { Stack, VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { OpenGraph } from "@/components/presenters/opengraph"

export default function OpenGraphPage() {
  return (
    <Stack className="mt-[20vh]" items="center" justify="center">
      <OpenGraph>
        <VStack className="gap-4">
          <span className="font-sans text-2xl font-medium border-b">Tech for Iran</span>
          <PageTitle className="flex-1 text-4xl not-italic">
            When Iran opens,
            <br />
            <span className="text-[8rem] font-bold italic">we&rsquo;re in.</span>
          </PageTitle>
        </VStack>
      </OpenGraph>
    </Stack>
  )
}

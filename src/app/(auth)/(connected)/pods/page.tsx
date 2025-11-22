import type { Metadata } from "next"
import { Box } from "@/components/layout/box"
import { PageDescription, PageTitle } from "@/components/layout/text"
import PodsClientPage from "./page.client"

export const metadata: Metadata = {
  title: "Pods | Crackedbook",
}

export default async function PodsPage() {
  "use memo"

  return (
    <Box className="px-2 w-full max-w-[640px] mx-auto">
      <PageTitle>Engagement Pods</PageTitle>

      <PageDescription>
        Pods are groups that engage with each other&apos;s LinkedIn posts.
      </PageDescription>

      <PodsClientPage />
    </Box>
  )
}

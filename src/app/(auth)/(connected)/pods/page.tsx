import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { PageDescription, PageTitle } from "@/components/layout/text"
import PodsClientPage from "./page.client"

export const metadata: Metadata = {
  title: "Pods | Crackedbook",
}

export default function PodsPage() {
  return (
    <VStack className="max-w-lg mx-auto">
      <PageTitle>Engagement Pods</PageTitle>

      <PageDescription>
        Pods are groups that engage with each other&apos;s LinkedIn posts.
      </PageDescription>

      <PodsClientPage />
    </VStack>
  )
}

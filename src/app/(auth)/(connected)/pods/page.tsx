import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/header"
import { VStack } from "@/components/layout/stack"
import { PageDescription } from "@/components/layout/text"
import PodsClientPage from "./page.client"

export const metadata: Metadata = {
  title: "Pods | Crackedbook",
}

export default function PodsPage() {
  return (
    <VStack className="max-w-lg mx-auto">
      <PageHeader title="Pods" />

      <PageDescription>Groups that engage with each other's LinkedIn posts.</PageDescription>

      <PodsClientPage />
    </VStack>
  )
}

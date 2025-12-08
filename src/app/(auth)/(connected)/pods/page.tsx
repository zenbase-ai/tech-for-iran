import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/header"
import { VStack } from "@/components/layout/stack"
import PodsClientPage from "./page.client"

export const metadata: Metadata = {
  title: "Pods | Crackedbook",
}

export default function PodsPage() {
  return (
    <VStack as="main" className="max-w-lg mx-auto gap-8">
      <PageHeader title="Pods" />

      <PodsClientPage />
    </VStack>
  )
}

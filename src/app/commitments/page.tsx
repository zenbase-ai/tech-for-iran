import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"

export const metadata: Metadata = {
  title: "The Wall of Commitments | Tech for Iran",
  description: "Browse, upvote, and share what founders have pledged to do for a free Iran.",
}

export default function CommitmentsPage() {
  "use memo"

  return (
    <VStack as="main" className="gap-8" items="center" justify="center">
      <PageTitle>The Wall of Commitments</PageTitle>
      <p className="text-muted-foreground">Coming soon.</p>
    </VStack>
  )
}

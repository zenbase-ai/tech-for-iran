import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"

type SignatoryPageProps = {
  params: Promise<{ signatoryId: string }>
}

export async function generateMetadata({ params }: SignatoryPageProps): Promise<Metadata> {
  const { signatoryId } = await params

  return {
    title: "Signatory | Tech for Iran",
    description: `View ${signatoryId}'s pledge to do business with a free Iran.`,
  }
}

export default async function SignatoryPage({ params }: SignatoryPageProps) {
  const { signatoryId } = await params

  return (
    <VStack as="main" className="gap-8" items="center" justify="center">
      <PageTitle>Signatory: {signatoryId}</PageTitle>
      <p className="text-muted-foreground">Coming soon.</p>
    </VStack>
  )
}

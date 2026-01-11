"use client"

import { useQuery } from "convex/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { api } from "@/convex/_generated/api"
import { SignatureProvider, useSignatureContext } from "./context"
import { SignatureForm } from "./form"
import { SignatureItem } from "./item"

const SignatureSectionContent: React.FC = () => {
  const { xUsername } = useSignatureContext()
  const signature = useQuery(
    api.signatures.query.getByXUsername,
    xUsername ? { xUsername } : "skip"
  )

  return signature ? (
    <VStack className="gap-4">
      <SectionTitle>Thanks for signing!</SectionTitle>
      <SignatureItem signature={signature} />
    </VStack>
  ) : (
    <SignatureForm />
  )
}

export const SignatureSection: React.FC<BoxProps> = (props) => (
  <Box {...props}>
    <SignatureProvider>
      <SignatureSectionContent />
    </SignatureProvider>
  </Box>
)

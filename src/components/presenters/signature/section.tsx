"use client"

import { useQuery } from "convex/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { api } from "@/convex/_generated/api"
import { url } from "@/lib/utils"
import { useSignatureContext } from "./context"
import { SignatureForm } from "./form"
import { SignatureItem } from "./item"
import { SignatureShare } from "./share"

export const SignatureSection: React.FC<BoxProps> = (props) => {
  const { xUsername } = useSignatureContext()
  const signature = useQuery(
    api.signatures.query.getByXUsername,
    xUsername ? { xUsername } : "skip"
  )

  return (
    <Box {...props}>
      {signature ? (
        <VStack className="gap-4">
          <SectionTitle>Thanks for signing!</SectionTitle>
          <SignatureItem signature={signature}>
            <SignatureShare url={url(`/sig/${signature._id}`)} />
          </SignatureItem>
        </VStack>
      ) : (
        <SignatureForm />
      )}
    </Box>
  )
}

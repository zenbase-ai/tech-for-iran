import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"
import { Stack } from "@/components/layout/stack"
import { OpenGraph } from "@/components/presenters/opengraph"
import { SignatureItem } from "@/components/presenters/signature/item"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export type OpenGraphPageParams = {
  signatureId: Id<"signatures">
}

export type OpenGraphPageProps = {
  params: Promise<OpenGraphPageParams>
}

export default async function OpenGraphPage({ params }: OpenGraphPageProps) {
  const { signatureId } = await params
  const signature = await fetchQuery(api.signatures.query.get, { signatureId })
  if (!signature) {
    return notFound()
  }

  return (
    <Stack className="mt-[20vh]" items="center" justify="center">
      <OpenGraph>
        <SignatureItem className="flex-1" signature={signature} />
      </OpenGraph>
    </Stack>
  )
}
